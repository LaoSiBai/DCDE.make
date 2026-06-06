import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="bg-canvas-soft min-h-[80dvh] flex items-center justify-center" style={{ padding: 'var(--spacing-page)' }}>
      <div className="text-center max-w-md">
        <div className="mb-6">
          <span className="dcde-display-mega text-canvas-deep leading-none select-none block">
            404
          </span>
        </div>
        <h1 className="dcde-display-md text-ink mb-4 -mt-4 relative">页面未找到</h1>
        <p className="dcde-body-md text-body mb-8">
          你访问的页面不存在，或者已经被移动到新的位置。
        </p>
        <Link to="/" className="dcde-btn-primary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回首页
        </Link>
      </div>
    </div>
  )
}
