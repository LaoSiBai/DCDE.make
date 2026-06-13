import { useState, useRef, useCallback, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Upload, Download, Loader2, ImagePlus, AlertCircle, Check, Copy, ArrowLeft, Maximize, Focus, Minimize } from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

const MAX_SIZE = 10 * 1024 * 1024
const VALID_EXT = ['.jpg', '.jpeg', '.png', '.webp']
const VALID_MIME = ['image/jpeg', 'image/png', 'image/webp']

const DEFAULT_CHARSET = '@%#*+=-:. '

// 行高拉伸比例补偿系数。0.46 可以在部分字体下更好地抵消纵向拉伸感。不可更改此参数。
const PIXEL_STRETCH_RATIO = 0.46

export default function AsciiArtTool() {
  const [src, setSrc] = useState('/sample.png')
  const [resolution, setResolution] = useState(100)
  const [charSet, setCharSet] = useState(DEFAULT_CHARSET)
  const [colorMode, setColorMode] = useState(true)
  const [invert, setInvert] = useState(false)
  const [renderStyle, setRenderStyle] = useState('classic') // 'classic', 'colormap', 'edge'
  const [edgeThreshold, setEdgeThreshold] = useState(30)
  const [colorMapText, setColorMapText] = useState('#000000, #1e003b, #70005d, #d1005a, #ff6600, #ffe600')
  
  const [asciiText, setAsciiText] = useState('')

  const [exporting, setExporting] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Infinite Canvas State
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef({ active: false, startX: 0, startY: 0, tx: 0, ty: 0 })

  const containerRef = useRef(null)
  const canvasWrapperRef = useRef(null)
  const renderCanvasRef = useRef(null)
  const inputRef = useRef(null)
  const lastDimensionsRef = useRef('')

  // ASCII Generation
  useEffect(() => {
    if (!src) return
    let cancel = false

    const charArray = [...(charSet || DEFAULT_CHARSET)]
    const parsedColors = colorMapText.split(',').map(c => c.trim()).filter(c => c)
    const colorPalette = parsedColors.length > 0 ? parsedColors : ['#ffffff']
    
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
      
      const canvas = renderCanvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      
      const FONT_SIZE = 10
      const LINE_HEIGHT = 11
      ctx.font = `${FONT_SIZE}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`
      const charWidth = ctx.measureText('M').width || 6
      
      const dpr = window.devicePixelRatio || 2
      const logicalWidth = width * charWidth
      const logicalHeight = height * LINE_HEIGHT
      
      canvas.width = Math.ceil(logicalWidth * dpr) + 2 * dpr
      canvas.height = Math.ceil(logicalHeight * dpr) + 2 * dpr
      canvas.style.width = `${Math.ceil(logicalWidth) + 2}px`
      canvas.style.height = `${Math.ceil(logicalHeight) + 2}px`
      
      ctx.scale(dpr, dpr)
      ctx.textBaseline = 'top'
      ctx.font = `${FONT_SIZE}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`
      
      ctx.clearRect(0, 0, logicalWidth + 2, logicalHeight + 2)
      
      let text = ''
      
      const lumArray = new Float32Array(width * height)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4
          const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3]
          lumArray[y * width + x] = a < 128 ? 0 : (0.299 * r + 0.587 * g + 0.114 * b)
        }
      }
      
      const getLum = (cx, cy) => {
        if (cx < 0) cx = 0; else if (cx >= width) cx = width - 1;
        if (cy < 0) cy = 0; else if (cy >= height) cy = height - 1;
        return lumArray[cy * width + cx]
      }
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4
          const r = data[idx]
          const g = data[idx + 1]
          const b = data[idx + 2]
          const a = data[idx + 3]
          
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
            if (invert) charIdx = charArray.length - 1 - charIdx
            charIdx = Math.max(0, Math.min(charArray.length - 1, charIdx))
            rawChar = charArray[charIdx]
          }
          
          text += rawChar
          
          if (colorMode && a >= 128) {
            if (renderStyle === 'colormap') {
              let colorIdx = Math.floor((luminance / 256) * colorPalette.length)
              if (invert) colorIdx = colorPalette.length - 1 - colorIdx
              colorIdx = Math.max(0, Math.min(colorPalette.length - 1, colorIdx))
              ctx.fillStyle = colorPalette[colorIdx]
            } else {
              ctx.fillStyle = `rgb(${r},${g},${b})`
            }
            ctx.fillText(rawChar, x * charWidth, y * LINE_HEIGHT)
          } else if (!colorMode && a >= 128) {
            ctx.fillStyle = '#e4e4e7'
            ctx.fillText(rawChar, x * charWidth, y * LINE_HEIGHT)
          }
        }
        text += '\n'
      }
      
      setAsciiText(text)
      
      const newDimensions = `${width}x${height}`
      if (lastDimensionsRef.current !== newDimensions) {
        lastDimensionsRef.current = newDimensions
        requestAnimationFrame(() => {
          handleFitScreen()
        })
      }
    }
    img.onerror = () => {
      if (!cancel) {
        setError('图片加载失败')
      }
    }
    img.src = src

    return () => { cancel = true }
  }, [src, resolution, charSet, colorMode, invert, renderStyle, edgeThreshold, colorMapText])

  /* ── Canvas Pan & Zoom ── */
  const handlePointerDown = useCallback((e) => {
    // Only drag on the canvas background, not if clicking on controls
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
      if (e.target.closest('.controls-panel')) return // Allow scrolling in controls panel
      e.preventDefault()

      const rect = wrapper.getBoundingClientRect()
      // Mouse position relative to center of the container
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
    if (!canvasWrapperRef.current || !renderCanvasRef.current) return
    const wrapper = canvasWrapperRef.current.getBoundingClientRect()
    
    // 使用 canvas 原生宽高反推实际逻辑尺寸，更精准
    const dpr = window.devicePixelRatio || 2
    const logicalWidth = renderCanvasRef.current.width / dpr
    const logicalHeight = renderCanvasRef.current.height / dpr
    if (!logicalWidth || !logicalHeight) return

    const cssWidth = logicalWidth + 48 
    const cssHeight = logicalHeight + 48
    
    const padding = 64
    const scaleX = (wrapper.width - padding) / cssWidth
    const scaleY = (wrapper.height - padding) / cssHeight
    const newScale = Math.max(0.05, Math.min(scaleX, scaleY, 1))
    
    setTransform({ x: 0, y: 0, scale: newScale })
  }, [])

  const handleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      canvasWrapperRef.current?.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }, [])

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
      setTransform({ x: 0, y: 0, scale: 1 }) // Reset view
    }
    reader.onerror = () => setError('文件读取失败')
    reader.readAsDataURL(f)
  }, [validate])

  const onDragOver = useCallback((e) => { e.preventDefault(); setDragOver(true) }, [])
  const onDragLeave = useCallback((e) => { e.preventDefault(); setDragOver(false) }, [])
  const onDrop = useCallback((e) => { e.preventDefault(); setDragOver(false); loadFile(e.dataTransfer.files[0]) }, [loadFile])
  const onInput = useCallback((e) => { const f = e.target.files[0]; if (f) loadFile(f) }, [loadFile])

  const reupload = useCallback(() => {
    setSrc(null); setAsciiText(''); setError(null)
    setTransform({ x: 0, y: 0, scale: 1 })
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  /* ── Actions ── */
  const handleCopy = useCallback(() => {
    if (!asciiText) return
    navigator.clipboard.writeText(asciiText).then(() => {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 3000)
    }).catch(() => setError('复制失败'))
  }, [asciiText])

  const handleExport = useCallback(async () => {
    if (!renderCanvasRef.current || exporting || !asciiText) return
    setExporting(true); setError(null)
    
    requestAnimationFrame(async () => {
      try {
        const sourceCanvas = renderCanvasRef.current
        const pad = 24
        const exportCanvas = document.createElement('canvas')
        const scale = 2
        
        const cssWidth = parseFloat(sourceCanvas.style.width)
        const cssHeight = parseFloat(sourceCanvas.style.height)
        
        exportCanvas.width = (cssWidth + pad * 2) * scale
        exportCanvas.height = (cssHeight + pad * 2) * scale
        
        const ctx = exportCanvas.getContext('2d')
        ctx.scale(scale, scale)
        
        // Draw background
        ctx.fillStyle = '#050508'
        
        // Rounded corners
        const radius = 16
        ctx.beginPath()
        ctx.moveTo(radius, 0)
        ctx.lineTo(cssWidth + pad * 2 - radius, 0)
        ctx.quadraticCurveTo(cssWidth + pad * 2, 0, cssWidth + pad * 2, radius)
        ctx.lineTo(cssWidth + pad * 2, cssHeight + pad * 2 - radius)
        ctx.quadraticCurveTo(cssWidth + pad * 2, cssHeight + pad * 2, cssWidth + pad * 2 - radius, cssHeight + pad * 2)
        ctx.lineTo(radius, cssHeight + pad * 2)
        ctx.quadraticCurveTo(0, cssHeight + pad * 2, 0, cssHeight + pad * 2 - radius)
        ctx.lineTo(0, radius)
        ctx.quadraticCurveTo(0, 0, radius, 0)
        ctx.closePath()
        ctx.fill()
        
        // Draw ASCII canvas
        ctx.drawImage(sourceCanvas, pad, pad, cssWidth, cssHeight)
        
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
  }, [exporting, asciiText])

  /* ── Entrance animation ── */
  useGSAP(() => {
    const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) { gsap.set('.stk-upload,.stk-workspace', { autoAlpha: 1, y: 0 }); return }
    gsap.from('.stk-upload,.stk-workspace', { autoAlpha: 0, y: 16, duration: 0.6, ease: 'expo.out', stagger: 0.1 })
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className="flex-1 flex flex-col bg-[#050508] text-white overflow-hidden relative">
      {/* App Header */}
      <header className="shrink-0 h-14 md:h-16 bg-[#0a0a0f] border-b border-white/5 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-ink-dim hover:text-ink transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> 返回
          </Link>
          <div className="w-px h-4 bg-white/10" />
          <h1 className="text-base font-bold tracking-tight">ASCII 字符画生成器</h1>
        </div>
      </header>

      {/* Content Area */}
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
              <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={onInput} className="hidden" />
            </div>
            {error && <div className="flex items-center gap-2 mt-4 text-red-400 dcde-body justify-center"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
          </div>
        </div>
      ) : (
        <div className="stk-workspace flex-1 flex flex-col lg:flex-row min-h-0 w-full" style={{ touchAction: 'none' }}>
          
          {/* Sidebar Controls */}
          <aside className="w-full lg:w-72 bg-[#0d0d12] border-r border-white/5 flex flex-col shrink-0 custom-scrollbar overflow-y-auto p-6 z-10">
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

              <div className="space-y-3">
                <button onClick={reupload} className="dcde-tag-muted w-full justify-center gap-2">
                  <ImagePlus className="w-3.5 h-3.5" />重新上传
                </button>
              </div>

              <div className="dcde-rule-solid" />

              <div className="space-y-3">
                <button onClick={handleExport} disabled={exporting || !asciiText} className={clsx('dcde-pill w-full justify-center', (exporting || !asciiText) && 'opacity-70 cursor-not-allowed')}>
                  {exporting ? <><Loader2 className="w-4 h-4 animate-spin" />导出中...</> : <><Download className="w-4 h-4" />导出 PNG</>}
                </button>
                <button onClick={handleCopy} className="dcde-tag-muted w-full justify-center">
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
            className={clsx("flex-1 relative flex items-center justify-center overflow-hidden min-w-0 min-h-0", dragging ? "cursor-grabbing" : "cursor-grab")}
            style={{ backgroundColor: '#18181b' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div 
              className="will-change-transform origin-center transition-transform"
              style={{
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                transitionDuration: dragging ? '0ms' : '100ms',
                transitionTimingFunction: 'ease-out'
              }}
            >
              <div className="bg-[#050508] p-6 rounded-2xl inline-flex shadow-2xl select-none">
                <canvas ref={renderCanvasRef} className="pointer-events-none block" />
              </div>
            </div>
          
            {/* View Controls */}
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
            
            {/* Zoom Hint */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 dcde-caption text-ink-faint pointer-events-none bg-void/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white/5 shadow-lg z-20">
              拖拽平移 · 滚轮缩放
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

AsciiArtTool.isAppLayout = true
