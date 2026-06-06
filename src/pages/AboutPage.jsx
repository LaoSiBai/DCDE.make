import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-canvas-soft border-b border-canvas-deep" style={{ padding: 'var(--spacing-section) var(--spacing-page)' }}>
        <div className="mx-auto max-w-[1200px]">
          <Link
            to="/"
            className="inline-flex items-center gap-2 dcde-body-sm-strong text-mute hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>

          <h1 className="dcde-display-mega text-ink mb-6">
            关于 <span className="text-primary">DCDE·make</span>
          </h1>
          <p className="dcde-body-lg text-body max-w-2xl">
            我们相信，好的工具应该像好的设计一样——精确、直觉、没有多余的噪音。
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-canvas" style={{ padding: 'var(--spacing-section) var(--spacing-page)' }}>
        <div className="mx-auto max-w-[1200px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            <div>
              <h2 className="dcde-display-md text-ink mb-6">我们的理念</h2>
              <div className="space-y-5 dcde-body-md text-body">
                <p>
                  DCDE·make 是一个面向视觉设计师的工具合集网站。在这个站点里，你会找到从色彩管理到网格系统、从字体比例到无障碍检测的一系列实用工具。
                </p>
                <p>
                  每一个工具都经过精心设计，确保在提供强大功能的同时，保持界面的简洁与优雅。当前站点处于早期开发阶段，核心框架已经完成，更多工具正在持续开发中。
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="dcde-card-green">
                <h3 className="dcde-display-xs text-positive-deep mb-2">精确性优先</h3>
                <p className="dcde-body-md text-body">每一个像素、每一个数值都应该被精确控制。</p>
              </div>
              <div className="dcde-card-green">
                <h3 className="dcde-display-xs text-positive-deep mb-2">即时反馈</h3>
                <p className="dcde-body-md text-body">所见即所得，没有任何延迟或猜测。</p>
              </div>
              <div className="dcde-card-green">
                <h3 className="dcde-display-xs text-positive-deep mb-2">可访问性</h3>
                <p className="dcde-body-md text-body">工具本身就应该成为无障碍设计的典范。</p>
              </div>
              <div className="dcde-card-dark">
                <h3 className="dcde-display-xs text-primary mb-2">开放透明</h3>
                <p className="dcde-body-md text-canvas-soft">开源、可审查、可扩展。</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
