import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import gsap from 'gsap'

gsap.registerPlugin(ScrollTrigger)

export default function ScrollProgress() {
  const barRef = useRef(null)
  const triggerRef = useRef(null)

  useGSAP(() => {
    const el = barRef.current
    const trigger = triggerRef.current
    if (!el || !trigger) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
          },
          transformOrigin: 'left center',
        }
      )
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <>
      <div ref={triggerRef} className="h-full min-h-screen" aria-hidden="true" />
      <div
        ref={barRef}
        className="fixed top-0 left-0 w-full h-[2px] bg-accent"
        style={{
          zIndex: 9998,
          transformOrigin: 'left center',
          willChange: 'transform',
        }}
        aria-hidden="true"
      />
    </>
  )
}