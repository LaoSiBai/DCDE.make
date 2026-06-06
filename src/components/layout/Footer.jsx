import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  const footerRef = useRef(null)

  useEffect(() => {
    const el = footerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
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
    <footer
      ref={footerRef}
      className="dcde-blur-fade-in"
      style={{ padding: '0 var(--spacing-page)' }}
    >
      <div className="dcde-rule-solid mb-6" />
      <div className="flex items-center justify-between py-6">
        <span className="dcde-footer-link">
          © {new Date().getFullYear()} DCDE
        </span>

        <Link to="/about" className="dcde-footer-link">
          关于
        </Link>

        <a
          href="https://dcde.club"
          target="_blank"
          rel="noopener noreferrer"
          className="dcde-footer-link"
        >
          dcde.club
        </a>
      </div>
    </footer>
  )
}
