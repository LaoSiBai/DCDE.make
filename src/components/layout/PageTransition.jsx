import { useRef, useLayoutEffect } from 'react'
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

    // Interruptible: kill any ongoing tween and clear inline props
    gsap.killTweensOf(target)
    gsap.set(target, { clearProps: 'all' })

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      if (reduced) {
        // Reduced motion: only opacity, no spatial transform
        gsap.fromTo(
          target,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.2, ease: 'power2.out' }
        )
      } else {
        // High-performance: translateX + opacity only (GPU-accelerated)
        gsap.fromTo(
          target,
          { autoAlpha: 0, x: 24 },
          {
            autoAlpha: 1,
            x: 0,
            duration: 0.5,
            ease: 'power3.out',
            clearProps: 'opacity,visibility,x',
          }
        )
      }
    }, el)

    return () => ctx.revert()
  }, [location.pathname])

  return (
    <div ref={containerRef} className="relative">
      {children}
    </div>
  )
}
