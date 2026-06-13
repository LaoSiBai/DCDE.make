import { useState, useRef, useCallback, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Upload, RotateCcw, Download, Loader2, ImagePlus, AlertCircle, Check } from 'lucide-react'
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
      resolve(out.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = src
  })
}

export default function StickerTool() {
  const [src, setSrc] = useState('/sample.png')
  const [sticker, setSticker] = useState(null)
  const [stroke, setStroke] = useState(2)
  const [rx, setRx] = useState(0)
  const [ry, setRy] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [hintVisible, setHintVisible] = useState(true)
  const [autoRotate, setAutoRotate] = useState(true)

  // Derived: processing = src loaded but sticker not yet generated
  const processing = src !== null && sticker === null && !error

  const containerRef = useRef(null)
  const exportRef = useRef(null)
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
      .then((url) => { if (!cancel) setSticker(url) })
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
    reader.onload = (e) => { setSrc(e.target.result); setRx(0); setRy(0); setHintVisible(true) }
    reader.onerror = () => setError('文件读取失败')
    reader.readAsDataURL(f)
  }, [validate])

  const onDragOver = useCallback((e) => { e.preventDefault(); setDragOver(true) }, [])
  const onDragLeave = useCallback((e) => { e.preventDefault(); setDragOver(false) }, [])
  const onDrop = useCallback((e) => { e.preventDefault(); setDragOver(false); loadFile(e.dataTransfer.files[0]) }, [loadFile])
  const onInput = useCallback((e) => { const f = e.target.files[0]; if (f) loadFile(f) }, [loadFile])

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
    dragRef.current = { active: true, sx: e.clientX, sy: e.clientY, srx: rxRef.current, sry: ryRef.current }
    setDragging(true)
    setHintVisible(false)
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

  const reupload = useCallback(() => {
    setSrc(null); setSticker(null); setRx(0); setRy(0); setError(null); setHintVisible(true)
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  /* ── Export ── */
  const handleExport = useCallback(async () => {
    if (!exportRef.current || exporting) return
    setExporting(true); setError(null)
    try {
      const url = await toPng(exportRef.current, { pixelRatio: 2, backgroundColor: '#050508' })
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
  }, [exporting])

  /* ── Entrance animation ── */
  useGSAP(() => {
    const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) { gsap.set('.stk-upload,.stk-workspace', { autoAlpha: 1, y: 0 }); return }
    gsap.from('.stk-upload,.stk-workspace', { autoAlpha: 0, y: 16, duration: 0.6, ease: 'expo.out', stagger: 0.1 })
  }, { scope: containerRef })

  /* ── Upload View ── */
  if (!sticker) {
    return (
      <div ref={containerRef} className="flex-1 flex items-center justify-center py-10">
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
              <p className="dcde-body text-ink">{processing ? '处理中...' : '拖拽图片到此处，或点击上传'}</p>
              <p className="dcde-caption text-ink-faint mt-2">支持 SVG、PNG · 最大 10MB</p>
            </div>
            <input ref={inputRef} type="file" accept=".svg,.png,image/svg+xml,image/png" onChange={onInput} className="hidden" />
          </div>
          {error && <div className="flex items-center gap-2 mt-4 text-red-400 dcde-body"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
        </div>
      </div>
    )
  }

  /* ── Workspace View ── */
  return (
    <div ref={containerRef} className="stk-workspace flex-1 flex flex-col lg:flex-row gap-6" style={{ minHeight: 0 }}>
      {/* Controls */}
      <div className="w-full lg:w-64 shrink-0 flex flex-col gap-6">
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

        <div>
          <label className="dcde-caption text-ink-faint block mb-3">自动旋转</label>
          <div className="flex gap-2">
            <button onClick={() => setAutoRotate(true)} className={clsx(autoRotate ? 'dcde-tag-accent' : 'dcde-tag-muted')}>开启</button>
            <button onClick={() => setAutoRotate(false)} className={clsx(!autoRotate ? 'dcde-tag-accent' : 'dcde-tag-muted')}>关闭</button>
          </div>
        </div>

        <div className="space-y-3">
          <button onClick={resetRotation} className="dcde-tag-muted w-full justify-center gap-2">
            <RotateCcw className="w-3.5 h-3.5" />重置旋转
          </button>
          <button onClick={reupload} className="dcde-tag-muted w-full justify-center gap-2">
            <ImagePlus className="w-3.5 h-3.5" />重新上传
          </button>
        </div>

        <div className="dcde-rule-solid" />

        <button onClick={handleExport} disabled={exporting} className={clsx('dcde-pill w-full justify-center', exporting && 'opacity-70 cursor-wait')}>
          {exporting ? <><Loader2 className="w-4 h-4 animate-spin" />导出中...</> : <><Download className="w-4 h-4" />导出 PNG</>}
        </button>

        {success && <div className="flex items-center gap-2 text-emerald-400 text-sm"><Check className="w-4 h-4 shrink-0" />导出成功</div>}
        {error && <div className="flex items-center gap-2 text-red-400 text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
      </div>

      {/* Preview */}
      <div
        className={clsx(
          'flex-1 flex items-center justify-center rounded-3xl bg-void-raised select-none overflow-hidden relative',
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        )}
        style={{ border: '1px solid rgba(255,255,255,0.06)', perspective: '800px', minHeight: '300px' }}
        onPointerDown={onPtrDown}
        onPointerMove={onPtrMove}
        onPointerUp={onPtrUp}
      >
        <div
          ref={exportRef}
          className="flex items-center justify-center w-full h-full"
          style={{ padding: '40px', backgroundColor: '#050508', borderRadius: '24px' }}
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
        <p className={clsx(
          'absolute bottom-4 left-1/2 -translate-x-1/2 dcde-caption text-ink-faint pointer-events-none transition-opacity duration-500',
          hintVisible ? 'opacity-100' : 'opacity-0'
        )}>
          拖拽旋转
        </p>
      </div>
    </div>
  )
}
