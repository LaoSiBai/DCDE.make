import { useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ArrowLeft } from 'lucide-react'
import { getToolById } from '../data/tools.registry.js'
import StickerTool from '../components/tools/StickerTool.jsx'
import AsciiArtTool from '../components/tools/AsciiArtTool.jsx'

export const toolComponents = {
  '3d-sticker': StickerTool,
  'ascii-art': AsciiArtTool,
}

export default function ToolPage() {
  const { toolId } = useParams()
  const tool = getToolById(toolId)
  const pageRef = useRef(null)

  const ToolComponent = tool ? toolComponents[tool.id] : null

  useGSAP(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced) {
      gsap.set('.tp-back, .tp-title, .tp-desc, .tp-rule, .tp-sidebar, .tp-canvas', {
        autoAlpha: 1,
        y: 0,
        scaleX: 1,
        scale: 1,
      })
      return
    }

    const tl = gsap.timeline({ defaults: { ease: 'expo.out', duration: 0.6 } })

    if (!ToolComponent || !ToolComponent.isAppLayout) {
      tl.from('.tp-back', { autoAlpha: 0, y: -10 })
        .from('.tp-title', { autoAlpha: 0, y: 24 }, '-=0.4')
        .from('.tp-desc', { autoAlpha: 0, y: 10 }, '-=0.4')
        .from('.tp-rule', { autoAlpha: 0, scaleX: 0, transformOrigin: 'left center', duration: 0.7, ease: 'expo.out' }, '-=0.4')

      // Only animate sidebar/canvas when using default layout
      if (!ToolComponent) {
        tl.from('.tp-sidebar', { autoAlpha: 0, y: 16 }, '-=0.4')
          .from('.tp-canvas', { autoAlpha: 0, scale: 0.98 }, '-=0.4')
      }
    }
  }, { scope: pageRef })

  // Canvas Breath animation — only for default layout
  useGSAP(() => {
    if (ToolComponent) return
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const canvasContent = pageRef.current?.querySelector('.tp-canvas > div')
    if (!canvasContent || reduced) return

    gsap.to(canvasContent, {
      scale: 0.985,
      duration: 3,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    })
  }, { scope: pageRef })

  const handleBackEnter = (e) => {
    gsap.to(e.currentTarget.querySelector('.back-arrow'), {
      x: -3,
      duration: 0.35,
      ease: 'expo.out',
    })
  }
  const handleBackLeave = (e) => {
    gsap.to(e.currentTarget.querySelector('.back-arrow'), {
      x: 0,
      duration: 0.35,
      ease: 'expo.out',
    })
  }

  if (!tool) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center" style={{ padding: '0 var(--spacing-page)' }}>
        <div className="flex flex-col items-center gap-6">
          <span className="dcde-badge">404</span>
          <p className="dcde-xl text-ink">工具不存在</p>
          <Link to="/" className="dcde-pill">返回首页</Link>
        </div>
      </div>
    )
  }

  const isApp = ToolComponent && ToolComponent.isAppLayout

  if (isApp) {
    return (
      <div ref={pageRef} className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
        <ToolComponent />
      </div>
    )
  }

  return (
    <div ref={pageRef} className="min-h-[100dvh] flex flex-col" style={{ padding: '0 var(--spacing-page)' }}>
      {/* Content Header */}
      <div className="pt-6 md:pt-8 pb-6 shrink-0">
        <Link
          to="/"
          className="tp-back dcde-nav"
          onMouseEnter={handleBackEnter}
          onMouseLeave={handleBackLeave}
        >
          <ArrowLeft className="back-arrow w-4 h-4" />
          返回
        </Link>

        <h1 className="tp-title dcde-mega text-ink mt-6">{tool.name}</h1>
        <p className="tp-desc dcde-body text-ink-dim mt-3">{tool.description}</p>
      </div>

      <div className="tp-rule dcde-rule-solid" />

      {/* Main content */}
      {ToolComponent ? (
        <div className="flex-1 flex flex-col pt-6 pb-16 md:pb-24 lg:pb-12" style={{ minHeight: 0 }}>
          <ToolComponent />
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 pt-6 pb-16 md:pb-24 lg:pb-12" style={{ minHeight: 0 }}>
          {/* Sidebar */}
          <aside className="tp-sidebar w-64 flex-shrink-0 hidden lg:flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="dcde-badge uppercase tracking-widest">{tool.updatedAt}</span>
                <span className="dcde-caption text-ink-faint">{tool.nameEn}</span>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="dcde-caption text-ink-faint block mb-2">输入</label>
                  <input
                    type="text"
                    placeholder="输入值..."
                    disabled
                    className="w-full bg-[#18181b] text-ink rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-ink-dim transition-colors placeholder:text-ink-faint/50 opacity-50 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="dcde-caption text-ink-faint block mb-3">模式</label>
                  <div className="flex gap-2">
                    <button className="dcde-tag-accent">A</button>
                    <button className="dcde-tag-muted">B</button>
                  </div>
                </div>

                <div>
                  <label className="dcde-caption text-ink-faint block mb-3">强度</label>
                  <div className="h-1.5 w-full bg-void-raised rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-accent rounded-full" />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-[11px] text-ink-faint">0</span>
                    <span className="text-[11px] text-ink-faint">100</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto">
              <div className="dcde-rule-solid" />
              <button className="dcde-pill w-full justify-center mt-5">应用</button>
            </div>
          </aside>

          {/* Canvas */}
          <div className="tp-canvas flex-1 flex items-center justify-center rounded-3xl bg-void-raised px-6 py-10 md:px-10 md:py-16" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex flex-col items-center gap-5">
              <span className="dcde-badge">Coming Soon</span>
              <p className="dcde-lg text-ink">工具开发中</p>
              <p className="dcde-body text-ink-dim">该工具正在紧锣密鼓地开发中</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
