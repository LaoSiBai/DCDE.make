import { useRef, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

export default function PageTransition({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const overlayRef = useRef(null)
  const cloneRef = useRef(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleExpand = useCallback((originElement, toolId) => {
    if (isTransitioning || !originElement) return
    setIsTransitioning(true)

    const rect = originElement.getBoundingClientRect()
    const clone = originElement.cloneNode(true)
    clone.style.position = 'fixed'
    clone.style.left = `${rect.left}px`
    clone.style.top = `${rect.top}px`
    clone.style.width = `${rect.width}px`
    clone.style.height = `${rect.height}px`
    clone.style.margin = '0'
    clone.style.zIndex = '9999'
    clone.style.borderRadius = '16px'
    clone.style.overflow = 'hidden'
    clone.style.pointerEvents = 'none'
    clone.style.willChange = 'transform'
    document.body.appendChild(clone)
    cloneRef.current = clone

    const overlay = document.createElement('div')
    overlay.style.position = 'fixed'
    overlay.style.inset = '0'
    overlay.style.backgroundColor = '#0a1628'
    overlay.style.zIndex = '9998'
    overlay.style.opacity = '0'
    document.body.appendChild(overlay)
    overlayRef.current = overlay

    const viewportW = window.innerWidth
    const viewportH = window.innerHeight
    const scaleX = viewportW / rect.width
    const scaleY = viewportH / rect.height
    const scale = Math.max(scaleX, scaleY) * 1.05
    const translateX = viewportW / 2 - (rect.left + rect.width / 2)
    const translateY = viewportH / 2 - (rect.top + rect.height / 2)

    const tl = gsap.timeline({
      onComplete: () => {
        navigate(`/tool/${toolId}`)
        gsap.delayedCall(0.05, () => {
          gsap.to([clone, overlay], {
            opacity: 0,
            duration: 0.35,
            ease: 'power2.in',
            onComplete: () => {
              clone.remove()
              overlay.remove()
              cloneRef.current = null
              overlayRef.current = null
              setIsTransitioning(false)
            },
          })
        })
      },
    })

    tl.to(overlay, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0)
      .to(
        clone,
        {
          x: translateX,
          y: translateY,
          scale,
          borderRadius: 0,
          duration: 0.7,
          ease: 'power3.inOut',
        },
        0
      )
  }, [isTransitioning, navigate])

  // Provide handleExpand to children via context or window temporarily
  // Since React context might be overkill, we'll use a global event for simplicity
  // Actually better: set a global ref that HomePage can access
  // But to keep it clean, let's use a simple approach:
  // We'll export handleExpand via window.__dcdeExpand for now
  if (typeof window !== 'undefined') {
    window.__dcdeExpand = handleExpand
  }

  return (
    <div className="relative">
      {children}
    </div>
  )
}
