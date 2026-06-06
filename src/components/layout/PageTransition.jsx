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

    // Kill any lingering GSAP tween (defensive)
    gsap.killTweensOf(target)

    // Reset CSS animation classes
    target.classList.remove('dcde-blur-fade-in', 'is-visible')

    // Force reflow to allow re-triggering the animation
    void target.offsetWidth

    // Trigger CSS blur fade-in
    target.classList.add('dcde-blur-fade-in', 'is-visible')

    // Cleanup animation class after completion (keep final state via forwards)
    const onEnd = () => {
      target.classList.remove('dcde-blur-fade-in')
      target.removeEventListener('animationend', onEnd)
    }
    target.addEventListener('animationend', onEnd)

    return () => {
      target.removeEventListener('animationend', onEnd)
    }
  }, [location.pathname])

  return (
    <div ref={containerRef} className="relative">
      {children}
    </div>
  )
}
