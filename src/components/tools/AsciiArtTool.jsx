import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Upload, Download, Loader2, ImagePlus, AlertCircle, Check, Copy, ArrowLeft, Maximize, Focus, Minimize, Lock, Unlock, Plus, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

const MAX_SIZE = 10 * 1024 * 1024
const VALID_EXT = ['.jpg', '.jpeg', '.png', '.webp']
const VALID_MIME = ['image/jpeg', 'image/png', 'image/webp']

const DEFAULT_CHARSET = '@%#*+=-:. '
const PIXEL_STRETCH_RATIO = 0.56 //锁死，不可更改
const BRAILLE_STRETCH_RATIO = 0.56 // 盲文专属拉伸系数
const FONT_FAMILY = "'Space Mono', monospace"

const BAYER_MATRIX = [
  [ 0,  8,  2, 10 ],
  [12,  4, 14,  6 ],
  [ 3, 11,  1,  9 ],
  [15,  7, 13,  5 ]
]

// 将 hex 颜色解析为 [r, g, b] 数组
function hexToRgb(hex) {
  hex = hex.replace('#', '')
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2]
  return [parseInt(hex.slice(0,2), 16), parseInt(hex.slice(2,4), 16), parseInt(hex.slice(4,6), 16)]
}

// 在调色板上按 t(0~1) 位置进行线性插值采样
function sampleGradient(palette, t) {
  if (!palette || palette.length === 0) return 'rgb(255,255,255)'
  if (palette.length === 1) { const c = hexToRgb(palette[0]); return `rgb(${c[0]},${c[1]},${c[2]})` }
  t = Math.max(0, Math.min(1, t))
  const pos = t * (palette.length - 1)
  const idx = Math.floor(pos)
  const frac = pos - idx
  if (idx >= palette.length - 1) { const c = hexToRgb(palette[palette.length - 1]); return `rgb(${c[0]},${c[1]},${c[2]})` }
  const c0 = hexToRgb(palette[idx])
  const c1 = hexToRgb(palette[idx + 1])
  return `rgb(${Math.round(c0[0]+(c1[0]-c0[0])*frac)},${Math.round(c0[1]+(c1[1]-c0[1])*frac)},${Math.round(c0[2]+(c1[2]-c0[2])*frac)})`
}

const CHARSET_PRESETS = [
  { label: '经典', value: '@%#*+=-:. ' },
  { label: '简约', value: '#*+:. ' },
  { label: '密集', value: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`. ' },
  { label: '色块', value: '█▓▒░ ' },
]

const COLOR_PRESETS = [
  { label: '火焰', colors: ['#000000', '#1e003b', '#70005d', '#d1005a', '#ff6600', '#ffe600'] },
  { label: '海洋', colors: ['#0a0a2e', '#1b3a5c', '#2776a7', '#44b7c2', '#9eecd9', '#f0f8ff'] },
  { label: '森林', colors: ['#0b1a0b', '#1a4a1a', '#3d8b37', '#7ab648', '#c4a632', '#8b6914'] },
  { label: '日落', colors: ['#1a0a2e', '#4a1942', '#b5305a', '#e86830', '#f5a623', '#fde68a'] },
  { label: '黑白', colors: ['#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff'] },
  { label: '✦ 自定义', colors: ['#000000', '#ffffff'] },
]

export default function AsciiArtTool() {
  const [src, setSrc] = useState('/sample.png')
  const [resolution, setResolution] = useState(100)
  const [charSet, setCharSet] = useState(DEFAULT_CHARSET)
  const [colorMode, setColorMode] = useState(true)
  const [renderStyle, setRenderStyle] = useState('classic')
  const [edgeThreshold, setEdgeThreshold] = useState(30)
  const [brailleThreshold, setBrailleThreshold] = useState(128)

  const [colorMapText, setColorMapText] = useState('#000000, #1e003b, #70005d, #d1005a, #ff6600, #ffe600')
  
  const [exporting, setExporting] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportWidth, setExportWidth] = useState(0)
  const [exportHeight, setExportHeight] = useState(0)
  const [lockRatio, setLockRatio] = useState(true)
  const [exportError, setExportError] = useState('')
  const exportRatioRef = useRef(1)
  const exportModalRef = useRef(null)
  const exportWidthInputRef = useRef(null)

  // Infinite Canvas State
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef({ active: false, startX: 0, startY: 0, tx: 0, ty: 0 })

  const containerRef = useRef(null)
  const canvasWrapperRef = useRef(null)
  const renderCanvasRef = useRef(null)
  const inputRef = useRef(null)

  const parsedDataRef = useRef(null)
  const rafRef = useRef(null)

  // 1. Parse Image (Run once on src/resolution/renderStyle change)
  useEffect(() => {
    if (!src) return
    const isBraille = renderStyle === 'braille'

    let cancel = false
    const img = new Image()
    img.onload = () => {
      if (cancel) return
      
      const imgCanvas = document.createElement('canvas')
      const imgCtx = imgCanvas.getContext('2d', { willReadFrequently: true })
      
      const aspectRatio = img.height / img.width
      const width = isBraille ? resolution * 2 : resolution
      const height = isBraille 
        ? Math.max(1, Math.round((width / 2) * aspectRatio * BRAILLE_STRETCH_RATIO * 4))
        : Math.max(1, Math.round(width * aspectRatio * PIXEL_STRETCH_RATIO))
      
      imgCanvas.width = width
      imgCanvas.height = height
      imgCtx.drawImage(img, 0, 0, width, height)
      
      const imgData = imgCtx.getImageData(0, 0, width, height)
      const data = imgData.data
      
      const lumArray = new Float32Array(width * height)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4
          const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3]
          lumArray[y * width + x] = a < 128 ? 0 : (0.299 * r + 0.587 * g + 0.114 * b)
        }
      }

      // 自动对比度拉伸：将实际亮度范围归一化到 0~255
      let minLum = 255, maxLum = 0
      for (let i = 0; i < lumArray.length; i++) {
        if (data[i * 4 + 3] >= 128) {
          if (lumArray[i] < minLum) minLum = lumArray[i]
          if (lumArray[i] > maxLum) maxLum = lumArray[i]
        }
      }
      const lumRange = maxLum - minLum
      if (lumRange > 1) {
        for (let i = 0; i < lumArray.length; i++) {
          if (data[i * 4 + 3] >= 128) {
            lumArray[i] = ((lumArray[i] - minLum) / lumRange) * 255
          }
        }
      }

      const tmpCanvas = document.createElement('canvas')
      const ctx = tmpCanvas.getContext('2d')
      ctx.font = `10px ${FONT_FAMILY}`
      const charWidth = ctx.measureText('M').width || 6
      const lineHeight = 11

      parsedDataRef.current = { width, height, data, lumArray, isBraille }
      
      if (canvasWrapperRef.current) {
        const wrapper = canvasWrapperRef.current.getBoundingClientRect()
        const logicalCols = isBraille ? Math.ceil(width / 2) : width
        const logicalRows = isBraille ? Math.ceil(height / 4) : height
        const logicalWidthPx = logicalCols * charWidth
        const logicalHeightPx = logicalRows * lineHeight
        const padding = 64
        const cssWidth = logicalWidthPx + 48 
        const cssHeight = logicalHeightPx + 48
        const scaleX = (wrapper.width - padding) / cssWidth
        const scaleY = (wrapper.height - padding) / cssHeight
        const newScale = Math.max(0.05, Math.min(scaleX, scaleY, 5))
        setTransform({ x: 0, y: 0, scale: newScale })
      }
    }
    img.onerror = () => {
      if (!cancel) setError('图片加载失败')
    }
    img.src = src

    return () => { cancel = true }
  }, [src, resolution, renderStyle])

  // 2. Viewport Render Engine
  const drawCanvas = useCallback(() => {
    if (!renderCanvasRef.current || !canvasWrapperRef.current || !parsedDataRef.current) return
    
    const canvas = renderCanvasRef.current
    const wrapper = canvasWrapperRef.current
    const { width, height, data, lumArray, isBraille } = parsedDataRef.current
    
    const tmpCtx = document.createElement('canvas').getContext('2d')
    tmpCtx.font = `10px ${FONT_FAMILY}`
    const charWidth = tmpCtx.measureText('M').width || 6
    const lineHeight = 11

    const rect = wrapper.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    const dpr = window.devicePixelRatio || 2
    
    const physicalWidth = Math.ceil(rect.width * dpr)
    const physicalHeight = Math.ceil(rect.height * dpr)
    if (canvas.width !== physicalWidth || canvas.height !== physicalHeight) {
      canvas.width = physicalWidth
      canvas.height = physicalHeight
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    if (!data) return

    ctx.save()
    ctx.scale(dpr, dpr)

    const cx = rect.width / 2
    const cy = rect.height / 2

    ctx.translate(cx + transform.x, cy + transform.y)
    ctx.scale(transform.scale, transform.scale)
    
    // isBraille comes from parsedDataRef, NOT from renderStyle state,
    // so we always render with the style that matches the parsed data dimensions.
    const logicalCols = isBraille ? Math.ceil(width / 2) : width
    const logicalRows = isBraille ? Math.ceil(height / 4) : height
    const logicalWidthPx = logicalCols * charWidth
    const logicalHeightPx = logicalRows * lineHeight
    ctx.translate(-logicalWidthPx / 2, -logicalHeightPx / 2)

    // Draw background card
    const pad = 24
    ctx.fillStyle = '#050508'
    ctx.beginPath()
    ctx.roundRect(-pad, -pad, logicalWidthPx + pad * 2, logicalHeightPx + pad * 2, 16)
    ctx.fill()

    // Viewport Culling
    const invScale = 1 / transform.scale
    const visibleLeft = (-cx - transform.x) * invScale + logicalWidthPx / 2 - pad
    const visibleRight = (rect.width - cx - transform.x) * invScale + logicalWidthPx / 2 + pad
    const visibleTop = (-cy - transform.y) * invScale + logicalHeightPx / 2 - pad
    const visibleBottom = (rect.height - cy - transform.y) * invScale + logicalHeightPx / 2 + pad

    let startX = Math.floor(visibleLeft / charWidth)
    let endX = Math.ceil(visibleRight / charWidth)
    let startY = Math.floor(visibleTop / lineHeight)
    let endY = Math.ceil(visibleBottom / lineHeight)

    startX = Math.max(0, Math.min(logicalCols, startX))
    endX = Math.max(0, Math.min(logicalCols, endX))
    startY = Math.max(0, Math.min(logicalRows, startY))
    endY = Math.max(0, Math.min(logicalRows, endY))

    const charArray = [...(charSet || DEFAULT_CHARSET)]
    const parsedColors = colorMapText.split(',').map(c => c.trim()).filter(c => c)
    const colorPalette = parsedColors.length > 0 ? parsedColors : ['#ffffff']

    ctx.textBaseline = 'top'
    ctx.font = `10px ${FONT_FAMILY}`

    const getLum = (px, py) => {
      if (px < 0) px = 0; else if (px >= width) px = width - 1;
      if (py < 0) py = 0; else if (py >= height) py = height - 1;
      return lumArray[py * width + px]
    }

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        if (isBraille) {
           let brailleValue = 0
           let sumR = 0, sumG = 0, sumB = 0, sumA = 0
           let count = 0
           for (let dy = 0; dy < 4; dy++) {
             for (let dx = 0; dx < 2; dx++) {
               const px = x * 2 + dx
               const py = y * 4 + dy
               if (px < width && py < height) {
                 const l = lumArray[py * width + px]
                 const dither = (BAYER_MATRIX[py % 4][px % 4] / 15 - 0.5) * 160
                 if (l + dither > brailleThreshold) {
                    if (dx === 0 && dy === 0) brailleValue += 1
                    if (dx === 0 && dy === 1) brailleValue += 2
                    if (dx === 0 && dy === 2) brailleValue += 4
                    if (dx === 0 && dy === 3) brailleValue += 64
                    if (dx === 1 && dy === 0) brailleValue += 8
                    if (dx === 1 && dy === 1) brailleValue += 16
                    if (dx === 1 && dy === 2) brailleValue += 32
                    if (dx === 1 && dy === 3) brailleValue += 128
                 }
                 const idx = (py * width + px) * 4
                 sumR += data[idx]; sumG += data[idx+1]; sumB += data[idx+2]; sumA += data[idx+3]
                 count++
               }
             }
           }
           if (brailleValue > 0 || !colorMode) {
             const rawChar = String.fromCharCode(0x2800 + brailleValue)
             if (colorMode && sumA > 0) {
               ctx.fillStyle = `rgb(${Math.round(sumR/count)},${Math.round(sumG/count)},${Math.round(sumB/count)})`
             } else {
               ctx.fillStyle = '#e4e4e7'
             }
             ctx.fillText(rawChar, x * charWidth, y * lineHeight)
           }
        } else {
          const idx = (y * width + x) * 4
          const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3]
          let luminance = lumArray[y * width + x]
          let rawChar = ''
          
          if (renderStyle === 'edge') {
            const dx = getLum(x + 1, y) - getLum(x - 1, y)
            const dy = getLum(x, y + 1) - getLum(x, y - 1)
            const mag = Math.sqrt(dx*dx + dy*dy)
            if (mag > edgeThreshold) {
               let angle = Math.atan2(dy, dx) + Math.PI
               const deg = (angle * 180 / Math.PI) % 180
               if (deg < 22.5 || deg >= 157.5) rawChar = '|'
               else if (deg < 67.5) rawChar = '/'
               else if (deg < 112.5) rawChar = '-'
               else rawChar = '\\'
            }
          }
          
          if (!rawChar) {
            let charIdx = Math.floor(((255 - luminance) / 256) * charArray.length)
            charIdx = Math.max(0, Math.min(charArray.length - 1, charIdx))
            rawChar = charArray[charIdx]
          }
          
          if (colorMode && a >= 128) {
            if (renderStyle === 'colormap') {
              ctx.fillStyle = sampleGradient(colorPalette, luminance / 255)
            } else {
              ctx.fillStyle = `rgb(${r},${g},${b})`
            }
            ctx.fillText(rawChar, x * charWidth, y * lineHeight)
          } else if (!colorMode && a >= 128) {
            ctx.fillStyle = '#e4e4e7'
            ctx.fillText(rawChar, x * charWidth, y * lineHeight)
          }
        }
      }
    }
    
    ctx.restore()
  }, [transform, charSet, colorMode, renderStyle, edgeThreshold, brailleThreshold, colorMapText])

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => drawCanvas())
    
    if (document.fonts) {
      document.fonts.load(`10px ${FONT_FAMILY}`).then(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(() => drawCanvas())
      })
    }
  }, [drawCanvas])

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => drawCanvas())
    })
    if (canvasWrapperRef.current) observer.observe(canvasWrapperRef.current)
    return () => observer.disconnect()
  }, [drawCanvas])

  /* ── Canvas Pan & Zoom ── */
  const handlePointerDown = useCallback((e) => {
    if (e.target.closest('.controls-panel')) return
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, tx: transform.x, ty: transform.y }
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [transform])

  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current.active) return
    setTransform(prev => ({
      ...prev,
      x: dragRef.current.tx + (e.clientX - dragRef.current.startX),
      y: dragRef.current.ty + (e.clientY - dragRef.current.startY)
    }))
  }, [])

  const handlePointerUp = useCallback((e) => {
    dragRef.current.active = false
    setDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }, [])

  useEffect(() => {
    const wrapper = canvasWrapperRef.current
    if (!wrapper) return

    const handleWheel = (e) => {
      if (e.target.closest('.controls-panel')) return
      e.preventDefault()

      const rect = wrapper.getBoundingClientRect()
      const mx = e.clientX - rect.left - rect.width / 2
      const my = e.clientY - rect.top - rect.height / 2

      setTransform(prev => {
        const scaleChange = e.deltaY < 0 ? 1.1 : (e.deltaY > 0 ? 1/1.1 : 1)
        if (scaleChange === 1) return prev
        const newScale = Math.max(0.05, Math.min(20, prev.scale * scaleChange))
        const ratio = newScale / prev.scale
        return {
          x: mx - (mx - prev.x) * ratio,
          y: my - (my - prev.y) * ratio,
          scale: newScale
        }
      })
    }

    wrapper.addEventListener('wheel', handleWheel, { passive: false })
    return () => wrapper.removeEventListener('wheel', handleWheel)
  }, [src])

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  /* ── Actions ── */
  const handleFitScreen = useCallback(() => {
    if (!canvasWrapperRef.current || !parsedDataRef.current) return
    const wrapper = canvasWrapperRef.current.getBoundingClientRect()
    const { width, height, isBraille } = parsedDataRef.current

    const tmpCtx = document.createElement('canvas').getContext('2d')
    tmpCtx.font = `10px ${FONT_FAMILY}`
    const charWidth = tmpCtx.measureText('M').width || 6
    const lineHeight = 11

    const logicalCols = isBraille ? Math.ceil(width / 2) : width
    const logicalRows = isBraille ? Math.ceil(height / 4) : height
    const logicalWidthPx = logicalCols * charWidth
    const logicalHeightPx = logicalRows * lineHeight
    
    const padding = 64
    const cssWidth = logicalWidthPx + 48 
    const cssHeight = logicalHeightPx + 48
    
    const scaleX = (wrapper.width - padding) / cssWidth
    const scaleY = (wrapper.height - padding) / cssHeight
    const newScale = Math.max(0.05, Math.min(scaleX, scaleY, 5))
    
    setTransform({ x: 0, y: 0, scale: newScale })
  }, [])

  const handleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      canvasWrapperRef.current?.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }, [])

  const getFullAsciiText = useCallback(() => {
    if (!parsedDataRef.current) return ''
    const { width, height, lumArray, isBraille } = parsedDataRef.current
    const charArray = [...(charSet || DEFAULT_CHARSET)]
    let text = ''
    
    const logicalCols = isBraille ? Math.ceil(width / 2) : width
    const logicalRows = isBraille ? Math.ceil(height / 4) : height

    const getLum = (px, py) => {
      if (px < 0) px = 0; else if (px >= width) px = width - 1;
      if (py < 0) py = 0; else if (py >= height) py = height - 1;
      return lumArray[py * width + px]
    }

    for (let cy = 0; cy < logicalRows; cy++) {
      for (let cx = 0; cx < logicalCols; cx++) {
        if (isBraille) {
           let brailleValue = 0
           for (let dy = 0; dy < 4; dy++) {
             for (let dx = 0; dx < 2; dx++) {
               const px = cx * 2 + dx
               const py = cy * 4 + dy
               if (px < width && py < height) {
                 const l = lumArray[py * width + px]
                 const dither = (BAYER_MATRIX[py % 4][px % 4] / 15 - 0.5) * 160
                 if (l + dither > brailleThreshold) {
                    if (dx === 0 && dy === 0) brailleValue += 1
                    if (dx === 0 && dy === 1) brailleValue += 2
                    if (dx === 0 && dy === 2) brailleValue += 4
                    if (dx === 0 && dy === 3) brailleValue += 64
                    if (dx === 1 && dy === 0) brailleValue += 8
                    if (dx === 1 && dy === 1) brailleValue += 16
                    if (dx === 1 && dy === 2) brailleValue += 32
                    if (dx === 1 && dy === 3) brailleValue += 128
                 }
               }
             }
           }
           text += String.fromCharCode(0x2800 + brailleValue)
        } else {
          let luminance = lumArray[cy * width + cx]
          let rawChar = ''
          if (renderStyle === 'edge') {
            const dx = getLum(cx + 1, cy) - getLum(cx - 1, cy)
            const dy = getLum(cx, cy + 1) - getLum(cx, cy - 1)
            const mag = Math.sqrt(dx*dx + dy*dy)
            if (mag > edgeThreshold) {
               let angle = Math.atan2(dy, dx) + Math.PI
               const deg = (angle * 180 / Math.PI) % 180
               if (deg < 22.5 || deg >= 157.5) rawChar = '|'
               else if (deg < 67.5) rawChar = '/'
               else if (deg < 112.5) rawChar = '-'
               else rawChar = '\\'
            }
          }
          if (!rawChar) {
            let charIdx = Math.floor(((255 - luminance) / 256) * charArray.length)
            charIdx = Math.max(0, Math.min(charArray.length - 1, charIdx))
            rawChar = charArray[charIdx]
          }
          text += rawChar
        }
      }
      text += '\n'
    }
    return text
  }, [charSet, renderStyle, edgeThreshold, brailleThreshold])

  const handleCopy = useCallback(() => {
    const text = getFullAsciiText()
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 3000)
    }).catch(() => setError('复制失败'))
  }, [getFullAsciiText])

  const openExportModal = useCallback(() => {
    if (!parsedDataRef.current) return
    const { width, height } = parsedDataRef.current
    
    const tmpCtx = document.createElement('canvas').getContext('2d')
    tmpCtx.font = `10px ${FONT_FAMILY}`
    const charWidth = tmpCtx.measureText('M').width || 6
    const lineHeight = 11

    const isBraille = parsedDataRef.current.isBraille
    const logicalCols = isBraille ? Math.ceil(width / 2) : width
    const logicalRows = isBraille ? Math.ceil(height / 4) : height
    const logicalWidthPx = logicalCols * charWidth
    const logicalHeightPx = logicalRows * lineHeight
    
    const pad = 24
    const baseExportWidth = (logicalWidthPx + pad * 2) * 2
    const baseExportHeight = (logicalHeightPx + pad * 2) * 2

    exportRatioRef.current = baseExportHeight / baseExportWidth
    setExportWidth(Math.round(baseExportWidth))
    setExportHeight(Math.round(baseExportHeight))
    setLockRatio(true)
    setExportError('')
    setShowExportModal(true)
    setTimeout(() => exportWidthInputRef.current?.select(), 50)
  }, [])

  const validateExportSize = useCallback((w, h) => {
    if (w < 10 || h < 10) return '宽高不能小于 10 px'
    if (w > 16384 || h > 16384) return '宽高不能超过 16384 px'
    if (w * h > 16384 * 16384) return '画布面积过大，请缩小尺寸'
    return ''
  }, [])

  const handleWidthChange = useCallback((val) => {
    const w = parseInt(val) || 0
    const h = lockRatio ? Math.round(w * exportRatioRef.current) : exportHeight
    setExportWidth(w)
    setExportHeight(h)
    setExportError(validateExportSize(w, h))
  }, [lockRatio, exportHeight, validateExportSize])

  const handleHeightChange = useCallback((val) => {
    const h = parseInt(val) || 0
    const w = lockRatio ? Math.round(h / exportRatioRef.current) : exportWidth
    setExportHeight(h)
    setExportWidth(w)
    setExportError(validateExportSize(w, h))
  }, [lockRatio, exportWidth, validateExportSize])

  const handlePresetScale = useCallback((scale) => {
    if (!parsedDataRef.current) return
    const { width, height } = parsedDataRef.current
    const tmpCtx = document.createElement('canvas').getContext('2d')
    tmpCtx.font = `10px ${FONT_FAMILY}`
    const charWidth = tmpCtx.measureText('M').width || 6
    const lineHeight = 11
    const isBraille = parsedDataRef.current.isBraille
    const logicalCols = isBraille ? Math.ceil(width / 2) : width
    const logicalRows = isBraille ? Math.ceil(height / 4) : height
    const logicalWidthPx = logicalCols * charWidth
    const logicalHeightPx = logicalRows * lineHeight
    const pad = 24
    const w = Math.round((logicalWidthPx + pad * 2) * scale)
    const h = Math.round((logicalHeightPx + pad * 2) * scale)
    setExportWidth(w)
    setExportHeight(h)
    setExportError(validateExportSize(w, h))
  }, [validateExportSize])

  const exportPreview = useMemo(() => {
    const previewScale = Math.min(1, 120 / exportWidth, 120 / exportHeight)
    const previewW = Math.max(1, Math.round(exportWidth * previewScale))
    const previewH = Math.max(1, Math.round(exportHeight * previewScale))
    const estimatedMB = ((exportWidth * exportHeight * 4) / (1024 * 1024) * 0.3).toFixed(1)
    return { previewW, previewH, estimatedMB }
  }, [exportWidth, exportHeight])

  const handleExportKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setShowExportModal(false)
    }
  }, [])

  const handleExport = useCallback(async () => {
    if (!parsedDataRef.current || exporting) return
    setExporting(true); setError(null); setShowExportModal(false)
    
    requestAnimationFrame(async () => {
      try {
        const { width, height, data, lumArray, isBraille } = parsedDataRef.current
        
        const tmpCtx = document.createElement('canvas').getContext('2d')
        tmpCtx.font = `10px ${FONT_FAMILY}`
        const charWidth = tmpCtx.measureText('M').width || 6
        const lineHeight = 11

        const logicalCols = isBraille ? Math.ceil(width / 2) : width
        const logicalRows = isBraille ? Math.ceil(height / 4) : height
        const logicalWidthPx = logicalCols * charWidth
        const logicalHeightPx = logicalRows * lineHeight
        
        const pad = 24
        const exportCanvas = document.createElement('canvas')
        const scale = exportWidth / (logicalWidthPx + pad * 2)
        
        exportCanvas.width = exportWidth
        exportCanvas.height = exportHeight
        
        const ctx = exportCanvas.getContext('2d')
        ctx.scale(scale, scale)
        
        ctx.fillStyle = '#050508'
        const radius = 16
        ctx.beginPath()
        ctx.roundRect(0, 0, logicalWidthPx + pad * 2, logicalHeightPx + pad * 2, radius)
        ctx.fill()
        
        ctx.textBaseline = 'top'
        ctx.font = `10px ${FONT_FAMILY}`
        
        const charArray = [...(charSet || DEFAULT_CHARSET)]
        const parsedColors = colorMapText.split(',').map(c => c.trim()).filter(c => c)
        const colorPalette = parsedColors.length > 0 ? parsedColors : ['#ffffff']
        
        const getLum = (px, py) => {
          if (px < 0) px = 0; else if (px >= width) px = width - 1;
          if (py < 0) py = 0; else if (py >= height) py = height - 1;
          return lumArray[py * width + px]
        }

        for (let cy = 0; cy < logicalRows; cy++) {
          for (let cx = 0; cx < logicalCols; cx++) {
            if (isBraille) {
               let brailleValue = 0
               let sumR = 0, sumG = 0, sumB = 0, sumA = 0
               let count = 0
               for (let dy = 0; dy < 4; dy++) {
                 for (let dx = 0; dx < 2; dx++) {
                   const px = cx * 2 + dx
                   const py = cy * 4 + dy
                   if (px < width && py < height) {
                     const l = lumArray[py * width + px]
                     const dither = (BAYER_MATRIX[py % 4][px % 4] / 15 - 0.5) * 160
                     if (l + dither > brailleThreshold) {
                        if (dx === 0 && dy === 0) brailleValue += 1
                        if (dx === 0 && dy === 1) brailleValue += 2
                        if (dx === 0 && dy === 2) brailleValue += 4
                        if (dx === 0 && dy === 3) brailleValue += 64
                        if (dx === 1 && dy === 0) brailleValue += 8
                        if (dx === 1 && dy === 1) brailleValue += 16
                        if (dx === 1 && dy === 2) brailleValue += 32
                        if (dx === 1 && dy === 3) brailleValue += 128
                     }
                     const idx = (py * width + px) * 4
                     sumR += data[idx]; sumG += data[idx+1]; sumB += data[idx+2]; sumA += data[idx+3]
                     count++
                   }
                 }
               }
               if (brailleValue > 0 || !colorMode) {
                 const rawChar = String.fromCharCode(0x2800 + brailleValue)
                 if (colorMode && sumA > 0) {
                   ctx.fillStyle = `rgb(${Math.round(sumR/count)},${Math.round(sumG/count)},${Math.round(sumB/count)})`
                 } else {
                   ctx.fillStyle = '#e4e4e7'
                 }
                 ctx.fillText(rawChar, pad + cx * charWidth, pad + cy * lineHeight)
               }
            } else {
              const idx = (cy * width + cx) * 4
              const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3]
              
              let luminance = lumArray[cy * width + cx]
              let rawChar = ''
              
              if (renderStyle === 'edge') {
                const dx = getLum(cx + 1, cy) - getLum(cx - 1, cy)
                const dy = getLum(cx, cy + 1) - getLum(cx, cy - 1)
                const mag = Math.sqrt(dx*dx + dy*dy)
                if (mag > edgeThreshold) {
                   let angle = Math.atan2(dy, dx) + Math.PI
                   const angleDeg = (angle * 180 / Math.PI) % 180
                   if (angleDeg < 22.5 || angleDeg >= 157.5) rawChar = '|'
                   else if (angleDeg < 67.5) rawChar = '/'
                   else if (angleDeg < 112.5) rawChar = '-'
                   else rawChar = '\\'
                }
              }
              
              if (!rawChar) {
                let charIdx = Math.floor(((255 - luminance) / 256) * charArray.length)
                charIdx = Math.max(0, Math.min(charArray.length - 1, charIdx))
                rawChar = charArray[charIdx]
              }
              
              if (colorMode && a >= 128) {
                if (renderStyle === 'colormap') {
                  ctx.fillStyle = sampleGradient(colorPalette, luminance / 255)
                } else {
                  ctx.fillStyle = `rgb(${r},${g},${b})`
                }
                ctx.fillText(rawChar, pad + cx * charWidth, pad + cy * lineHeight)
              } else if (!colorMode && a >= 128) {
                ctx.fillStyle = '#e4e4e7'
                ctx.fillText(rawChar, pad + cx * charWidth, pad + cy * lineHeight)
              }
            }
          }
        }
        
        const url = exportCanvas.toDataURL('image/png')
        const d = new Date()
        const p = (n) => String(n).padStart(2, '0')
        const ts = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
        const a = document.createElement('a')
        a.download = `ascii_art_${ts}.png`
        a.href = url
        a.click()
        
        setExportSuccess(true)
        setTimeout(() => setExportSuccess(false), 3000)
      } catch {
        setError('导出失败，请重试')
      } finally {
        setExporting(false)
      }
    })
  }, [exporting, charSet, colorMode, renderStyle, edgeThreshold, brailleThreshold, colorMapText, exportWidth, exportHeight])

  /* ── File handling ── */
  const validate = useCallback((f) => {
    if (!f) return '请选择文件'
    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase()
    if (!VALID_EXT.includes(ext) && !VALID_MIME.includes(f.type)) return '仅支持 JPG, PNG, WEBP 格式'
    if (f.size > MAX_SIZE) return '文件大小不能超过 10MB'
    return null
  }, [])

  const loadFile = useCallback((f) => {
    const err = validate(f)
    if (err) { setError(err); return }
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => { 
      setSrc(e.target.result)
    }
    reader.onerror = () => setError('文件读取失败')
    reader.readAsDataURL(f)
  }, [validate])

  const onDragOver = useCallback((e) => { e.preventDefault(); setDragOver(true) }, [])
  const onDragLeave = useCallback((e) => { e.preventDefault(); setDragOver(false) }, [])
  const onDrop = useCallback((e) => { e.preventDefault(); setDragOver(false); loadFile(e.dataTransfer.files[0]) }, [loadFile])
  const onInput = useCallback((e) => { const f = e.target.files[0]; if (f) loadFile(f) }, [loadFile])

  const triggerUpload = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.value = ''
      inputRef.current.click()
    }
  }, [])

  /* ── Entrance animation ── */
  useGSAP(() => {
    const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) { gsap.set('.stk-upload,.stk-workspace', { autoAlpha: 1, y: 0 }); return }
    gsap.from('.stk-upload,.stk-workspace', { autoAlpha: 0, y: 16, duration: 0.6, ease: 'expo.out', stagger: 0.1 })
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className="flex-1 flex flex-col bg-[#050508] text-white overflow-hidden relative">
      <header className="shrink-0 h-14 md:h-16 bg-[#0a0a0f] border-b border-white/5 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-ink-dim hover:text-ink transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> 返回
          </Link>
          <div className="w-px h-4 bg-white/10" />
          <h1 className="text-base font-bold tracking-tight">ASCII 字符画生成器</h1>
        </div>
      </header>
      
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={onInput} className="hidden" />

      {!src ? (
        <div className="flex-1 flex items-center justify-center py-10 min-h-0">
          <div className="stk-upload w-full max-w-lg" onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
            <div
              className={clsx(
                'flex flex-col items-center gap-5 rounded-3xl border-2 border-dashed p-12 transition-all duration-300 cursor-pointer',
                dragOver ? 'border-accent bg-accent-pale' : 'border-ink-faint/30 hover:border-ink-dim/50'
              )}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="w-10 h-10 text-ink-dim" />
              <div className="text-center">
                <p className="dcde-body text-ink">拖拽图片到此处，或点击上传</p>
                <p className="dcde-caption text-ink-faint mt-2">支持 JPG, PNG, WEBP · 最大 10MB</p>
              </div>
            </div>
            {error && <div className="flex items-center gap-2 mt-4 text-red-400 dcde-body justify-center"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
          </div>
        </div>
      ) : (
        <div className="stk-workspace flex-1 flex flex-col lg:flex-row min-h-0 w-full" style={{ touchAction: 'none' }}>
          
          <aside className="w-full lg:w-72 bg-[#0d0d12] border-r border-white/5 flex flex-col shrink-0 custom-scrollbar overflow-y-auto p-6 z-10 relative">
            <div className="flex flex-col gap-6">
              <div>
                <label className="dcde-caption text-ink-faint block mb-3">分辨率 ({renderStyle === 'braille' ? '细粒度网格' : '字符宽度'})</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min="30" max="250" step="10"
                    value={resolution}
                    onChange={(e) => setResolution(+e.target.value)}
                    className="flex-1"
                    style={{ accentColor: 'var(--color-accent)' }}
                  />
                  <span className="text-sm text-ink-dim w-10 text-right font-mono">{resolution}</span>
                </div>
              </div>

              <div>
                <label className="dcde-caption text-ink-faint block mb-3">渲染风格</label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button onClick={() => setRenderStyle('classic')} className={clsx(renderStyle === 'classic' ? 'dcde-tag-accent' : 'dcde-tag-muted', 'flex-1 justify-center')}>经典</button>
                    <button onClick={() => setRenderStyle('colormap')} className={clsx(renderStyle === 'colormap' ? 'dcde-tag-accent' : 'dcde-tag-muted', 'flex-1 justify-center')}>色彩</button>
                    <button onClick={() => setRenderStyle('braille')} className={clsx(renderStyle === 'braille' ? 'dcde-tag-accent' : 'dcde-tag-muted', 'flex-1 justify-center')}>盲文</button>
                  </div>
                  <button onClick={() => setRenderStyle('edge')} className={clsx(renderStyle === 'edge' ? 'dcde-tag-accent' : 'dcde-tag-muted', 'w-full justify-center')}>边缘线稿 (ASCII Edge)</button>
                </div>
              </div>

              {renderStyle !== 'braille' && (
                <div>
                  <label className="dcde-caption text-ink-faint block mb-3">字符集</label>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {CHARSET_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => setCharSet(p.value)}
                        className={clsx(
                          'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                          charSet === p.value
                            ? 'bg-accent/20 text-accent border border-accent/40'
                            : 'bg-white/5 text-ink-dim hover:bg-white/10 border border-transparent'
                        )}
                      >{p.label}</button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={charSet}
                    onChange={(e) => setCharSet(e.target.value)}
                    className="w-full bg-[#18181b] text-ink rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-ink-dim transition-colors font-mono"
                    placeholder="从浓到淡的字符序列"
                  />
                </div>
              )}

              {renderStyle === 'colormap' && (
                <div>
                  <label className="dcde-caption text-ink-faint block mb-3">渐变色彩表</label>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {COLOR_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => setColorMapText(p.colors.join(', '))}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
                      >
                        <span className="flex -space-x-0.5">
                          {p.colors.slice(0, 4).map((c, i) => (
                            <span key={i} className="w-3 h-3 rounded-full border border-black/30" style={{ backgroundColor: c }} />
                          ))}
                        </span>
                        <span className="text-xs text-ink-dim">{p.label}</span>
                      </button>
                    ))}
                  </div>
                  {(() => {
                    const colors = colorMapText.split(',').map(c => c.trim()).filter(c => c)
                    return (
                      <div className="flex flex-wrap items-center gap-2">
                        {colors.map((color, idx) => (
                          <div key={idx} className="relative group">
                            <label
                              className="block w-8 h-8 rounded-lg cursor-pointer border-2 border-white/10 hover:border-white/30 transition-colors shadow-md"
                              style={{ backgroundColor: color }}
                              title={color}
                            >
                              <input
                                type="color"
                                value={color.length === 4 ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}` : color}
                                onChange={(e) => {
                                  const updated = [...colors]
                                  updated[idx] = e.target.value
                                  setColorMapText(updated.join(', '))
                                }}
                                className="sr-only"
                              />
                            </label>
                            {colors.length > 2 && (
                              <button
                                onClick={() => {
                                  const updated = colors.filter((_, i) => i !== idx)
                                  setColorMapText(updated.join(', '))
                                }}
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => setColorMapText(colorMapText + ', #ffffff')}
                          className="w-8 h-8 rounded-lg border-2 border-dashed border-white/15 hover:border-white/30 flex items-center justify-center text-ink-dim hover:text-ink transition-colors"
                          title="添加颜色"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })()}
                  <p className="dcde-caption text-ink-dim mt-3 leading-relaxed">
                    由暗到亮排列，点击色块可直接换色。
                  </p>
                </div>
              )}

              {renderStyle === 'edge' && (
                <div>
                  <label className="dcde-caption text-ink-faint block mb-3">线条敏感度 (阈值)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range" min="5" max="150" step="1"
                      value={edgeThreshold}
                      onChange={(e) => setEdgeThreshold(+e.target.value)}
                      className="flex-1"
                      style={{ accentColor: 'var(--color-accent)' }}
                    />
                    <span className="text-sm text-ink-dim w-10 text-right font-mono">{edgeThreshold}</span>
                  </div>
                </div>
              )}

              {renderStyle === 'braille' && (
                <>
                  <div>
                    <label className="dcde-caption text-ink-faint block mb-3">点阵密度阈值</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range" min="1" max="254" step="1"
                        value={brailleThreshold}
                        onChange={(e) => setBrailleThreshold(+e.target.value)}
                        className="flex-1"
                        style={{ accentColor: 'var(--color-accent)' }}
                      />
                      <span className="text-sm text-ink-dim w-10 text-right font-mono">{brailleThreshold}</span>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="dcde-caption text-ink-faint block mb-3">色彩模式</label>
                <div className="flex gap-2">
                  <button onClick={() => setColorMode(true)} className={clsx(colorMode ? 'dcde-tag-accent' : 'dcde-tag-muted', 'flex-1 justify-center')}>彩色</button>
                  <button onClick={() => setColorMode(false)} className={clsx(!colorMode ? 'dcde-tag-accent' : 'dcde-tag-muted', 'flex-1 justify-center')}>单色</button>
                </div>
              </div>

              <div 
                onClick={triggerUpload}
                onDragOver={onDragOver} 
                onDragLeave={onDragLeave} 
                onDrop={onDrop}
                className={clsx(
                  "mt-2 flex flex-col items-center justify-center gap-2 py-6 px-4 rounded-xl border-2 border-dashed transition-all cursor-pointer",
                  dragOver ? "border-accent bg-accent-pale" : "border-white/10 hover:border-white/30 bg-void"
                )}
              >
                <ImagePlus className="w-5 h-5 text-ink-dim" />
                <span className="text-sm text-ink-dim">点击或拖拽新图片</span>
              </div>

              <div className="dcde-rule-solid" />

              <div className="space-y-3">
                <button onClick={openExportModal} disabled={!src} className={clsx('dcde-pill w-full justify-center', (!src) && 'opacity-70 cursor-not-allowed')}>
                  <Download className="w-4 h-4" /> 导出 PNG
                </button>
                <button onClick={handleCopy} disabled={!src} className={clsx('dcde-tag-muted w-full justify-center', !src && 'opacity-70 cursor-not-allowed')}>
                  <Copy className="w-4 h-4" /> 复制文本
                </button>
              </div>

              {copySuccess && <div className="flex items-center gap-2 text-emerald-400 text-sm"><Check className="w-4 h-4 shrink-0" />已复制到剪贴板</div>}
              {exportSuccess && <div className="flex items-center gap-2 text-emerald-400 text-sm"><Check className="w-4 h-4 shrink-0" />导出成功</div>}
              {error && <div className="flex items-center gap-2 text-red-400 text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
            </div>
          </aside>

          {/* Infinite Canvas */}
          <div 
            ref={canvasWrapperRef}
            className={clsx("flex-1 relative overflow-hidden min-w-0 min-h-0", dragging ? "cursor-grabbing" : "cursor-grab")}
            style={{ backgroundColor: '#18181b' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <canvas ref={renderCanvasRef} className="absolute inset-0 pointer-events-none block" />
          
            <div className="controls-panel absolute top-6 right-6 flex items-center gap-2 z-20">
              <button 
                onClick={handleFitScreen}
                className="dcde-pill bg-void/50 backdrop-blur-md hover:bg-void text-ink border border-white/10"
                title="适应屏幕"
              >
                <Focus className="w-4 h-4" />
              </button>
              <button 
                onClick={handleFullScreen}
                className="dcde-pill bg-void/50 backdrop-blur-md hover:bg-void text-ink border border-white/10"
                title="全屏"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div
          ref={exportModalRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onKeyDown={handleExportKeyDown}
          onClick={(e) => { if (e.target === e.currentTarget) setShowExportModal(false) }}
        >
          <div className="bg-[#0d0d12] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-0">
              <h3 className="text-lg font-bold">导出 PNG</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preview */}
            <div className="px-6 pt-4 pb-2 flex items-center justify-center">
              <div
                className="rounded-lg border border-white/10 bg-[#18181b] flex items-center justify-center overflow-hidden"
                style={{ width: Math.max(exportPreview.previewW, 40), height: Math.max(exportPreview.previewH, 30) }}
              >
                <div
                  className="rounded bg-[#050508]"
                  style={{ width: Math.max(exportPreview.previewW - 8, 8), height: Math.max(exportPreview.previewH - 6, 6) }}
                />
              </div>
            </div>
            <div className="px-6 pb-1 text-center">
              <span className="dcde-caption text-ink-faint">
                {exportWidth} × {exportHeight} px · 约 {exportPreview.estimatedMB} MB
              </span>
            </div>

            {/* Preset scales */}
            <div className="px-6 pt-3">
              <label className="dcde-caption text-ink-faint block mb-2">快捷倍率</label>
              <div className="flex gap-2">
                {[
                  { label: '1×', scale: 1 },
                  { label: '2×', scale: 2 },
                  { label: '4×', scale: 4 },
                  { label: '8×', scale: 8 },
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={() => handlePresetScale(p.scale)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors border bg-white/5 text-ink-dim border-white/10 hover:bg-white/10 hover:text-ink"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Width / Height inputs */}
            <div className="px-6 pt-4">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="dcde-caption text-ink-faint block mb-2">宽度</label>
                  <div className="relative">
                    <input
                      ref={exportWidthInputRef}
                      type="number"
                      min="10"
                      max="16384"
                      value={exportWidth}
                      onChange={(e) => handleWidthChange(e.target.value)}
                      className="w-full bg-[#18181b] text-ink rounded-lg px-4 py-2.5 pr-10 text-sm outline-none focus:ring-1 focus:ring-accent/60 font-mono text-center transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-faint pointer-events-none">px</span>
                  </div>
                </div>

                <button
                  onClick={() => setLockRatio((v) => !v)}
                  className={clsx(
                    'w-9 h-9 rounded-lg flex items-center justify-center transition-colors mb-0.5',
                    lockRatio
                      ? 'bg-accent/15 text-accent border border-accent/30'
                      : 'bg-white/5 text-ink-faint border border-white/10 hover:text-ink hover:bg-white/10'
                  )}
                  title={lockRatio ? '解锁宽高比' : '锁定宽高比'}
                >
                  {lockRatio ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>

                <div className="flex-1">
                  <label className="dcde-caption text-ink-faint block mb-2">高度</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="10"
                      max="16384"
                      value={exportHeight}
                      onChange={(e) => handleHeightChange(e.target.value)}
                      className="w-full bg-[#18181b] text-ink rounded-lg px-4 py-2.5 pr-10 text-sm outline-none focus:ring-1 focus:ring-accent/60 font-mono text-center transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-faint pointer-events-none">px</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Error */}
            {exportError && (
              <div className="px-6 pt-3 flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />{exportError}
              </div>
            )}

            {/* Footer buttons */}
            <div className="px-6 pt-4 pb-6 flex items-center justify-between">
              <span className="text-xs text-ink-faint">Enter 确认 · Esc 取消</span>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-ink-faint hover:text-ink hover:bg-white/5 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleExport}
                  disabled={exporting || !!exportError}
                  className={clsx(
                    "dcde-pill",
                    (exporting || !!exportError) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {exporting ? <><Loader2 className="w-4 h-4 animate-spin" />导出中…</> : <><Download className="w-4 h-4" />导出</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

AsciiArtTool.isAppLayout = true
