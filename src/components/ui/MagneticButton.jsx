import { useRef, useEffect, forwardRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

const MagneticButton = forwardRef(function MagneticButton({ children, radius = 60, strength = 0.15, ...props }, ref) {
  const containerRef = useRef(null)
  const xTo = useRef(null)
  const yTo = useRef(null)
  const isHovering = useRef(false)

  useGSAP(() => {
    const el = containerRef.current
    if (!el) return

    xTo.current = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'elastic.out(1, 0.4)' })
    yTo.current = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'elastic.out(1, 0.4)' })

    const onPointerMove = (e) => {
      if (!isHovering.current) return

      const rect = el.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const deltaX = e.clientX - centerX
      const deltaY = e.clientY - centerY

      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      if (distance < radius) {
        const force = (1 - distance / radius) * strength
        xTo.current(deltaX * force)
        yTo.current(deltaY * force)
      }
    }

    const onPointerEnter = () => {
      isHovering.current = true
    }

    const onPointerLeave = () => {
      isHovering.current = false
      xTo.current(0)
      yTo.current(0)
    }

    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerenter', onPointerEnter)
    el.addEventListener('pointerleave', onPointerLeave)

    return () => {
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerenter', onPointerEnter)
      el.removeEventListener('pointerleave', onPointerLeave)
      xTo.current?.kill()
      yTo.current?.kill()
      gsap.killTweensOf(el)
    }
  }, [radius, strength])

  return (
    <div
      ref={(el) => {
        containerRef.current = el
        if (typeof ref === 'function') ref(el)
        else if (ref) ref.current = el
      }}
      className="inline-block"
      style={{
        willChange: 'transform',
        transformOrigin: 'center center',
      }}
      {...props}
    >
      {children}
    </div>
  )
})

export default MagneticButton