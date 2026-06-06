import { Link } from 'react-router-dom'

export default function SiteHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-end h-16" style={{ padding: '0 var(--spacing-page)' }}>
      <nav>
        <Link
          to="/about"
          className="dcde-tag dcde-tag-ghost hover:bg-accent hover:text-void hover:border-accent transition-colors duration-200"
        >
          关于
        </Link>
      </nav>
    </header>
  )
}
