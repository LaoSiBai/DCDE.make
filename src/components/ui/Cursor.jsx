import { useEffect, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

export default function Cursor() {
  const cursorRef = useRef(null)
  const xTo = useRef(null)
  const yTo = useRef(null)
  const isVisible = useRef(true)
  const scale = useRef(1)
  const targetScale = useRef(1)

  useGSAP(() => {
    const el = cursorRef.current
    if (!el) return

    xTo.current = gsap.quickTo(el, 'x', { duration: 0.15, ease: 'power3' })
    yTo.current = gsap.quickTo(el, 'y', { duration: 0.15, ease: 'power3' })

    const onMouseMove = (e) => {
      if (!isVisible.current) return
      xTo.current(e.clientX)
      yTo.current(e.clientY)
    }

    const onMouseLeave = () => {
      isVisible.current = false
      gsap.to(el, { autoAlpha: 0, duration: 0.2, ease: 'power2.out' })
    }

    const onMouseEnter = () => {
      isVisible.current = true
      gsap.to(el, { autoAlpha: 1, duration: 0.2, ease: 'power2.out' })
    }

    const onHoverStart = () => {
      targetScale.current = 1.5
      gsap.to(scale, {
        current: 1.5,
        duration: 0.3,
        ease: 'power2.out',
        onUpdate: () => {
          el.style.transform = `translate(-50%, -50%) scale(${scale.current})`
        }
      })
    }

    const onHoverEnd = () => {
      targetScale.current = 1
      gsap.to(scale, {
        current: 1,
        duration: 0.3,
        ease: 'power2.out',
        onUpdate: () => {
          el.style.transform = `translate(-50%, -50%) scale(${scale.current})`
        }
      })
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseleave', onMouseLeave)
    window.addEventListener('mouseenter', onMouseEnter)

    const cursorElements = document.querySelectorAll('[data-cursor]')
    cursorElements.forEach((el) => {
      el.addEventListener('mouseenter', onHoverStart)
      el.addEventListener('mouseleave', onHoverEnd)
    })

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('mouseenter', onMouseEnter)
      cursorElements.forEach((el) => {
        el.removeEventListener('mouseenter', onHoverStart)
        el.removeEventListener('mouseleave', onHoverEnd)
      })
      xTo.current?.kill()
      yTo.current?.kill()
      gsap.killTweensOf(el)
      gsap.killTweensOf(scale)
    }
  }, [])

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 w-2 h-2 rounded-full bg-accent pointer-events-none"
      style={{
        zIndex: 9999,
        mixBlendMode: 'difference',
        transform: 'translate(-50%, -50%) scale(1)',
        willChange: 'transform',
      }}
      aria-hidden="true"
    />
  )
}