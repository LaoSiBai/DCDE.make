import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { tools } from '../data/tools.registry.js'
import Logo from '../components/ui/Logo.jsx'

export default function HomePage() {
  const listRef = useRef(null)
  const navigate = useNavigate()

  // Apple Fluid Motion entrance — smooth deceleration, no overshoot
  useGSAP(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set('.hm-logo-svg, .hm-sub, .hm-rule, .tool-row', {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
        })
        return
      }

      const tl = gsap.timeline({ defaults: { ease: 'expo.out', duration: 0.6 } })

      // Logo: scale + opacity, heavy friction deceleration
      tl.from('.hm-logo-svg', { autoAlpha: 0, scale: 0.92 })

      // Title char-by-char: y + rotateX + opacity
      const titleEl = listRef.current?.querySelector('.hm-title')
      if (titleEl) {
        const text = titleEl.textContent
        titleEl.innerHTML = ''
        const chars = []
        for (const ch of text) {
          if (ch === ' ') {
            const space = document.createElement('span')
            space.innerHTML = '&nbsp;'
            space.style.display = 'inline-block'
            space.style.width = '0.3em'
            titleEl.appendChild(space)
            chars.push(space)
          } else if (ch === '·') {
            const dot = document.createElement('span')
            dot.textContent = '·'
            dot.className = 'text-accent'
            dot.style.display = 'inline-block'
            titleEl.appendChild(dot)
            chars.push(dot)
          } else {
            const span = document.createElement('span')
            span.textContent = ch
            span.style.display = 'inline-block'
            titleEl.appendChild(span)
            chars.push(span)
          }
        }
        tl.from(chars, {
          autoAlpha: 0,
          y: 14,
          rotateX: -30,
          stagger: 0.06,
        }, '-=0.4')
      }

      // Subtitle
      tl.from('.hm-sub', { autoAlpha: 0, y: 10 }, '-=0.4')

      // Divider
      tl.from('.hm-rule', {
        autoAlpha: 0,
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 0.7,
        ease: 'expo.out',
      }, '-=0.4')

      // Tool rows: staggered reveal
      tl.from('.tool-row', {
        autoAlpha: 0,
        y: 12,
        stagger: 0.06,
      }, '-=0.4')
    }, listRef)
  }, { scope: listRef })

  // Hover effect — each row independent, interruptible quickTo
  useGSAP(() => {
    const container = listRef.current
    if (!container) return

    const rows = gsap.utils.toArray('.tool-row', container)

    const qt = rows.map((row) => ({
      rowX: gsap.quickTo(row, 'x', { duration: 0.35, ease: 'expo.out' }),
      arrowX: gsap.quickTo(row.querySelector('.tool-arrow'), 'x', {
        duration: 0.35,
        ease: 'expo.out',
      }),
      arrowOpacity: gsap.quickTo(row.querySelector('.tool-arrow'), 'autoAlpha', {
        duration: 0.35,
      }),
    }))

    const enter = (i) => {
      gsap.to(rows[i].querySelector('.tool-index'), {
        color: '#ffffff',
        duration: 0.2,
        overwrite: 'auto',
      })
      qt[i].rowX(12)
      qt[i].arrowX(0)
      qt[i].arrowOpacity(1)
    }

    const leave = (i) => {
      gsap.to(rows[i].querySelector('.tool-index'), {
        color: '#ffffff',
        duration: 0.3,
        overwrite: 'auto',
      })
      qt[i].rowX(0)
      qt[i].arrowX(-8)
      qt[i].arrowOpacity(0)
    }

    const enterHandlers = []
    const leaveHandlers = []
    rows.forEach((row, i) => {
      const onEnter = () => enter(i)
      const onLeave = () => leave(i)
      enterHandlers.push(onEnter)
      leaveHandlers.push(onLeave)
      row.addEventListener('pointerenter', onEnter)
      row.addEventListener('pointerleave', onLeave)
    })

    return () => {
      rows.forEach((row, i) => {
        row.removeEventListener('pointerenter', enterHandlers[i])
        row.removeEventListener('pointerleave', leaveHandlers[i])
      })
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
    navigate(`/tool/${toolId}`)
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
            style={{ padding: '3.5vh 0' }}
            onClick={() => handleClick(tool.id)}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-baseline gap-4 md:gap-8">
                <span className="tool-index dcde-index flex-shrink-0 w-8 md:w-12 text-ink">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h2 className="tool-name dcde-xl text-ink transition-colors duration-200">
                  {tool.name}
                </h2>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="dcde-badge hidden md:inline-flex">
                  {categoryLabels[tool.category]}
                </span>
                <span className="tool-arrow text-ink opacity-0">
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
