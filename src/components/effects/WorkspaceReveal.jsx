import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

export default function WorkspaceReveal() {
  const containerRef = useRef(null)

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.7 } })

    tl.from('.panel-left', { x: -40, opacity: 0 })
      .from('.panel-right', { x: 40, opacity: 0 }, '<')
      .from('.param-item', { x: -20, opacity: 0, stagger: 0.08 }, '-=0.4')
      .from('.canvas-content', { y: 20, opacity: 0, duration: 0.5 }, '-=0.5')
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className="flex flex-col lg:flex-row gap-6 h-full">
      <div className="panel-left w-full lg:w-80 flex-shrink-0 rounded-2xl border border-dcde-border bg-dcde-surface-dark/50 backdrop-blur-sm p-6">
        <div className="param-item mb-4">
          <div className="h-3 w-24 bg-dcde-border rounded mb-2" />
          <div className="h-2 w-full bg-dcde-border/50 rounded" />
        </div>
        <div className="param-item mb-4">
          <div className="h-3 w-20 bg-dcde-border rounded mb-2" />
          <div className="h-2 w-3/4 bg-dcde-border/50 rounded" />
        </div>
        <div className="param-item mb-4">
          <div className="h-3 w-28 bg-dcde-border rounded mb-2" />
          <div className="h-2 w-1/2 bg-dcde-border/50 rounded" />
        </div>
        <div className="param-item">
          <div className="h-8 w-full bg-dcde-accent/10 border border-dcde-accent/30 rounded-lg mt-6" />
        </div>
      </div>
      <div className="panel-right flex-1 rounded-2xl border border-dcde-border bg-dcde-surface-dark/30 backdrop-blur-sm p-8 flex items-center justify-center min-h-[300px]">
        <div className="canvas-content text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-dcde-accent/30 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-dcde-accent/40" />
          </div>
          <p className="text-dcde-text-secondary text-sm font-mono">工具开发中</p>
          <p className="text-dcde-text-secondary/50 text-xs font-mono mt-1">Coming Soon</p>
        </div>
      </div>
    </div>
  )
}
