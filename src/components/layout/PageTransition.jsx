import { useRef, useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import gsap from 'gsap'
import clsx from 'clsx'

export default function PageTransition({ children, className }) {
  const location = useLocation()
  const containerRef = useRef(null)
  const lastKeyRef = useRef(null)

  // Apple Fluid Motion entrance on every route change (skip first render)
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const currentKey = location.key
    const prevKey = lastKeyRef.current
    lastKeyRef.current = currentKey

    // Skip first render (when key is null or hasn't changed)
    if (prevKey === null || prevKey === currentKey) return

    const target = el.firstElementChild
    if (!target) return

    // Interruptible: kill any ongoing tween, start from current state
    gsap.killTweensOf(target)

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced) {
      gsap.set(target, { autoAlpha: 1, y: 0 })
      return
    }

    // Physics-based: vertical drop with heavy friction deceleration (expo.out)
    gsap.fromTo(
      target,
      { autoAlpha: 0, y: 16 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.6,
        ease: 'expo.out',
        clearProps: 'opacity,visibility,y',
      }
    )
  }, [location.key])

  return (
    <div ref={containerRef} className={clsx("relative", className)}>
      {children}
    </div>
  )
}
