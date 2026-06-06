import { useRef, useLayoutEffect, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import gsap from 'gsap'

export default function PageTransition({ children }) {
  const location = useLocation()
  const containerRef = useRef(null)
  const prevPath = useRef(null)
  const isFirstRender = useRef(true)

  // Entrance animation on every route change (skip first render)
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    if (isFirstRender.current) {
      isFirstRender.current = false
      prevPath.current = location.pathname
      return
    }

    if (prevPath.current === location.pathname) return
    prevPath.current = location.pathname

    const target = el.firstElementChild
    if (!target) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        target,
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', clearProps: 'opacity,visibility,y' }
      )
    }, el)

    return () => ctx.revert()
  }, [location.pathname])

  // Expose expand handler for tool row click
  const handleExpand = (originElement, toolId) => {
    if (!originElement) return

    const rect = originElement.getBoundingClientRect()
    const clone = originElement.cloneNode(true)
    clone.style.position = 'fixed'
    clone.style.left = `${rect.left}px`
    clone.style.top = `${rect.top}px`
    clone.style.width = `${rect.width}px`
    clone.style.height = `${rect.height}px`
    clone.style.margin = '0'
    clone.style.zIndex = '9999'
    clone.style.overflow = 'hidden'
    clone.style.pointerEvents = 'none'
    clone.style.willChange = 'transform'
    document.body.appendChild(clone)

    const overlay = document.createElement('div')
    overlay.style.position = 'fixed'
    overlay.style.inset = '0'
    overlay.style.backgroundColor = '#050508'
    overlay.style.zIndex = '9998'
    overlay.style.opacity = '0'
    document.body.appendChild(overlay)

    const viewportW = window.innerWidth
    const viewportH = window.innerHeight
    const scaleX = viewportW / rect.width
    const scaleY = viewportH / rect.height
    const scale = Math.max(scaleX, scaleY) * 1.05
    const translateX = viewportW / 2 - (rect.left + rect.width / 2)
    const translateY = viewportH / 2 - (rect.top + rect.height / 2)

    const tl = gsap.timeline({
      onComplete: () => {
        window.location.href = `/tool/${toolId}`
      },
    })

    tl.to(overlay, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0)
      .to(
        clone,
        {
          x: translateX,
          y: translateY,
          scale,
          duration: 0.7,
          ease: 'power3.inOut',
        },
        0
      )
  }

  if (typeof window !== 'undefined') {
    window.__dcdeExpand = handleExpand
  }

  return (
    <div ref={containerRef} className="relative">
      {children}
    </div>
  )
}
