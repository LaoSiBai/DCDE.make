import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function Footer() {
  const footerRef = useRef(null)

  useGSAP(() => {
    const el = footerRef.current
    if (!el) return

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced) {
      gsap.set(el, { autoAlpha: 1, y: 0, filter: 'none', willChange: 'auto' })
      return
    }

    gsap.set(el, { willChange: 'filter, opacity, transform' })

    gsap.fromTo(
      el,
      { autoAlpha: 0, y: 30, filter: 'blur(16px)' },
      {
        autoAlpha: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 1.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 95%',
          once: true,
        },
        onComplete: () => {
          gsap.set(el, { clearProps: 'willChange,filter' })
        },
      }
    )
  }, { scope: footerRef })

  return (
    <footer ref={footerRef} style={{ padding: '0 var(--spacing-page)' }}>
      <div className="dcde-rule-solid mb-6" />
      <div className="flex items-center justify-between py-6">
        <p className="dcde-caption text-ink-faint">
          © {new Date().getFullYear()} DCDE
        </p>

        <Link
          to="/about"
          className="dcde-nav py-2 px-4"
        >
          关于
        </Link>

        <a
          href="https://dcde.club"
          target="_blank"
          rel="noopener noreferrer"
          className="dcde-caption text-ink-dim hover:text-ink transition-colors relative group"
        >
          dcde.club
          <span className="absolute bottom-0 left-0 w-0 h-px bg-ink group-hover:w-full transition-all duration-300" />
        </a>
      </div>
    </footer>
  )
}
