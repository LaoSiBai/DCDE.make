import { useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { getToolById } from '../data/tools.registry.js'

export default function ToolPage() {
  const { toolId } = useParams()
  const tool = getToolById(toolId)
  const pageRef = useRef(null)

  // Entrance sequence
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    tl.from('.tp-back', { autoAlpha: 0, x: -10, duration: 0.5 })
      .from('.tp-title', { autoAlpha: 0, y: 30, duration: 0.9 }, '-=0.3')
      .from('.tp-rule', { scaleX: 0, transformOrigin: 'left center', duration: 0.8, ease: 'power2.inOut' }, '-=0.5')
      .from('.tp-panel', { autoAlpha: 0, x: -30, duration: 0.7 }, '-=0.4')
      .from('.tp-canvas', { autoAlpha: 0, x: 30, duration: 0.7 }, '<')
  }, { scope: pageRef })

  // Hover on back button — arrow shift
  const handleBackEnter = (e) => {
    gsap.to(e.currentTarget.querySelector('.back-arrow'), { x: -4, duration: 0.25, ease: 'power2.out' })
  }
  const handleBackLeave = (e) => {
    gsap.to(e.currentTarget.querySelector('.back-arrow'), { x: 0, duration: 0.25, ease: 'power2.out' })
  }

  if (!tool) {
    return (
      <div className="min-h-[80dvh] flex items-center justify-center" style={{ padding: '0 var(--spacing-page)' }}>
        <div className="text-center">
          <p className="dcde-lg text-ink-dim mb-6">Tool not found</p>
          <Link to="/" className="dcde-pill">返回首页</Link>
        </div>
      </div>
    )
  }

  return (
    <div ref={pageRef} className="min-h-[100dvh]" style={{ padding: '0 var(--spacing-page)' }}>
      {/* Back + Title */}
      <div className="pt-20 pb-8">
        <Link
          to="/"
          className="tp-back dcde-ghost text-ink-dim hover:text-accent mb-8 inline-flex items-center gap-2"
          onMouseEnter={handleBackEnter}
          onMouseLeave={handleBackLeave}
        >
          <ArrowLeft className="back-arrow w-4 h-4" />
          返回
        </Link>

        <h1 className="tp-title dcde-mega text-ink mt-4">
          {tool.name}
        </h1>
      </div>

      <div className="tp-rule dcde-rule-solid mb-8" />

      {/* Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-24">
        {/* Left: Controls */}
        <div className="lg:col-span-3">
          <div className="lg:sticky lg:top-20">
            <div className="tp-panel bg-void-raised rounded-2xl p-6" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="dcde-caption text-ink-dim mb-6">参数</h3>
              <div className="space-y-5">
                <div>
                  <label className="dcde-body text-ink-dim block mb-2">输入</label>
                  <input
                    type="text"
                    placeholder="..."
                    disabled
                    className="w-full bg-void text-ink border border-ink-faint rounded-xl px-4 py-3 text-sm outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="dcde-body text-ink-dim block mb-2">模式</label>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-accent text-void rounded-xl py-2.5 text-sm font-bold hover:brightness-110 transition-all">A</button>
                    <button className="flex-1 bg-void-raised text-ink-dim border border-ink-faint rounded-xl py-2.5 text-sm font-medium hover:text-ink hover:border-ink-dim transition-all">B</button>
                  </div>
                </div>
                <div>
                  <label className="dcde-body text-ink-dim block mb-2">强度</label>
                  <div className="h-1.5 w-full bg-ink-faint rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-accent rounded-full" />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button className="dcde-pill w-full justify-center group">
                  应用
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Canvas */}
        <div className="lg:col-span-9">
          <div
            className="tp-canvas bg-void-raised rounded-2xl flex items-center justify-center"
            style={{ minHeight: '60vh', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full border-2 border-dashed border-accent/30 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-accent/50" />
              </div>
              <p className="dcde-lg text-ink mb-2">工具开发中</p>
              <p className="dcde-body text-ink-dim">Coming Soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
