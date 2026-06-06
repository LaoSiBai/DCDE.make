import { Link } from 'react-router-dom'

export default function SiteHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-end h-16" style={{ padding: '0 var(--spacing-page)' }}>
      <nav>
        <Link
          to="/about"
          className="dcde-body text-ink-dim hover:text-accent transition-colors relative group inline-block"
        >
          关于
          <span className="absolute bottom-0 left-0 w-0 h-px bg-accent group-hover:w-full transition-all duration-300" />
        </Link>
      </nav>
    </header>
  )
}
