import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center" style={{ padding: '0 var(--spacing-page)' }}>
      <div className="text-center">
        <span className="dcde-mega text-ink-faint leading-none select-none block mb-4">
          404
        </span>
        <h1 className="dcde-xl text-ink mb-6">页面未找到</h1>
        <Link to="/" className="dcde-pill">
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>
      </div>
    </div>
  )
}
