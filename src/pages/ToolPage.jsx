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

    tl.from('.tp-back', { autoAlpha: 0, y: -8, duration: 0.4 })
      .from('.tp-title', { autoAlpha: 0, y: 50, duration: 1 }, '-=0.2')
      .from('.tp-desc', { autoAlpha: 0, y: 20, duration: 0.6 }, '-=0.6')
      .from('.tp-meta', { autoAlpha: 0, y: 15, duration: 0.5 }, '-=0.4')
      .from('.tp-rule', { scaleX: 0, transformOrigin: 'left center', duration: 0.8, ease: 'power2.inOut' }, '-=0.4')
      .from('.tp-param', { autoAlpha: 0, y: 20, duration: 0.5, stagger: 0.06 }, '-=0.5')
      .from('.tp-canvas', { autoAlpha: 0, scale: 0.97, duration: 0.8, ease: 'power2.out' }, '-=0.4')
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
          <span className="dcde-tag dcde-tag-ghost">404</span>
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
          className="tp-back dcde-tag dcde-tag-ghost"
          onMouseEnter={handleBackEnter}
          onMouseLeave={handleBackLeave}
        >
          <ArrowLeft className="back-arrow w-3 h-3" />
          返回
        </Link>

        <h1 className="tp-title dcde-mega text-ink mt-6">{tool.name}</h1>
        <p className="tp-desc dcde-body text-ink-dim mt-3 max-w-xl">{tool.description}</p>

        <div className="tp-meta flex items-center gap-3 mt-4">
          <span className="dcde-tag dcde-tag-accent">{categoryLabels[tool.category]}</span>
          <span className="dcde-caption text-ink-faint">{tool.nameEn}</span>
        </div>
      </div>

      <div className="tp-rule dcde-rule-solid" />

      {/* Params Bar */}
      <div className="py-6 flex flex-wrap items-center gap-4">
        <div className="tp-param flex items-center gap-2">
          <label className="dcde-caption text-ink-faint">输入</label>
          <input
            type="text"
            placeholder="输入值..."
            disabled
            className="bg-void text-ink border border-ink-faint rounded-full px-5 py-3 text-sm outline-none focus:border-accent transition-colors min-w-[200px]"
          />
        </div>

        <div className="tp-param flex items-center gap-2">
          <label className="dcde-caption text-ink-faint">模式</label>
          <button className="dcde-tag dcde-tag-accent">A</button>
          <button className="dcde-tag dcde-tag-ghost">B</button>
        </div>

        <div className="tp-param flex items-center gap-3 flex-1 min-w-[180px]">
          <label className="dcde-caption text-ink-faint flex-shrink-0">强度</label>
          <div className="h-1.5 flex-1 bg-ink-faint rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-accent rounded-full" />
          </div>
        </div>

        <div className="tp-param ml-auto">
          <button className="dcde-pill">
            应用
          </button>
        </div>
      </div>

      <div className="tp-rule dcde-rule-solid" />

      {/* Full-width Canvas */}
      <div className="flex-1 py-6">
        <div
          className="tp-canvas bg-void-raised rounded-3xl flex items-center justify-center"
          style={{ minHeight: '50vh', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex flex-col items-center gap-5">
            <span className="dcde-tag dcde-tag-ghost">Coming Soon</span>
            <p className="dcde-lg text-ink">工具开发中</p>
            <p className="dcde-body text-ink-dim">该工具正在紧锣密鼓地开发中</p>
          </div>
        </div>
      </div>

      {/* Bottom spacer */}
      <div className="h-12" />
    </div>
  )
}