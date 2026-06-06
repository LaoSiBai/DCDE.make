import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="pt-32 pb-24 min-h-[100dvh] flex items-center justify-center">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 text-center">
        <div className="mb-8">
          <span className="font-display text-[120px] lg:text-[180px] font-bold text-dcde-text-primary/5 leading-none select-none">
            404
          </span>
        </div>
        <h1 className="font-display text-3xl lg:text-4xl font-bold text-dcde-text-primary mb-4 -mt-16 relative">
          页面未找到
        </h1>
        <p className="text-dcde-text-secondary mb-8 max-w-md mx-auto">
          你访问的页面不存在，或者已经被移动到新的位置。
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-dcde-border text-dcde-text-primary hover:border-dcde-accent hover:text-dcde-accent transition-all duration-300 font-mono text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>
      </div>
    </div>
  )
}
