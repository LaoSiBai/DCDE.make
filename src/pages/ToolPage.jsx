import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { getToolById } from '../data/tools.registry.js'

export default function ToolPage() {
  const { toolId } = useParams()
  const tool = getToolById(toolId)

  const categoryLabels = {
    color: '色彩',
    layout: '布局',
    typography: '字体',
    asset: '素材',
    accessibility: '无障碍',
  }

  if (!tool) {
    return (
      <div className="bg-canvas-soft min-h-[60dvh] flex items-center justify-center" style={{ padding: 'var(--spacing-section) var(--spacing-page)' }}>
        <div className="text-center">
          <p className="dcde-display-sm text-mute mb-6">Tool not found</p>
          <Link to="/" className="dcde-btn-primary">返回首页</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Breadcrumb + Meta */}
      <section className="bg-canvas-soft border-b border-canvas-deep" style={{ padding: 'var(--spacing-section) var(--spacing-page)' }}>
        <div className="mx-auto max-w-[1200px]">
          <Link
            to="/"
            className="inline-flex items-center gap-2 dcde-body-sm-strong text-mute hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            返回工具列表
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="dcde-badge dcde-badge-green">{categoryLabels[tool.category]}</span>
            <span className="dcde-caption text-mute">{tool.nameEn}</span>
          </div>

          <h1 className="dcde-display-xl text-ink mb-4">{tool.name}</h1>
          <p className="dcde-body-lg text-body max-w-2xl">{tool.description}</p>
        </div>
      </section>

      {/* Workspace */}
      <section className="bg-canvas" style={{ padding: 'var(--spacing-section) var(--spacing-page)' }}>
        <div className="mx-auto max-w-[1200px]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel: Controls */}
            <div className="lg:col-span-1">
              <div className="dcde-card border border-ink/5 sticky top-24">
                <h3 className="dcde-display-xs text-ink mb-6">参数设置</h3>

                <div className="space-y-5">
                  <div>
                    <label className="dcde-body-sm-strong text-ink block mb-2">输入值</label>
                    <input type="text" placeholder="请输入..." className="dcde-input" disabled />
                  </div>
                  <div>
                    <label className="dcde-body-sm-strong text-ink block mb-2">模式</label>
                    <div className="flex gap-2">
                      <button className="dcde-btn-secondary flex-1 text-sm" style={{ padding: '8px 12px' }}>模式 A</button>
                      <button className="dcde-btn-tertiary flex-1 text-sm" style={{ padding: '8px 12px' }}>模式 B</button>
                    </div>
                  </div>
                  <div>
                    <label className="dcde-body-sm-strong text-ink block mb-2">选项</label>
                    <div className="h-2 w-full bg-canvas-deep rounded-full overflow-hidden">
                      <div className="h-full w-1/2 bg-primary rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-canvas-deep">
                  <button className="dcde-btn-primary w-full">
                    应用更改
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Panel: Canvas */}
            <div className="lg:col-span-2">
              <div
                className="dcde-card border border-ink/5 flex items-center justify-center bg-canvas-soft"
                style={{ minHeight: '500px' }}
              >
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-primary/40" />
                  </div>
                  <p className="dcde-display-xs text-ink mb-2">工具开发中</p>
                  <p className="dcde-body-md text-mute">Coming Soon</p>
                  <p className="dcde-caption text-mute mt-4 max-w-sm mx-auto">
                    核心功能正在开发中。当前展示的是工具的 UI 框架和交互骨架。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
