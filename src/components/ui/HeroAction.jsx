import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { tools } from '../../data/tools.registry.js'

export default function HeroAction({ onScroll }) {
  const containerRef = useRef(null)
  const expandedRef = useRef(null)
  const navigate = useNavigate()

  // Get 4 tools as the "latestly updated" ones.
  const latestTools = tools.slice(0, 4)

  useGSAP(() => {
    // Initial state
    gsap.set(expandedRef.current, { width: 0, autoAlpha: 0, paddingLeft: 0 })
    gsap.set('.tool-pill', { x: -15, autoAlpha: 0 })

    const tl = gsap.timeline({ paused: true })

    // Expand width of container
    tl.to(expandedRef.current, {
      width: 'auto',
      autoAlpha: 1,
      paddingLeft: '12px',
      duration: 0.5,
      ease: 'power3.out'
    })
    
    // Stagger in the small tool pills
    tl.to('.tool-pill', {
      x: 0,
      autoAlpha: 1,
      stagger: 0.04,
      duration: 0.4,
      ease: 'back.out(1.5)'
    }, '-=0.35')

    const onEnter = () => tl.play()
    const onLeave = () => tl.reverse()

    const el = containerRef.current
    if (el) {
      el.addEventListener('mouseenter', onEnter)
      el.addEventListener('mouseleave', onLeave)
    }

    return () => {
      if (el) {
        el.removeEventListener('mouseenter', onEnter)
        el.removeEventListener('mouseleave', onLeave)
      }
      tl.kill()
    }
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className="relative flex items-center">
      {/* Main Button */}
      <button 
        className="dcde-pill relative z-10 flex-shrink-0 m-0"
        onClick={onScroll}
      >
        开始折腾
      </button>

      {/* Expanded Container */}
      <div 
        ref={expandedRef}
        className="hidden md:flex items-center overflow-hidden"
        style={{ width: 0, opacity: 0, visibility: 'hidden' }}
      >
        <div className="flex items-center gap-3 whitespace-nowrap">
          {latestTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => navigate(`/tool/${tool.id}`)}
              className="tool-pill inline-flex items-center justify-center text-white text-[15px] font-bold px-[40px] py-[18px] rounded-full whitespace-nowrap cursor-pointer flex-shrink-0"
              style={{ 
                fontFamily: 'var(--font-family-body)',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                transition: 'transform 0.45s var(--ease-apple-active), background-color 0.45s var(--ease-apple)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
              onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(0) scale(0.97)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
            >
              {tool.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
