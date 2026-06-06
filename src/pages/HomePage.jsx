import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { tools } from '../data/tools.registry.js'
import Logo from '../components/ui/Logo.jsx'

gsap.registerPlugin(ScrollTrigger)

export default function HomePage() {
  const listRef = useRef(null)
  const navigate = useNavigate()

  // Entrance animation
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    tl.from('.hm-logo-svg', { autoAlpha: 0, scale: 0.9, duration: 0.8 })
      .from('.hm-title', { autoAlpha: 0, y: 40, duration: 1 }, '-=0.5')
      .from('.hm-sub', { autoAlpha: 0, y: 20, duration: 0.7 }, '-=0.6')
      .from('.hm-rule', { scaleX: 0, transformOrigin: 'left center', duration: 0.8, ease: 'power2.inOut' }, '-=0.4')
      .from('.tool-row', {
        autoAlpha: 0,
        y: 30,
        duration: 0.7,
        stagger: 0.06,
      }, '-=0.5')
  }, { scope: listRef })

  // Hover focus effect — event delegation on container
  useGSAP(() => {
    const container = listRef.current
    if (!container) return

    const rows = container.querySelectorAll('.tool-row')

    const focusRow = (activeRow) => {
      rows.forEach((row) => {
        if (row === activeRow) {
          gsap.to(row, { opacity: 1, duration: 0.25, overwrite: true })
          gsap.to(row.querySelector('.tool-name'), { color: '#338bff', duration: 0.25, overwrite: true })
          gsap.to(row.querySelector('.tool-arrow'), { x: 8, opacity: 1, duration: 0.25, ease: 'power2.out', overwrite: true })
        } else {
          gsap.to(row, { opacity: 0.08, duration: 0.25, overwrite: true })
        }
      })
    }

    const resetAll = () => {
      rows.forEach((row) => {
        gsap.to(row, { opacity: 1, duration: 0.35, overwrite: true })
        gsap.to(row.querySelector('.tool-name'), { color: '#ffffff', duration: 0.35, overwrite: true })
        gsap.to(row.querySelector('.tool-arrow'), { x: 0, opacity: 0, duration: 0.35, overwrite: true })
      })
    }

    const onPointerOver = (e) => {
      const row = e.target.closest('.tool-row')
      if (row) focusRow(row)
    }

    const onPointerOut = (e) => {
      if (!container.contains(e.relatedTarget)) resetAll()
    }

    container.addEventListener('pointerover', onPointerOver)
    container.addEventListener('pointerout', onPointerOut)

    return () => {
      container.removeEventListener('pointerover', onPointerOver)
      container.removeEventListener('pointerout', onPointerOut)
    }
  }, { scope: listRef })

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
        <div className="flex items-center gap-3 md:gap-5 mb-3">
          <Logo
            className="hm-logo-svg"
            style={{ height: 'clamp(48px, 7.5vw, 120px)', width: 'auto', flexShrink: 0 }}
          />
          <h1 className="hm-title dcde-mega text-ink leading-none">
            DCDE<span className="text-accent">·</span>make
          </h1>
        </div>
        <p className="hm-sub dcde-body text-ink-dim">
          {tools.length} tools for visual designers
        </p>
      </div>

      {/* Divider */}
      <div className="hm-rule dcde-rule-solid mb-0" />

      {/* Tool Index */}
      <div className="flex-1 pb-24">
        {tools.map((tool, index) => (
          <div
            key={tool.id}
            data-tool={tool.id}
            className="tool-row cursor-pointer border-b border-ink-faint"
            style={{ padding: '2vh 0' }}
            onClick={() => handleClick(tool.id)}
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
      </div>
    </div>
  )
}
