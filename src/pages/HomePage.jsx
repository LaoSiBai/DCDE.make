import { useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { tools } from '../data/tools.registry.js'

export default function HomePage() {
  const listRef = useRef(null)
  const navigate = useNavigate()

  // Entrance animation
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.from('.brand-moment', { y: 30, opacity: 0, duration: 1 })
      .from('.tool-row', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.07,
      }, '-=0.6')
  }, { scope: listRef })

  // Hover focus effect
  const handleMouseEnter = useCallback((e) => {
    const rows = listRef.current?.querySelectorAll('.tool-row')
    if (!rows) return
    rows.forEach((row) => {
      if (row === e.currentTarget) {
        gsap.to(row, { opacity: 1, duration: 0.25 })
        gsap.to(row.querySelector('.tool-name'), { color: '#338bff', duration: 0.25 })
        gsap.to(row.querySelector('.tool-arrow'), { x: 8, opacity: 1, duration: 0.25, ease: 'power2.out' })
      } else {
        gsap.to(row, { opacity: 0.1, duration: 0.25 })
      }
    })
  }, [])

  const handleMouseLeave = useCallback(() => {
    const rows = listRef.current?.querySelectorAll('.tool-row')
    if (!rows) return
    rows.forEach((row) => {
      gsap.to(row, { opacity: 1, duration: 0.3 })
      gsap.to(row.querySelector('.tool-name'), { color: '#ffffff', duration: 0.3 })
      gsap.to(row.querySelector('.tool-arrow'), { x: 0, opacity: 0, duration: 0.3 })
    })
  }, [])

  const categoryLabels = {
    color: '色彩',
    layout: '布局',
    typography: '字体',
    asset: '素材',
    accessibility: '无障碍',
  }

  const handleClick = (toolId) => {
    if (window.__dcdeExpand) {
      const el = listRef.current?.querySelector(`[data-tool="${toolId}"]`)
      if (el) window.__dcdeExpand(el, toolId)
      else navigate(`/tool/${toolId}`)
    } else {
      navigate(`/tool/${toolId}`)
    }
  }

  return (
    <div ref={listRef} className="min-h-[100dvh] flex flex-col" style={{ padding: '0 var(--spacing-page)' }}>
      {/* Brand Moment */}
      <div className="brand-moment pt-24 pb-12">
        <h1 className="dcde-mega text-ink mb-3">
          DCDE<span className="text-accent">·</span>make
        </h1>
        <p className="dcde-body text-ink-dim">
          {tools.length} tools for visual designers
        </p>
      </div>

      {/* Tool Index */}
      <div className="flex-1 pb-24">
        {tools.map((tool, index) => (
          <div
            key={tool.id}
            data-tool={tool.id}
            className="tool-row cursor-pointer border-t border-ink-faint"
            style={{ padding: '2.2vh 0' }}
            onClick={() => handleClick(tool.id)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-baseline gap-4 md:gap-8">
                <span className="dcde-index flex-shrink-0 w-8 md:w-12">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h2 className="tool-name dcde-xl text-ink transition-colors duration-200">
                  {tool.name}
                </h2>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="dcde-caption text-ink-faint hidden md:block">
                  {categoryLabels[tool.category]}
                </span>
                <span className="tool-arrow text-accent opacity-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        ))}
        <div className="border-t border-ink-faint mt-0" />
      </div>
    </div>
  )
}
