import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="pt-32 pb-24 min-h-[100dvh]">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-dcde-text-secondary hover:text-dcde-accent transition-colors duration-300 mb-12"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-mono">返回首页</span>
        </Link>

        <div className="max-w-3xl">
          <h1 className="font-display text-5xl lg:text-7xl font-bold text-dcde-text-primary tracking-tight mb-8">
            关于
          </h1>
          <div className="space-y-6 text-dcde-text-secondary leading-relaxed text-lg">
            <p>
              DCDE·make 是一个面向视觉设计师的工具合集网站。我们相信，好的工具应该像好的设计一样——
              <span className="text-dcde-accent">精确、直觉、没有多余的噪音</span>。
            </p>
            <p>
              在这个站点里，你会找到从色彩管理到网格系统、从字体比例到无障碍检测的一系列实用工具。
              每一个工具都经过精心设计，确保在提供强大功能的同时，保持界面的简洁与优雅。
            </p>
            <p>
              当前站点处于早期开发阶段，核心框架已经完成，更多工具正在持续开发中。
              如果你有任何建议或想法，欢迎通过 GitHub 与我们交流。
            </p>
          </div>

          <div className="mt-16 pt-8 border-t border-dcde-border">
            <h2 className="font-display text-2xl font-semibold text-dcde-text-primary mb-6">
              设计理念
            </h2>
            <ul className="space-y-4 text-dcde-text-secondary">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-dcde-accent mt-2 flex-shrink-0" />
                <span>精确性优先 — 每一个像素、每一个数值都应该被精确控制</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-dcde-accent mt-2 flex-shrink-0" />
                <span>即时反馈 — 所见即所得，没有任何延迟或猜测</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-dcde-accent mt-2 flex-shrink-0" />
                <span>可访问性 — 工具本身就应该成为无障碍设计的典范</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-dcde-accent mt-2 flex-shrink-0" />
                <span>开放透明 — 开源、可审查、可扩展</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
