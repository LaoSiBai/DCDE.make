import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Upload, RotateCcw, Download, Loader2, ImagePlus, AlertCircle, Check, ArrowLeft, Maximize, Focus, Minimize, Lock, Unlock, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toPng } from 'html-to-image'
import clsx from 'clsx'

/* ── Constants ── */
const MAX_DIM = 1024
const MAX_SIZE = 10 * 1024 * 1024
const VALID_EXT = ['.svg', '.png']
const VALID_MIME = ['image/svg+xml', 'image/png']

/* ── Helper: render sticker with white stroke ── */
function renderSticker(src, stroke) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let w = img.naturalWidth || 300
      let h = img.naturalHeight || 150
      if (w > MAX_DIM || h > MAX_DIM) {
        const s = MAX_DIM / Math.max(w, h)
        w = Math.round(w * s)
        h = Math.round(h * s)
      }
      const pad = Math.ceil(stroke) + 1
      const cw = w + pad * 2
      const ch = h + pad * 2

      // White silhouette
      const sil = document.createElement('canvas')
      sil.width = w
      sil.height = h
      const sc = sil.getContext('2d')
      sc.drawImage(img, 0, 0, w, h)
      sc.globalCompositeOperation = 'source-in'
      sc.fillStyle = 'white'
      sc.fillRect(0, 0, w, h)

      // Sticker canvas — draw silhouette at offsets for stroke
      const out = document.createElement('canvas')
      out.width = cw
      out.height = ch
      const ctx = out.getContext('2d')
      const r = Math.ceil(stroke)
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (dx * dx + dy * dy <= r * r + r) {
            ctx.drawImage(sil, pad + dx, pad + dy)
          }
        }
      }
      // Original image on top
      ctx.drawImage(img, 0, 0, img.naturalWidth || w, img.naturalHeight || h, pad, pad, w, h)
      resolve({ dataUrl: out.toDataURL('image/png'), width: cw, height: ch })
    }
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = src
  })
}

export default function StickerTool() {
  const [src, setSrc] = useState('/sample.png')
  const [sticker, setSticker] = useState(null)
  const [stickerSize, setStickerSize] = useState({ width: 0, height: 0 })
  const [stroke, setStroke] = useState(2)
  const [rx, setRx] = useState(0)
  const [ry, setRy] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [autoRotate, setAutoRotate] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mobileFullscreen, setMobileFullscreen] = useState(false)

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportWidth, setExportWidth] = useState(0)
  const [exportHeight, setExportHeight] = useState(0)
  const [lockRatio, setLockRatio] = useState(true)
  const [exportError, setExportError] = useState('')
  const exportRatioRef = useRef(1)
  const exportModalRef = useRef(null)
  const exportWidthInputRef = useRef(null)

  // Derived: processing = src loaded but sticker not yet generated
  const processing = src !== null && sticker === null && !error

  const containerRef = useRef(null)
  const exportRef = useRef(null)
  const canvasWrapperRef = useRef(null)
  const inputRef = useRef(null)
  const dragRef = useRef({ active: false, sx: 0, sy: 0, srx: 0, sry: 0 })
  const rxRef = useRef(0)
  const ryRef = useRef(0)
  const autoRotateRef = useRef(true)
  const idleTimerRef = useRef(null)

  // Sync rotation refs
  useEffect(() => { rxRef.current = rx }, [rx])
  useEffect(() => { ryRef.current = ry }, [ry])
  useEffect(() => { autoRotateRef.current = autoRotate }, [autoRotate])

  // Process image on upload / stroke change
  useEffect(() => {
    if (!src) return
    let cancel = false
    renderSticker(src, stroke)
      .then((result) => {
        if (!cancel) {
          setSticker(result.dataUrl)
          setStickerSize({ width: result.width, height: result.height })
        }
      })
      .catch((e) => { if (!cancel) setError(e.message) })
    return () => { cancel = true }
  }, [src, stroke])

  // Auto-hide success message
  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(false), 3000)
    return () => clearTimeout(t)
  }, [success])

  // Auto-rotate with idle recovery
  useEffect(() => {
    if (!sticker || !autoRotate) return

    let active = true
    const speed = 0.3 // deg per frame
    const onTick = () => {
      if (!active || dragRef.current.active || !autoRotateRef.current) return
      setRy((prev) => (prev + speed) % 360)
    }
    gsap.ticker.add(onTick)
    return () => { active = false; gsap.ticker.remove(onTick) }
  }, [sticker, autoRotate])

  // Fullscreen state
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  /* ── Compute lighting from rotation ── */
  const getLighting = useCallback((rxVal, ryVal) => {
    // Normalize angles to -180..180
    const normRx = ((rxVal + 180) % 360) - 180
    const normRy = ((ryVal + 180) % 360) - 180

    // Light source from top-right (45deg elevation, 45deg azimuth)
    const lightX = Math.cos((normRy + 45) * Math.PI / 180)
    const lightY = Math.cos((normRx - 45) * Math.PI / 180)

    // Brightness: 0.7 (shadow) to 1.3 (highlight)
    const brightness = 1 + lightX * 0.15 + lightY * 0.15

    // Gradient overlay direction follows rotation
    const gradAngle = 135 + normRy * 0.5
    const highlight = `rgba(255,255,255,${0.15 + Math.max(0, lightX) * 0.2 + Math.max(0, lightY) * 0.1})`
    const shadow = `rgba(0,0,0,${0.25 + Math.max(0, -lightX) * 0.2 + Math.max(0, -lightY) * 0.15})`

    return {
      brightness: Math.max(0.6, Math.min(1.4, brightness)),
      gradient: `linear-gradient(${gradAngle}deg, ${highlight} 0%, transparent 50%, ${shadow} 100%)`,
      shadowBlur: 30 + Math.abs(normRx) * 0.1 + Math.abs(normRy) * 0.1,
      shadowOffsetX: -lightX * 15,
      shadowOffsetY: lightY * 10,
    }
  }, [])

  /* ── File handling ── */
  const validate = useCallback((f) => {
    if (!f) return '请选择文件'
    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase()
    if (!VALID_EXT.includes(ext) && !VALID_MIME.includes(f.type)) return '仅支持 SVG 和 PNG 格式'
    if (f.size > MAX_SIZE) return '文件大小不能超过 10MB'
    return null
  }, [])

  const loadFile = useCallback((f) => {
    const err = validate(f)
    if (err) { setError(err); return }
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => { setSrc(e.target.result); setRx(0); setRy(0) }
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

  /* ── 3D rotation via pointer ── */
  const pauseAutoRotate = useCallback(() => {
    setAutoRotate(false)
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
  }, [])

  const resumeAutoRotate = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => setAutoRotate(true), 4000)
  }, [])

  const onPtrDown = useCallback((e) => {
    if (e.target.closest('.controls-panel')) return
    dragRef.current = { active: true, sx: e.clientX, sy: e.clientY, srx: rxRef.current, sry: ryRef.current }
    setDragging(true)
    pauseAutoRotate()
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [pauseAutoRotate])

  const onPtrMove = useCallback((e) => {
    const d = dragRef.current
    if (!d.active) return
    setRy(Math.max(-180, Math.min(180, d.sry + (e.clientX - d.sx) * 0.5)))
    setRx(Math.max(-180, Math.min(180, d.srx - (e.clientY - d.sy) * 0.5)))
  }, [])

  const onPtrUp = useCallback(() => {
    dragRef.current.active = false
    requestAnimationFrame(() => setDragging(false))
    resumeAutoRotate()
  }, [resumeAutoRotate])

  const resetRotation = useCallback(() => { setRx(0); setRy(0) }, [])

  /* ── Canvas controls ── */
  const handleFitScreen = useCallback(() => {
    // Reset rotation to default view
    setRx(0)
    setRy(0)
  }, [])

  const handleFullScreen = useCallback(() => {
    if (window.innerWidth < 768) {
      setMobileFullscreen(prev => !prev)
    } else {
      if (!document.fullscreenElement) {
        canvasWrapperRef.current?.requestFullscreen?.()
      } else {
        document.exitFullscreen?.()
      }
    }
  }, [])

  /* ── Export Modal ── */
  const openExportModal = useCallback(() => {
    if (!sticker) return
    const baseW = stickerSize.width * 2
    const baseH = stickerSize.height * 2
    exportRatioRef.current = baseH / baseW
    setExportWidth(baseW)
    setExportHeight(baseH)
    setLockRatio(true)
    setExportError('')
    setShowExportModal(true)
    setTimeout(() => exportWidthInputRef.current?.select(), 50)
  }, [sticker, stickerSize])

  const validateExportSize = useCallback((w, h) => {
    if (w < 10 || h < 10) return '宽高不能小于 10 px'
    if (w > 16384 || h > 16384) return '宽高不能超过 16384 px'
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
    const w = Math.round(stickerSize.width * scale)
    const h = Math.round(stickerSize.height * scale)
    setExportWidth(w)
    setExportHeight(h)
    setExportError(validateExportSize(w, h))
  }, [stickerSize, validateExportSize])

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

  /* ── Export ── */
  const handleExport = useCallback(async () => {
    if (!exportRef.current || exporting) return
    setExporting(true); setError(null); setShowExportModal(false)
    try {
      const pixelRatio = Math.max(1, exportWidth / stickerSize.width)
      const url = await toPng(exportRef.current, { pixelRatio, backgroundColor: '#050508' })
      const d = new Date()
      const p = (n) => String(n).padStart(2, '0')
      const ts = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
      const a = document.createElement('a')
      a.download = `3d_sticker_${ts}.png`
      a.href = url
      a.click()
      setSuccess(true)
    } catch {
      setError('导出失败，请重试')
    } finally {
      setExporting(false)
    }
  }, [exporting, exportWidth, stickerSize])

  /* ── Entrance animation ── */
  useGSAP(() => {
    const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) { gsap.set('.stk-upload,.stk-workspace', { autoAlpha: 1, y: 0 }); return }
    gsap.from('.stk-upload,.stk-workspace', { autoAlpha: 0, y: 16, duration: 0.6, ease: 'expo.out', stagger: 0.1 })
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className="flex-1 flex flex-col bg-[#050508] text-white overflow-hidden relative min-h-0">
      {/* ── Header ── */}
      <header className="shrink-0 h-14 md:h-16 bg-[#0a0a0f] border-b border-white/5 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-ink-dim hover:text-ink transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> 返回
          </Link>
          <div className="w-px h-4 bg-white/10" />
          <h1 className="text-base font-bold tracking-tight">3D 贴纸生成器</h1>
        </div>
      </header>

      {/* 隐藏的文件 input */}
      <input ref={inputRef} type="file" accept=".svg,.png,image/svg+xml,image/png" onChange={onInput} className="hidden" />

      {!sticker ? (
        /* ── Upload View ── */
        <div className="flex-1 flex items-center justify-center py-10 min-h-0">
          <div className="stk-upload w-full max-w-lg" onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
            <div
              className={clsx(
                'flex flex-col items-center gap-5 rounded-3xl border-2 border-dashed p-12 transition-all duration-300 cursor-pointer',
                dragOver ? 'border-accent bg-accent-pale' : 'border-ink-faint/30 hover:border-ink-dim/50',
                processing && 'pointer-events-none opacity-50'
              )}
              onClick={() => !processing && inputRef.current?.click()}
            >
              {processing ? <Loader2 className="w-10 h-10 text-accent animate-spin" /> : <Upload className="w-10 h-10 text-ink-dim" />}
              <div className="text-center">
                <p className="dcde-body text-ink">{processing ? '处理中…' : '拖拽图片到此处，或点击上传'}</p>
                <p className="dcde-caption text-ink-faint mt-2">支持 SVG、PNG · 最大 10MB</p>
              </div>
            </div>
            {error && <div className="flex items-center gap-2 mt-4 text-red-400 dcde-body justify-center"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
          </div>
        </div>
      ) : (
        /* ── Workspace View ── */
        <div className="stk-workspace flex-1 flex flex-col-reverse md:flex-row min-h-0 w-full" style={{ touchAction: 'none' }}>

          {/* 左侧控制面板 */}
          <aside data-lenis-prevent="true" className={clsx(
            "w-full md:w-72 h-[45vh] md:h-auto bg-[#0d0d12] border-t md:border-t-0 border-r-0 md:border-r border-white/5 flex-col shrink-0 custom-scrollbar overflow-y-auto p-4 md:p-6 z-10 relative rounded-t-3xl md:rounded-none",
            mobileFullscreen ? "hidden md:flex" : "flex"
          )}>
            <div className="flex flex-col gap-6">
              {/* 描边宽度 */}
              <div>
                <label className="dcde-caption text-ink-faint block mb-3">描边宽度</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min="0" max="10" step="1"
                    value={stroke}
                    onChange={(e) => setStroke(+e.target.value)}
                    className="flex-1"
                    style={{ accentColor: 'var(--color-accent)' }}
                  />
                  <span className="text-sm text-ink-dim w-10 text-right font-mono">{stroke}px</span>
                </div>
              </div>

              {/* 旋转角度 */}
              <div>
                <label className="dcde-caption text-ink-faint block mb-3">旋转角度</label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ink-dim">X 轴</span>
                    <span className="text-sm text-ink font-mono">{rx.toFixed(1)}°</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ink-dim">Y 轴</span>
                    <span className="text-sm text-ink font-mono">{ry.toFixed(1)}°</span>
                  </div>
                </div>
              </div>

              {/* 自动旋转 */}
              <div>
                <label className="dcde-caption text-ink-faint block mb-3">自动旋转</label>
                <div className="flex gap-2">
                  <button onClick={() => setAutoRotate(true)} className={clsx(autoRotate ? 'dcde-tag-accent' : 'dcde-tag-muted', 'flex-1 justify-center')}>开启</button>
                  <button onClick={() => setAutoRotate(false)} className={clsx(!autoRotate ? 'dcde-tag-accent' : 'dcde-tag-muted', 'flex-1 justify-center')}>关闭</button>
                </div>
              </div>

              {/* 重置旋转 */}
              <button onClick={resetRotation} className="dcde-tag-muted w-full justify-center gap-2">
                <RotateCcw className="w-3.5 h-3.5" />重置旋转
              </button>

              {/* 拖拽重新上传区 */}
              <div
                onClick={triggerUpload}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={clsx(
                  'mt-2 flex flex-col items-center justify-center gap-2 py-6 px-4 rounded-xl border-2 border-dashed transition-all cursor-pointer',
                  dragOver ? 'border-accent bg-accent-pale' : 'border-white/10 hover:border-white/30 bg-void'
                )}
              >
                <ImagePlus className="w-5 h-5 text-ink-dim" />
                <span className="text-sm text-ink-dim">点击或拖拽新图片</span>
              </div>

              <div className="dcde-rule-solid" />

              {/* 导出按钮 */}
              <div className="space-y-3">
                <button onClick={openExportModal} disabled={!sticker} className={clsx('dcde-pill w-full justify-center', !sticker && 'opacity-70 cursor-not-allowed')}>
                  <Download className="w-4 h-4" /> 导出 PNG
                </button>
              </div>

              {success && <div className="flex items-center gap-2 text-emerald-400 text-sm"><Check className="w-4 h-4 shrink-0" />导出成功</div>}
              {error && <div className="flex items-center gap-2 text-red-400 text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
            </div>
          </aside>

          {/* 右侧预览区 */}
          <div
            ref={canvasWrapperRef}
            className={clsx(
              'flex-1 flex items-center justify-center select-none overflow-hidden relative min-w-0 min-h-0',
              dragging ? 'cursor-grabbing' : 'cursor-grab'
            )}
            style={{ backgroundColor: '#18181b', perspective: '800px' }}
            onPointerDown={onPtrDown}
            onPointerMove={onPtrMove}
            onPointerUp={onPtrUp}
          >
            <div
              ref={exportRef}
              className="flex items-center justify-center w-full h-full"
              style={{ padding: '40px', backgroundColor: '#050508' }}
            >
              {(() => {
                const light = getLighting(rx, ry)
                return (
                  <div
                    className="relative max-w-full max-h-[60vh]"
                    style={{
                      transform: `rotateX(${rx}deg) rotateY(${ry}deg)`,
                      transition: dragging ? 'none' : 'transform 0.15s ease-out',
                      transformStyle: 'preserve-3d',
                      filter: `drop-shadow(${light.shadowOffsetX}px ${light.shadowOffsetY}px ${light.shadowBlur}px rgba(0,0,0,0.55))`,
                    }}
                  >
                    <img
                      src={sticker}
                      alt="3D Sticker"
                      draggable={false}
                      className="object-contain max-w-full max-h-[60vh]"
                      style={{
                        filter: `brightness(${light.brightness})`,
                        transition: dragging ? 'none' : 'filter 0.15s ease-out',
                      }}
                    />
                    {/* Lighting overlay — follows rotation */}
                    <div
                      className="absolute inset-0 pointer-events-none rounded-[inherit]"
                      style={{
                        background: light.gradient,
                        transition: dragging ? 'none' : 'background 0.15s ease-out',
                        mixBlendMode: 'overlay',
                      }}
                    />
                  </div>
                )
              })()}
            </div>

            {/* 右上角浮动控件 */}
            <div className="controls-panel absolute top-6 right-6 flex items-center gap-2 z-20">
              <button
                onClick={handleFitScreen}
                className="dcde-pill bg-void/50 backdrop-blur-md hover:bg-void text-ink border border-white/10"
                title="重置视角"
              >
                <Focus className="w-4 h-4" />
              </button>
              <button
                onClick={handleFullScreen}
                className="dcde-pill bg-void/50 backdrop-blur-md hover:bg-void text-ink border border-white/10"
                title="全屏"
              >
                {isFullscreen || mobileFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
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

StickerTool.isAppLayout = true
