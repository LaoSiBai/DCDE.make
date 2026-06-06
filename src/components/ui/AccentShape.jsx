import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function AccentShape() {
  const shapeRef = useRef(null)

  useGSAP(() => {
    if (!shapeRef.current) return
    gsap.to(shapeRef.current, {
      y: -120,
      rotation: 15,
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
      },
    })
  }, { scope: shapeRef })

  return (
    <div
      ref={shapeRef}
      className="fixed -right-32 top-1/4 w-[500px] h-[500px] pointer-events-none opacity-[0.04] z-0"
    >
      <svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="250" cy="250" r="200" stroke="#338bff" strokeWidth="2" />
        <circle cx="250" cy="250" r="150" stroke="#338bff" strokeWidth="1" />
        <circle cx="250" cy="250" r="100" stroke="#338bff" strokeWidth="0.5" />
        <path
          d="M250 50 L450 250 L250 450 L50 250 Z"
          stroke="#338bff"
          strokeWidth="1"
          fill="none"
        />
      </svg>
    </div>
  )
}
