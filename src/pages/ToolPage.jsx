import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
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
      <div className="dcde-container py-24 text-center">
        <p className="dcde-text-sm text-grey-text mb-8">Tool not found</p>
        <Link to="/" className="dcde-link dcde-text-sm dcde-text-accent">
          返回首页
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh]">
      <hr className="dcde-divider" />

      <div className="max-w-[1440px] mx-auto" style={{ padding: '0 var(--spacing-page-margin)' }}>
        {/* Back + Meta */}
        <div className="mb-12">
          <Link
            to="/"
            className="dcde-link dcde-text-xs text-grey-text hover:text-text inline-flex items-center gap-2 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <span className="dcde-text-xs text-grey-text">
              {categoryLabels[tool.category] || tool.category}
            </span>
            <span className="dcde-text-xs text-grey-light">
              {tool.nameEn}
            </span>
          </div>

          <h1 className="dcde-text-lg dcde-text-accent tracking-tight">
            {tool.name}
          </h1>

          <p className="dcde-text-sm text-grey-text mt-3 max-w-2xl">
            {tool.description}
          </p>
        </div>

        {/* Workspace */}
        <div className="dcde-grid-12" style={{ gap: 'var(--spacing-gap-sm)' }}>
          {/* Param Panel */}
          <div className="dcde-col-3">
            <div className="border-2 border-border p-6" style={{ minHeight: '400px' }}>
              <div className="mb-4">
                <div className="h-3 w-24 bg-grey-placeholder rounded-sm mb-2" />
                <div className="h-2 w-full bg-grey-placeholder/50 rounded-sm" />
              </div>
              <div className="mb-4">
                <div className="h-3 w-20 bg-grey-placeholder rounded-sm mb-2" />
                <div className="h-2 w-3/4 bg-grey-placeholder/50 rounded-sm" />
              </div>
              <div className="mb-4">
                <div className="h-3 w-28 bg-grey-placeholder rounded-sm mb-2" />
                <div className="h-2 w-1/2 bg-grey-placeholder/50 rounded-sm" />
              </div>
              <div className="mt-8 h-10 w-full border-2 border-accent/30 bg-accent/5" />
            </div>
          </div>

          {/* Preview Canvas */}
          <div className="dcde-col-9">
            <div
              className="border-2 border-border bg-grey-placeholder/20 flex items-center justify-center"
              style={{ minHeight: '400px', aspectRatio: '16 / 9' }}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 border-2 border-dashed border-accent/30 flex items-center justify-center">
                  <div className="w-3 h-3 bg-accent/40" />
                </div>
                <p className="dcde-text-xs text-grey-text">工具开发中</p>
                <p className="dcde-text-xs text-grey-light mt-1">Coming Soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
