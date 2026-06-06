import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'

const STAGGER_MS = 40

export default function Footer() {
  const footerRef = useRef(null)

  useEffect(() => {
    const el = footerRef.current
    if (!el) return

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced) {
      el.querySelectorAll('.dcde-blur-fade-in').forEach((child) => {
        child.classList.add('is-visible')
      })
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const items = entry.target.querySelectorAll('.dcde-blur-fade-in')
            items.forEach((item, i) => {
              setTimeout(() => item.classList.add('is-visible'), i * STAGGER_MS)
            })
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <footer ref={footerRef} style={{ padding: '0 var(--spacing-page)' }}>
      <div className="dcde-rule-solid mb-6" style={{ opacity: 0.6 }} />
      <div className="flex items-center justify-between py-6">
        <span className="dcde-footer-link dcde-blur-fade-in">
          © {new Date().getFullYear()} DCDE
        </span>

        <Link to="/about" className="dcde-footer-link dcde-blur-fade-in">
          关于
        </Link>

        <a
          href="https://dcde.club"
          target="_blank"
          rel="noopener noreferrer"
          className="dcde-footer-link dcde-blur-fade-in"
        >
          dcde.club
        </a>
      </div>
    </footer>
  )
}
