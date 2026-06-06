import { useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ArrowLeft } from 'lucide-react'
import { getToolById, categories } from '../data/tools.registry.js'

const categoryLabels = Object.fromEntries(categories.filter(c => c.id !== 'all').map(c => [c.id, c.label]))

export default function ToolPage() {
  const { toolId } = useParams()
  const tool = getToolById(toolId)
  const pageRef = useRef(null)

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    tl.from('.tp-back', { autoAlpha: 0, x: -8, duration: 0.4 })
      .from('.tp-title', { autoAlpha: 0, y: 40, duration: 0.9 }, '-=0.2')
      .from('.tp-desc', { autoAlpha: 0, y: 15, duration: 0.5 }, '-=0.5')
      .from('.tp-rule', { scaleX: 0, transformOrigin: 'left center', duration: 0.6, ease: 'power2.inOut' }, '-=0.3')
      .from('.tp-sidebar', { autoAlpha: 0, x: -20, duration: 0.6 }, '-=0.3')
      .from('.tp-canvas', { autoAlpha: 0, scale: 0.98, duration: 0.7 }, '-=0.4')
  }, { scope: pageRef })

  const handleBackEnter = (e) => {
    gsap.to(e.currentTarget.querySelector('.back-arrow'), { x: -4, duration: 0.25, ease: 'power2.out' })
  }
  const handleBackLeave = (e) => {
    gsap.to(e.currentTarget.querySelector('.back-arrow'), { x: 0, duration: 0.25, ease: 'power2.out' })
  }

  if (!tool) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center" style={{ padding: '0 var(--spacing-page)' }}>
        <div className="flex flex-col items-center gap-6">
          <span className="dcde-tag dcde-tag-muted">404</span>
          <p className="dcde-xl text-ink">工具不存在</p>
          <Link to="/" className="dcde-pill">返回首页</Link>
        </div>
      </div>
    )
  }

  return (
    <div ref={pageRef} className="min-h-[100dvh] flex flex-col" style={{ padding: '0 var(--spacing-page)' }}>
      {/* Header */}
      <div className="pt-20 pb-6">
        <Link
          to="/"
          className="tp-back dcde-tag dcde-tag-muted"
          onMouseEnter={handleBackEnter}
          onMouseLeave={handleBackLeave}
        >
          <ArrowLeft className="back-arrow w-3 h-3" />
          返回
        </Link>

        <h1 className="tp-title dcde-mega text-ink mt-6">{tool.name}</h1>
        <p className="tp-desc dcde-body text-ink-dim mt-3">{tool.description}</p>
      </div>

      <div className="tp-rule dcde-rule-solid" />

      {/* Main: sidebar + canvas */}
      <div className="flex-1 flex gap-6 pt-6 pb-24 lg:pb-12" style={{ minHeight: 0 }}>
        {/* Sidebar */}
        <aside className="tp-sidebar w-64 flex-shrink-0 hidden lg:flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="dcde-tag dcde-tag-muted">{categoryLabels[tool.category]}</span>
              <span className="dcde-caption text-ink-faint">{tool.nameEn}</span>
            </div>

            <div className="space-y-5">
              <div>
                <label className="dcde-caption text-ink-faint block mb-2">输入</label>
                <input
                  type="text"
                  placeholder="输入值..."
                  disabled
                  className="w-full bg-void-raised text-ink rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-accent transition-colors placeholder:text-ink-faint/50"
                />
              </div>

              <div>
                <label className="dcde-caption text-ink-faint block mb-3">模式</label>
                <div className="flex gap-2">
                  <button className="dcde-tag dcde-tag-accent">A</button>
                  <button className="dcde-tag dcde-tag-muted">B</button>
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
        <div className="tp-canvas flex-1 flex items-center justify-center rounded-3xl bg-void-raised" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex flex-col items-center gap-5">
            <span className="dcde-tag dcde-tag-muted">Coming Soon</span>
            <p className="dcde-lg text-ink">工具开发中</p>
            <p className="dcde-body text-ink-dim">该工具正在紧锣密鼓地开发中</p>
          </div>
        </div>
      </div>
    </div>
  )
}