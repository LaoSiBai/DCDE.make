import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { tools } from '../data/tools.registry.js'
import HeroAction from '../components/ui/HeroAction.jsx'

export default function HomePage() {
  const listRef = useRef(null)
  const navigate = useNavigate()

  // Apple Fluid Motion entrance
  useGSAP(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set('.hero-title, .hero-desc, .hero-actions, .hero-rule, .tool-card', {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
        })
        return
      }

      const tl = gsap.timeline({ defaults: { ease: 'expo.out', duration: 0.6 } })

      // Hero animations
      tl.from('.hero-title', { autoAlpha: 0, y: 16 })
        .from('.hero-desc', { autoAlpha: 0, y: 12 }, '-=0.4')
        .from('.hero-actions', { autoAlpha: 0, y: 10 }, '-=0.4')
        .from('.hero-rule', { autoAlpha: 0, scaleX: 0, transformOrigin: 'left center', duration: 0.7 }, '-=0.4')

      // Tool cards: staggered reveal
      tl.from('.tool-card', {
        autoAlpha: 0,
        y: 20,
        stagger: 0.05,
      }, '-=0.4')
    }, listRef)

    return () => ctx.revert()
  }, { scope: listRef })

  const handleClick = (toolId) => {
    navigate(`/tool/${toolId}`)
  }

  const scrollToTools = () => {
    const container = document.querySelector('.tool-list-container')
    if (container) {
      window.scrollTo({ top: container.offsetTop - 80, behavior: 'smooth' })
    }
  }

  return (
    <div ref={listRef} className="min-h-[100dvh] flex flex-col pt-6 md:pt-10" style={{ padding: '0 var(--spacing-page)' }}>
      {/* Hero Section */}
      <div className="hero-section pt-16 pb-20 md:pt-24 md:pb-28 flex flex-col items-start gap-8 max-w-2xl">
        <h1 className="hero-title dcde-lg md:dcde-xl text-ink leading-tight">
          造点顺手的视觉小工具。
        </h1>
        <p className="hero-desc dcde-body text-ink-dim leading-relaxed">
          不搞花里胡哨的复杂应用。这里收集了一些从优秀作品中提炼出的、真正能提高效率的微型工具。点开即用。
        </p>
        <div className="hero-actions mt-2">
          <HeroAction onScroll={scrollToTools} />
        </div>
      </div>

      <div className="hero-rule dcde-rule-solid" />

      {/* Tool Index Grid */}
      <div className="tool-list-container flex-1 pb-24 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 auto-rows-[minmax(220px,auto)]">
          {tools.map((tool, index) => {
            const spanClass = tool.span || 'col-span-1 row-span-1'
            const cardClasses = `tool-card group relative bg-white/5 hover:bg-white/10 rounded-[2rem] p-6 md:p-8 flex flex-col justify-between cursor-pointer transition-colors duration-300 active:scale-95 ${spanClass.replace(/col-span-\d+/, 'col-span-1 md:$&')}`
            
            return (
              <div
                key={tool.id}
                data-tool={tool.id}
                className={cardClasses}
                onClick={() => handleClick(tool.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleClick(tool.id)
                  }
                }}
                aria-label={`${tool.name}，更新于 ${tool.updatedAt}`}
              >
                {/* Top Section: Date & Index */}
                <div className="flex items-center justify-between gap-4 mb-8">
                  <span className="text-ink-dim text-[12px] font-bold tracking-widest uppercase">
                    {tool.updatedAt}
                  </span>
                  <span className="dcde-index text-ink-faint group-hover:text-ink transition-colors duration-300">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* Bottom Section: Title & Description */}
                <div className="mt-auto flex justify-between items-end gap-4">
                  <div className="flex flex-col gap-2">
                    <h2 className="dcde-lg md:text-[28px] text-ink font-bold leading-tight group-hover:text-accent transition-colors duration-300">
                      {tool.name}
                    </h2>
                    <p className="dcde-body text-ink-dim line-clamp-2 md:line-clamp-3 leading-relaxed max-w-[90%]">
                      {tool.description}
                    </p>
                  </div>
                  
                  {/* Arrow Icon */}
                  <span className="tool-arrow text-accent opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out flex-shrink-0 mb-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
