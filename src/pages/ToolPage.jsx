import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getToolById } from '../data/tools.registry.js'
import WorkspaceReveal from '../components/effects/WorkspaceReveal.jsx'

export default function ToolPage() {
  const { toolId } = useParams()
  const tool = getToolById(toolId)

  if (!tool) {
    return (
      <div className="pt-32 pb-24 max-w-[1440px] mx-auto px-6 lg:px-10 text-center">
        <p className="text-dcde-text-secondary font-mono mb-4">Tool not found</p>
        <Link to="/" className="text-dcde-accent hover:underline text-sm">
          返回首页
        </Link>
      </div>
    )
  }

  const categoryLabels = {
    color: '色彩',
    layout: '布局',
    typography: '字体',
    asset: '素材',
    accessibility: '无障碍',
  }

  return (
    <div className="pt-32 pb-24 min-h-[100dvh]">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        {/* Back + Meta */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-dcde-text-secondary hover:text-dcde-accent transition-colors duration-300 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-mono">返回首页</span>
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2.5 py-0.5 text-xs font-mono font-medium rounded-full border border-dcde-border text-dcde-text-secondary">
              {categoryLabels[tool.category] || tool.category}
            </span>
            <span className="text-xs font-mono text-dcde-text-secondary/40">
              {tool.nameEn}
            </span>
          </div>
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-dcde-text-primary tracking-tight">
            {tool.name}
          </h1>
          <p className="mt-3 text-dcde-text-secondary max-w-2xl leading-relaxed">
            {tool.description}
          </p>
        </div>

        {/* Workspace */}
        <div className="mt-10">
          <WorkspaceReveal />
        </div>
      </div>
    </div>
  )
}
