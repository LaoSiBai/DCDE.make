import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { tools } from '../data/tools.registry.js'

gsap.registerPlugin(ScrollTrigger)

export default function HomePage() {
  const gridRef = useRef(null)
  const navigate = useNavigate()

  useGSAP(() => {
    const rows = gridRef.current?.querySelectorAll('.tool-row')
    if (!rows) return

    const triggers = []
    rows.forEach((row) => {
      const st = ScrollTrigger.create({
        trigger: row,
        start: 'top 90%',
        onEnter: () => {
          gsap.fromTo(
            row,
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
          )
        },
        once: true,
      })
      triggers.push(st)
    })

    return () => {
      triggers.forEach((st) => st.kill())
    }
  }, { scope: gridRef })

  const categoryLabels = {
    color: '色彩',
    layout: '布局',
    typography: '字体',
    asset: '素材',
    accessibility: '无障碍',
  }

  return (
    <div>
      <hr className="dcde-divider" />

      <main ref={gridRef} className="flex flex-col" style={{ gap: 'var(--spacing-gap-lg)' }}>
        {tools.map((tool) => (
          <article
            key={tool.id}
            className="tool-row dcde-grid-12 cursor-pointer group"
            style={{ opacity: 0 }}
            onClick={() => navigate(`/tool/${tool.id}`)}
          >
            {/* Meta */}
            <div className="dcde-col-3 flex flex-col">
              <h2 className="dcde-text-lg dcde-text-accent mb-5">
                {tool.name}
              </h2>
              <div className="flex flex-col">
                <p className="dcde-text-sm mb-5">
                  {tool.description}
                </p>
                <p className="dcde-text-xs text-grey-light mb-8">
                  {tool.descriptionEn}
                </p>
              </div>
              <div className="mt-auto">
                <span className="dcde-text-xs text-grey-text dcde-link group-hover:text-text">
                  了解更多
                </span>
              </div>
            </div>

            {/* Visual */}
            <div
              className="dcde-col-9 bg-grey-placeholder relative"
              style={{ aspectRatio: '16 / 9', width: '100%' }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="dcde-text-lg text-grey-light">
                    {tool.nameEn}
                  </span>
                  <span className="dcde-text-xs text-grey-light block mt-2">
                    {categoryLabels[tool.category] || tool.category}
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </main>
    </div>
  )
}
