import { Link } from 'react-router-dom'
import Logo from '../ui/Logo.jsx'

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-void border-b border-ink-faint">
      <div className="h-14 md:h-16 flex items-center justify-between px-6 md:px-8 max-w-[100vw]">
        <Link to="/" className="flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity">
          <Logo style={{ height: '24px', width: 'auto' }} />
          <span className="text-[20px] font-semibold tracking-tight text-ink leading-none mt-1">
            Make
          </span>
        </Link>
        <div className="flex items-center gap-6 hidden md:flex">
          <span className="text-[12px] font-bold tracking-[0.06em] text-ink-dim uppercase select-none">
            © {new Date().getFullYear()} DCDE
          </span>
          <Link to="/about" className="dcde-footer-link" style={{ padding: 0 }}>
            关于
          </Link>
          <a
            href="https://dcde.club"
            target="_blank"
            rel="noopener noreferrer"
            className="dcde-footer-link"
            style={{ padding: 0 }}
          >
            dcde.club
          </a>
        </div>
      </div>
    </header>
  )
}
