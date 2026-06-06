import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function Footer() {
  const footerRef = useRef(null)

  useGSAP(() => {
    gsap.from(footerRef.current, {
      autoAlpha: 0,
      y: 20,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: footerRef.current,
        start: 'top 95%',
        once: true,
      },
    })
  }, { scope: footerRef })

  return (
    <footer ref={footerRef} style={{ padding: '0 var(--spacing-page)' }}>
      <div className="dcde-rule-solid mb-6" />
      <div className="flex items-center justify-between py-6">
        <p className="dcde-caption text-ink-faint">
          © {new Date().getFullYear()} DCDE
        </p>
        <a
          href="https://dcde.club"
          target="_blank"
          rel="noopener noreferrer"
          className="dcde-caption text-ink-dim hover:text-accent transition-colors relative group"
        >
          dcde.club
          <span className="absolute bottom-0 left-0 w-0 h-px bg-accent group-hover:w-full transition-all duration-300" />
        </a>
      </div>
    </footer>
  )
}
