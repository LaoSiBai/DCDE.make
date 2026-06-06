import { useRef, useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import gsap from 'gsap'

export default function PageTransition({ children }) {
  const location = useLocation()
  const containerRef = useRef(null)
  const prevPath = useRef(null)
  const isFirstRender = useRef(true)

  // Apple Fluid Motion entrance on every route change (skip first render)
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

    // Interruptible: kill any ongoing tween, start from current state
    gsap.killTweensOf(target)

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced) {
      gsap.set(target, { autoAlpha: 1, x: 0 })
      return
    }

    // Apple Fluid Motion: fast start, ultra-smooth deceleration (power3.out)
    gsap.fromTo(
      target,
      { autoAlpha: 0, x: 24 },
      {
        autoAlpha: 1,
        x: 0,
        duration: 0.35,
        ease: 'power3.out',
        clearProps: 'opacity,visibility,x',
      }
    )
  }, [location.pathname])

  return (
    <div ref={containerRef} className="relative">
      {children}
    </div>
  )
}
