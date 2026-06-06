import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { tools, categories } from '../data/tools.registry.js'
import { ArrowRight } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

export default function HomePage() {
  const heroRef = useRef(null)
  const gridRef = useRef(null)
  const navigate = useNavigate()

  // Hero entrance
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.from('.hero-headline', { y: 60, opacity: 0, duration: 1 })
      .from('.hero-sub', { y: 30, opacity: 0, duration: 0.8 }, '-=0.6')
      .from('.hero-cta', { y: 20, opacity: 0, duration: 0.6 }, '-=0.5')
      .from('.hero-card', { y: 40, opacity: 0, scale: 0.98, duration: 0.8 }, '-=0.6')
  }, { scope: heroRef })

  // Grid scroll reveal
  useGSAP(() => {
    const cards = gridRef.current?.querySelectorAll('.tool-card-wrap')
    if (!cards) return

    const triggers = []
    cards.forEach((card, i) => {
      const st = ScrollTrigger.create({
        trigger: card,
        start: 'top 88%',
        onEnter: () => {
          gsap.fromTo(
            card,
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', delay: (i % 3) * 0.08 }
          )
        },
        once: true,
      })
      triggers.push(st)
    })

    return () => triggers.forEach((s) => s.kill())
  }, { scope: gridRef })

  const categoryLabels = {
    all: '全部',
    color: '色彩',
    layout: '布局',
    typography: '字体',
    asset: '素材',
    accessibility: '无障碍',
  }

  const featuredTools = tools.filter((t) => t.featured)
  const otherTools = tools.filter((t) => !t.featured)

  return (
    <div>
      {/* Hero Band */}
      <section ref={heroRef} className="bg-canvas-soft" style={{ padding: 'var(--spacing-section) var(--spacing-page)' }}>
        <div className="mx-auto max-w-[1200px] flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left: Headline */}
          <div className="flex-1">
            <h1 className="hero-headline dcde-display-mega text-ink mb-6">
              为设计师<br />
              <span className="text-primary">打造的工具箱</span>
            </h1>
            <p className="hero-sub dcde-body-lg text-body max-w-lg mb-8">
              从色彩转换到网格系统，从字体比例到无障碍检测——每一个工具都经过精心设计，让创作更加精确、直觉。
            </p>
            <div className="hero-cta flex flex-wrap items-center gap-4">
              <button
                onClick={() => document.getElementById('tools-grid')?.scrollIntoView({ behavior: 'smooth' })}
                className="dcde-btn-primary"
              >
                浏览全部工具
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
              <a href="https://dcde.club" target="_blank" rel="noopener noreferrer" className="dcde-btn-secondary">
                访问 DCDE 官网
              </a>
            </div>
          </div>

          {/* Right: Quick Start Card */}
          <div className="hero-card w-full lg:w-[420px] flex-shrink-0">
            <div className="dcde-card border border-ink/10">
              <h3 className="dcde-display-sm text-ink mb-6">快速开始</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {categories.slice(1).map((cat) => (
                  <span key={cat.id} className="dcde-badge dcde-badge-green cursor-pointer" onClick={() => document.getElementById('tools-grid')?.scrollIntoView({ behavior: 'smooth' })}>
                    {cat.label}
                  </span>
                ))}
              </div>
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="搜索工具..."
                  className="dcde-input"
                  readOnly
                  onClick={() => document.getElementById('tools-grid')?.scrollIntoView({ behavior: 'smooth' })}
                />
              </div>
              <div className="border-t border-canvas-deep pt-4 mt-4">
                <p className="dcde-caption text-mute mb-3">热门工具</p>
                <div className="flex flex-col gap-2">
                  {featuredTools.slice(0, 3).map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => navigate(`/tool/${tool.id}`)}
                      className="flex items-center justify-between text-left w-full py-2 px-3 rounded-xl hover:bg-canvas-soft transition-colors"
                    >
                      <span className="dcde-body-sm-strong text-ink">{tool.name}</span>
                      <ArrowRight className="w-4 h-4 text-mute" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tools Band */}
      <section className="bg-canvas" style={{ padding: 'var(--spacing-section) var(--spacing-page)' }}>
        <div className="mx-auto max-w-[1200px]">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="dcde-display-md text-ink mb-2">精选工具</h2>
              <p className="dcde-body-md text-body">最常用的设计辅助工具</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredTools.map((tool) => (
              <div
                key={tool.id}
                className="tool-card-wrap cursor-pointer"
                style={{ opacity: 0 }}
                onClick={() => navigate(`/tool/${tool.id}`)}
              >
                <div className="dcde-card dcde-card-interactive border border-ink/5 h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="dcde-badge dcde-badge-green">
                      {categoryLabels[tool.category]}
                    </span>
                  </div>
                  <h3 className="dcde-display-sm text-ink mb-3">{tool.name}</h3>
                  <p className="dcde-body-md text-body mb-6 flex-1">{tool.description}</p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-canvas-deep">
                    <span className="dcde-body-sm text-mute">{tool.nameEn}</span>
                    <span className="dcde-body-sm-strong text-primary flex items-center gap-1">
                      打开工具 <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Tools Grid */}
      <section id="tools-grid" className="bg-canvas-soft" style={{ padding: 'var(--spacing-section) var(--spacing-page)' }}>
        <div ref={gridRef} className="mx-auto max-w-[1200px]">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="dcde-display-md text-ink mb-2">全部工具</h2>
              <p className="dcde-body-md text-body">{tools.length} 个工具，持续更新中</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherTools.map((tool) => (
              <div
                key={tool.id}
                className="tool-card-wrap cursor-pointer"
                style={{ opacity: 0 }}
                onClick={() => navigate(`/tool/${tool.id}`)}
              >
                <div className="dcde-card dcde-card-interactive border border-ink/5 h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="dcde-badge dcde-badge-green">
                      {categoryLabels[tool.category]}
                    </span>
                  </div>
                  <h3 className="dcde-display-xs text-ink mb-2">{tool.name}</h3>
                  <p className="dcde-body-sm text-body mb-4 flex-1">{tool.description}</p>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-canvas-deep">
                    <span className="dcde-caption text-mute">{tool.nameEn}</span>
                    <ArrowRight className="w-4 h-4 text-mute" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
