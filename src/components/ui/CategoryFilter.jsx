import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { categories } from '../../data/tools.registry.js'

export function CategoryFilter({ activeCategory, onSelect }) {
  const containerRef = useRef(null)
  const indicatorRef = useRef(null)

  useGSAP(() => {
    const buttons = containerRef.current?.querySelectorAll('button')
    if (!buttons || !indicatorRef.current) return

    const activeBtn = Array.from(buttons).find(
      (b) => b.dataset.category === activeCategory
    )
    if (!activeBtn) return

    gsap.to(indicatorRef.current, {
      x: activeBtn.offsetLeft,
      width: activeBtn.offsetWidth,
      duration: 0.4,
      ease: 'power3.out',
    })
  }, { dependencies: [activeCategory], scope: containerRef })

  return (
    <div ref={containerRef} className="relative flex items-center gap-1 p-1 rounded-full border border-dcde-border bg-dcde-surface-dark/40">
      <div
        ref={indicatorRef}
        className="absolute top-1 bottom-1 rounded-full bg-dcde-accent/10 border border-dcde-accent/30 pointer-events-none"
        style={{ left: 0, width: 0 }}
      />
      {categories.map((cat) => (
        <button
          key={cat.id}
          data-category={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`relative z-10 px-4 py-1.5 text-sm font-medium rounded-full transition-colors duration-300 ${
            activeCategory === cat.id
              ? 'text-dcde-accent'
              : 'text-dcde-text-secondary hover:text-dcde-text-primary'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  )
}
