import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <span className="font-display dcde-text-lg text-grey-placeholder leading-none select-none" style={{ fontSize: '120px' }}>
            404
          </span>
        </div>
        <h1 className="dcde-text-sm dcde-text-accent mb-4 -mt-8 relative">
          页面未找到
        </h1>
        <p className="dcde-text-xs text-grey-text mb-8 max-w-md mx-auto">
          你访问的页面不存在，或者已经被移动到新的位置。
        </p>
        <Link
          to="/"
          className="dcde-link dcde-text-xs text-grey-text hover:text-text inline-flex items-center gap-2 border-2 border-border px-6 py-3"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>
      </div>
    </div>
  )
}
