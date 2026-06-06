import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ArrowUpRight } from 'lucide-react'

export function ToolCard({ tool, index, onExpand }) {
  const cardRef = useRef(null)
  const innerRef = useRef(null)
  const navigate = useNavigate()

  useGSAP(() => {
    const card = cardRef.current
    const inner = innerRef.current
    if (!card || !inner) return

    const hoverTl = gsap.timeline({ paused: true })
    hoverTl.to(inner, {
      y: -8,
      scale: 1.02,
      borderColor: '#338bff',
      boxShadow: '0 20px 40px rgba(51,139,255,0.15)',
      duration: 0.4,
      ease: 'back.out(1.4)',
    })

    const handleEnter = () => hoverTl.play()
    const handleLeave = () => hoverTl.reverse()

    card.addEventListener('mouseenter', handleEnter)
    card.addEventListener('mouseleave', handleLeave)

    return () => {
      card.removeEventListener('mouseenter', handleEnter)
      card.removeEventListener('mouseleave', handleLeave)
      hoverTl.kill()
    }
  }, { scope: cardRef })

  const handleClick = () => {
    if (onExpand) {
      onExpand(cardRef.current, tool.id)
    } else {
      navigate(`/tool/${tool.id}`)
    }
  }

  const categoryLabels = {
    color: '色彩',
    layout: '布局',
    typography: '字体',
    asset: '素材',
    accessibility: '无障碍',
  }

  return (
    <div
      ref={cardRef}
      className={`relative cursor-pointer group ${tool.span || 'col-span-1 row-span-1'}`}
      style={{ perspective: '1000px' }}
    >
      <div
        ref={innerRef}
        onClick={handleClick}
        className="h-full min-h-[200px] p-6 lg:p-8 rounded-2xl border border-dcde-border bg-dcde-surface-dark/50 backdrop-blur-sm flex flex-col justify-between transition-colors duration-300 will-change-transform"
      >
        <div>
          <div className="flex items-start justify-between mb-4">
            <span className="inline-block px-2.5 py-0.5 text-xs font-mono font-medium rounded-full border border-dcde-border text-dcde-text-secondary">
              {categoryLabels[tool.category] || tool.category}
            </span>
            <ArrowUpRight className="w-5 h-5 text-dcde-text-secondary group-hover:text-dcde-accent transition-colors duration-300" />
          </div>
          <h3 className="font-display text-2xl lg:text-3xl font-semibold text-dcde-text-primary mb-2 leading-tight">
            {tool.name}
          </h3>
          <p className="text-sm text-dcde-text-secondary leading-relaxed">
            {tool.description}
          </p>
        </div>
        <div className="mt-6 flex items-center gap-2 text-xs font-mono text-dcde-text-secondary/60">
          <span className="w-2 h-2 rounded-full bg-dcde-accent/40" />
          {tool.nameEn}
        </div>
      </div>
    </div>
  )
}
