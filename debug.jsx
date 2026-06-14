import { useState, useRef, useCallback, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Upload, Download, Loader2, ImagePlus, AlertCircle, Check, Copy, ArrowLeft, Maximize, Focus, Minimize, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

const MAX_SIZE = 10 * 1024 * 1024
const VALID_EXT = ['.jpg', '.jpeg', '.png', '.webp']
const VALID_MIME = ['image/jpeg', 'image/png', 'image/webp']

const DEFAULT_CHARSET = '@%#*+=-:. '
const PIXEL_STRETCH_RATIO = 0.56 // 锁死，不可更改 //锁死，不可更改
const FONT_FAMILY = "'Space Mono', monospace"

export default function AsciiArtTool() {
  const [src, setSrc] = useState('/sample.png')
  const [resolution, setResolution] = useState(100)
  const [charSet, setCharSet] = useState(DEFAULT_CHARSET)
  const [colorMode, setColorMode] = useState(true)
  const [renderStyle, setRenderStyle] = useState('classic')
  const [edgeThreshold, setEdgeThreshold] = useState(30)
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
  const exportRatioRef = useRef(1)

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

  // 1. Parse Image (Run once on src/resolution change)
  useEffect(() => {
    if (!src) return
    let cancel = false

    const img = new Image()
    img.onload = () => {
      if (cancel) return
      
      const imgCanvas = document.createElement('canvas')
      const imgCtx = imgCanvas.getContext('2d', { willReadFrequently: true })
      
      const aspectRatio = img.height / img.width
      const width = resolution
      const height = Math.max(1, Math.round(width * aspectRatio * PIXEL_STRETCH_RATIO))
      
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

      const tmpCanvas = document.createElement('canvas')
      const ctx = tmpCanvas.getContext('2d')
      ctx.font = `10px ${FONT_FAMILY}`
      const charWidth = ctx.measureText('M').width || 6
      const lineHeight = 11

      parsedDataRef.current = { width, height, data, lumArray }
      
      // Auto fit on new image or resolution change
      if (canvasWrapperRef.current) {
        const wrapper = canvasWrapperRef.current.getBoundingClientRect()
        const logicalWidth = width * charWidth
        const logicalHeight = height * lineHeight
        const padding = 64
        const cssWidth = logicalWidth + 48 
        const cssHeight = logicalHeight + 48
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
  }, [src, resolution])

  // 2. Viewport Render Engine (Viewport Culling + Native Matrix)
  const drawCanvas = useCallback(() => {
    if (!renderCanvasRef.current || !canvasWrapperRef.current || !parsedDataRef.current) return
    
    const canvas = renderCanvasRef.current
    const wrapper = canvasWrapperRef.current
    const { width, height, data, lumArray } = parsedDataRef.current
    
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
    
    const logicalWidth = width * charWidth
    const logicalHeight = height * lineHeight
    ctx.translate(-logicalWidth / 2, -logicalHeight / 2)

    // Draw background card
    const pad = 24
    ctx.fillStyle = '#050508'
    ctx.beginPath()
    ctx.roundRect(-pad, -pad, logicalWidth + pad * 2, logicalHeight + pad * 2, 16)
    ctx.fill()

    // Viewport Culling
    const invScale = 1 / transform.scale
    const visibleLeft = (-cx - transform.x) * invScale + logicalWidth / 2 - pad
    const visibleRight = (rect.width - cx - transform.x) * invScale + logicalWidth / 2 + pad
    const visibleTop = (-cy - transform.y) * invScale + logicalHeight / 2 - pad
    const visibleBottom = (rect.height - cy - transform.y) * invScale + logicalHeight / 2 + pad

    let startX = Math.floor(visibleLeft / charWidth)
    let endX = Math.ceil(visibleRight / charWidth)
    let startY = Math.floor(visibleTop / lineHeight)
    let endY = Math.ceil(visibleBottom / lineHeight)

    startX = Math.max(0, Math.min(width, startX))
    endX = Math.max(0, Math.min(width, endX))
    startY = Math.max(0, Math.min(height, startY))
    endY = Math.max(0, Math.min(height, endY))

    const charArray = [...(charSet || DEFAULT_CHARSET)]
    const parsedColors = colorMapText.split(',').map(c => c.trim()).filter(c => c)
    const colorPalette = parsedColors.length > 0 ? parsedColors : ['#ffffff']

    ctx.textBaseline = 'top'
    ctx.font = `10px ${FONT_FAMILY}`

    const getLum = (cx, cy) => {
      if (cx < 0) cx = 0; else if (cx >= width) cx = width - 1;
      if (cy < 0) cy = 0; else if (cy >= height) cy = height - 1;
      return lumArray[cy * width + cx]
    }

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
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
            let colorIdx = Math.floor((luminance / 256) * colorPalette.length)
                colorIdx = Math.max(0, Math.min(colorPalette.length - 1, colorIdx))
            ctx.fillStyle = colorPalette[colorIdx]
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
    
    ctx.restore()
  }, [transform, charSet, colorMode, renderStyle, edgeThreshold, colorMapText])

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => drawCanvas())
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
  }, [src]) // Dependency src to re-attach if necessary

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
    const { width, height } = parsedDataRef.current
    
    const tmpCtx = document.createElement('canvas').getContext('2d')
    tmpCtx.font = `10px ${FONT_FAMILY}`
    const charWidth = tmpCtx.measureText('M').width || 6
    const lineHeight = 11

    const logicalWidth = width * charWidth
    const logicalHeight = height * lineHeight
    
    const padding = 64
    const cssWidth = logicalWidth + 48 
    const cssHeight = logicalHeight + 48
    
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
    const { width, height, lumArray } = parsedDataRef.current
    const charArray = [...(charSet || DEFAULT_CHARSET)]
    let text = ''
    
    const getLum = (cx, cy) => {
      if (cx < 0) cx = 0; else if (cx >= width) cx = width - 1;
      if (cy < 0) cy = 0; else if (cy >= height) cy = height - 1;
      return lumArray[cy * width + cx]
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
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
        text += rawChar
      }
      text += '\n'
    }
    return text
  }, [charSet, renderStyle, edgeThreshold])

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

    const logicalWidth = width * charWidth
    const logicalHeight = height * lineHeight
    
    const pad = 24
    const baseExportWidth = (logicalWidth + pad * 2) * 2
    const baseExportHeight = (logicalHeight + pad * 2) * 2

    exportRatioRef.current = baseExportHeight / baseExportWidth
    setExportWidth(Math.round(baseExportWidth))
    setExportHeight(Math.round(baseExportHeight))
    setShowExportModal(true)
  }, [])

  const handleWidthChange = (val) => {
    const w = parseInt(val) || 0
    setExportWidth(w)
    setExportHeight(Math.round(w * exportRatioRef.current))
  }

  const handleHeightChange = (val) => {
    const h = parseInt(val) || 0
    setExportHeight(h)
    setExportWidth(Math.round(h / exportRatioRef.current))
  }

  const handleExport = useCallback(async () => {
    if (!parsedDataRef.current || exporting) return
    setExporting(true); setError(null); setShowExportModal(false)
    
    requestAnimationFrame(async () => {
      try {
        const { width, height, data, lumArray } = parsedDataRef.current
        
        const tmpCtx = document.createElement('canvas').getContext('2d')
        tmpCtx.font = `10px ${FONT_FAMILY}`
        const charWidth = tmpCtx.measureText('M').width || 6
        const lineHeight = 11

        const logicalWidth = width * charWidth
        const logicalHeight = height * lineHeight
        
        const pad = 24
        const exportCanvas = document.createElement('canvas')
        const scale = exportWidth / (logicalWidth + pad * 2)
        
        exportCanvas.width = exportWidth
        exportCanvas.height = exportHeight
        
        const ctx = exportCanvas.getContext('2d')
        ctx.scale(scale, scale)
        
        ctx.fillStyle = '#050508'
        const radius = 16
        ctx.beginPath()
        ctx.roundRect(0, 0, logicalWidth + pad * 2, logicalHeight + pad * 2, radius)
        ctx.fill()
        
        ctx.textBaseline = 'top'
        ctx.font = `10px ${FONT_FAMILY}`
        
        const charArray = [...(charSet || DEFAULT_CHARSET)]
        const parsedColors = colorMapText.split(',').map(c => c.trim()).filter(c => c)
        const colorPalette = parsedColors.length > 0 ? parsedColors : ['#ffffff']
        
        const getLum = (cx, cy) => {
          if (cx < 0) cx = 0; else if (cx >= width) cx = width - 1;
          if (cy < 0) cy = 0; else if (cy >= height) cy = height - 1;
          return lumArray[cy * width + cx]
        }

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
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
                let colorIdx = Math.floor((luminance / 256) * colorPalette.length)
                colorIdx = Math.max(0, Math.min(colorPalette.length - 1, colorIdx))
                ctx.fillStyle = colorPalette[colorIdx]
              } else {
                ctx.fillStyle = `rgb(${r},${g},${b})`
              }
              ctx.fillText(rawChar, pad + x * charWidth, pad + y * lineHeight)
            } else if (!colorMode && a >= 128) {
              ctx.fillStyle = '#e4e4e7'
              ctx.fillText(rawChar, pad + x * charWidth, pad + y * lineHeight)
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
  }, [exporting, charSet, colorMode, renderStyle, edgeThreshold, colorMapText, exportWidth, exportHeight])

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
                <label className="dcde-caption text-ink-faint block mb-3">分辨率 (字符宽度)</label>
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
                <label className="dcde-caption text-ink-faint block mb-3">字符集</label>
                <input
                  type="text"
                  value={charSet}
                  onChange={(e) => setCharSet(e.target.value)}
                  className="w-full bg-void-raised text-ink rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-ink-dim transition-colors"
                  placeholder="例如: @%#*+=-:. "
                />
              </div>

              <div>
                <label className="dcde-caption text-ink-faint block mb-3">渲染风格</label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button onClick={() => setRenderStyle('classic')} className={clsx(renderStyle === 'classic' ? 'dcde-tag-accent' : 'dcde-tag-muted', 'flex-1 justify-center')}>经典单色</button>
                    <button onClick={() => setRenderStyle('colormap')} className={clsx(renderStyle === 'colormap' ? 'dcde-tag-accent' : 'dcde-tag-muted', 'flex-1 justify-center')}>色彩列表</button>
                  </div>
                  <button onClick={() => setRenderStyle('edge')} className={clsx(renderStyle === 'edge' ? 'dcde-tag-accent' : 'dcde-tag-muted', 'w-full justify-center')}>边缘线稿 (ASCII Edge)</button>
                </div>
              </div>

              {renderStyle === 'colormap' && (
                <div>
                  <label className="dcde-caption text-ink-faint block mb-3">渐变映射颜色表</label>
                  <input
                    type="text"
                    value={colorMapText}
                    onChange={(e) => setColorMapText(e.target.value)}
                    className="w-full bg-void-raised text-ink rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-ink-dim transition-colors font-mono"
                    placeholder="#000, #f00, #fff"
                  />
                  <p className="dcde-caption text-ink-dim mt-2 leading-relaxed">
                    从深到浅，用逗号分隔 HEX 颜色值。
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

              <div>
                <label className="dcde-caption text-ink-faint block mb-3">色彩模式</label>
                <div className="flex gap-2">
                  <button onClick={() => setColorMode(true)} className={clsx(colorMode ? 'dcde-tag-accent' : 'dcde-tag-muted', 'flex-1 justify-center')}>彩色</button>
                  <button onClick={() => setColorMode(false)} className={clsx(!colorMode ? 'dcde-tag-accent' : 'dcde-tag-muted', 'flex-1 justify-center')}>文本</button>
                </div>
              </div>

              <div>
                <label className="dcde-caption text-ink-faint block mb-3">亮度反转</label>
                <div className="flex gap-2">
                  <button onClick={() => setInvert(true)} className={clsx(invert ? 'dcde-tag-accent' : 'dcde-tag-muted', 'flex-1 justify-center')}>反转</button>
                  <button onClick={() => setInvert(false)} className={clsx(!invert ? 'dcde-tag-accent' : 'dcde-tag-muted', 'flex-1 justify-center')}>正常</button>
                </div>
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
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 dcde-caption text-ink-faint pointer-events-none bg-void/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white/5 shadow-lg z-20">
              拖拽平移 · 滚轮缩放
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0d0d12] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold mb-4">导出设置</h3>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1">
                <label className="dcde-caption text-ink-faint block mb-2">宽度 (px)</label>
                <input 
                  type="number" 
                  value={exportWidth} 
                  onChange={(e) => handleWidthChange(e.target.value)}
                  className="w-full bg-void-raised text-ink rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-ink-dim font-mono text-center"
                />
              </div>
              <div className="text-ink-faint mt-6">
                <Lock className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <label className="dcde-caption text-ink-faint block mb-2">高度 (px)</label>
                <input 
                  type="number" 
                  value={exportHeight} 
                  onChange={(e) => handleHeightChange(e.target.value)}
                  className="w-full bg-void-raised text-ink rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-ink-dim font-mono text-center"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowExportModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-ink-faint hover:text-ink hover:bg-white/5 transition-colors">
                取消
              </button>
              <button onClick={handleExport} disabled={exporting} className={clsx("dcde-pill", exporting && "opacity-70 cursor-not-allowed")}>
                {exporting ? <><Loader2 className="w-4 h-4 animate-spin" />导出中...</> : "确认导出"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

AsciiArtTool.isAppLayout = true
