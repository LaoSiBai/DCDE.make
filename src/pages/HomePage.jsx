import { useRef, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import HeroEntrance from '../components/effects/HeroEntrance.jsx'
import { ToolCard } from '../components/ui/ToolCard.jsx'
import { CategoryFilter } from '../components/ui/CategoryFilter.jsx'
import { AccentShape } from '../components/ui/AccentShape.jsx'
import { useToolSearch } from '../hooks/useToolSearch.js'

gsap.registerPlugin(ScrollTrigger)

export default function HomePage() {
  const { query, setQuery, activeCategory, setActiveCategory, filteredTools } = useToolSearch()
  const gridRef = useRef(null)

  useGSAP(() => {
    const cards = gridRef.current?.querySelectorAll('.tool-card-item')
    if (!cards || cards.length === 0) return

    const triggers = []
    cards.forEach((card) => {
      const st = ScrollTrigger.create({
        trigger: card,
        start: 'top 85%',
        onEnter: () => {
          gsap.fromTo(
            card,
            { y: 50, opacity: 0, scale: 0.95 },
            { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' }
          )
        },
        once: true,
      })
      triggers.push(st)
    })

    return () => {
      triggers.forEach((st) => st.kill())
    }
  }, { dependencies: [filteredTools], scope: gridRef })

  // Expose expand handler for ToolCard
  useEffect(() => {
    // This is a bit of a hack - window.__dcdeExpand is set by PageTransition
    return () => {
      // cleanup if needed
    }
  }, [])

  const handleCardExpand = (element, toolId) => {
    if (window.__dcdeExpand) {
      window.__dcdeExpand(element, toolId)
    }
  }

  return (
    <div className="relative">
      <AccentShape />
      <HeroEntrance />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pb-24">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <CategoryFilter
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />
          <div className="text-sm font-mono text-dcde-text-secondary/60">
            {filteredTools.length} 个工具
          </div>
        </div>

        {/* Asymmetric Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 auto-rows-[200px]"
        >
          {filteredTools.map((tool, index) => (
            <div
              key={tool.id}
              className={`tool-card-item ${tool.span || 'col-span-1 row-span-1'}`}
              style={{ opacity: 0 }}
            >
              <ToolCard
                tool={tool}
                index={index}
                onExpand={handleCardExpand}
              />
            </div>
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-dcde-text-secondary font-mono text-sm">
              没有找到匹配的工具
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
