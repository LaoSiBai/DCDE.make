import { useRef, useCallback } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

export default function Ripple({ children }) {
  const containerRef = useRef(null)

  const createRipple = useCallback((e) => {
    const el = containerRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ripple = document.createElement('span')
    ripple.style.position = 'absolute'
    ripple.style.left = `${x}px`
    ripple.style.top = `${y}px`
    ripple.style.width = '100%'
    ripple.style.height = '100%'
    ripple.style.background = 'rgba(51, 139, 255, 0.3)'
    ripple.style.borderRadius = '9999px'
    ripple.style.transform = 'translate(-50%, -50%) scale(0)'
    ripple.style.pointerEvents = 'none'
    ripple.style.willChange = 'transform, opacity'

    el.appendChild(ripple)

    gsap.fromTo(
      ripple,
      { scale: 0, autoAlpha: 0.3 },
      {
        scale: 2.5,
        autoAlpha: 0,
        duration: 0.5,
        ease: 'power2.out',
        onComplete: () => {
          ripple.remove()
        },
      }
    )
  }, [])

  useGSAP(() => {
    const el = containerRef.current
    if (!el) return

    el.addEventListener('click', createRipple)

    return () => {
      el.removeEventListener('click', createRipple)
    }
  }, [createRipple])

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={{ position: 'relative' }}
    >
      {children}
    </div>
  )
}