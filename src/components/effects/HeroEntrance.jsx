import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

export default function HeroEntrance() {
  const containerRef = useRef(null)

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    tl.from('.hero-title-line', {
      y: 80,
      opacity: 0,
      rotationX: 15,
      transformOrigin: 'center bottom',
      duration: 1,
      stagger: 0.12,
    })
      .from(
        '.hero-subtitle',
        { y: 40, opacity: 0, duration: 0.8 },
        '-=0.6'
      )
      .from(
        '.hero-meta',
        { y: 30, opacity: 0, duration: 0.6 },
        '-=0.5'
      )
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className="pt-32 pb-16 lg:pt-44 lg:pb-24">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        <h1 className="font-display font-bold tracking-tighter leading-[0.9]" style={{ perspective: '1000px' }}>
          <span className="hero-title-line block text-[clamp(3rem,10vw,8rem)] text-dcde-text-primary">
            DCDE
          </span>
          <span className="hero-title-line block text-[clamp(3rem,10vw,8rem)] text-dcde-accent">
            ·make
          </span>
        </h1>
        <p className="hero-subtitle mt-6 lg:mt-8 text-lg lg:text-xl text-dcde-text-secondary max-w-xl leading-relaxed">
          为视觉设计师打造的工具合集。<br />
          从色彩到布局，从字体到素材，让每一次创作都更加精确。
        </p>
        <div className="hero-meta mt-8 flex items-center gap-4 text-sm font-mono text-dcde-text-secondary/60">
          <span className="w-12 h-px bg-dcde-border" />
          <span>8 个工具 · 持续更新</span>
        </div>
      </div>
    </div>
  )
}
