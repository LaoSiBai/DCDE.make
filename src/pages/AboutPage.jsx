import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowLeft } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

export default function AboutPage() {
  const pageRef = useRef(null)

  useGSAP(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced) {
      gsap.set('.ap-back, .ap-title, .ap-rule, .ap-lead', {
        autoAlpha: 1,
        y: 0,
        scaleX: 1,
      })
      gsap.set('.ap-item', { autoAlpha: 1, y: 0, scale: 1 })
      return
    }

    const tl = gsap.timeline({ defaults: { ease: 'expo.out', duration: 0.6 } })

    tl.from('.ap-back', { autoAlpha: 0, y: -10 })
      .from('.ap-title', { autoAlpha: 0, y: 20 }, '-=0.4')
      .from('.ap-rule', { autoAlpha: 0, scaleX: 0, transformOrigin: 'left center', duration: 0.7, ease: 'expo.out' }, '-=0.4')
      .from('.ap-lead', { autoAlpha: 0, y: 10 }, '-=0.4')
  }, { scope: pageRef })

  // Principles ScrollTrigger Reveal — smooth deceleration, no overshoot
  useGSAP(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const items = gsap.utils.toArray('.ap-item', pageRef.current)
    items.forEach((item) => {
      if (reduced) {
        gsap.set(item.querySelector('.dcde-caption'), { autoAlpha: 1, scale: 1 })
        gsap.set(item.querySelector('h3'), { autoAlpha: 1, y: 0 })
        gsap.set(item.querySelector('p'), { autoAlpha: 1, y: 0 })
        return
      }

      const numEl = item.querySelector('.dcde-caption')
      const titleEl = item.querySelector('h3')
      const descEl = item.querySelector('p')

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: item,
          start: 'top 85%',
          once: true,
        },
        defaults: { ease: 'expo.out', duration: 0.6 },
      })

      if (numEl) {
        tl.from(numEl, { autoAlpha: 0, scale: 0.85 })
      }
      if (titleEl) {
        tl.from(titleEl, { autoAlpha: 0, y: 14 }, '-=0.4')
      }
      if (descEl) {
        tl.from(descEl, { autoAlpha: 0, y: 8 }, '-=0.4')
      }
    })
  }, { scope: pageRef })

  // Back button arrow shift
  const handleBackEnter = (e) => {
    gsap.to(e.currentTarget.querySelector('.back-arrow'), {
      x: -3,
      duration: 0.35,
      ease: 'expo.out',
    })
  }
  const handleBackLeave = (e) => {
    gsap.to(e.currentTarget.querySelector('.back-arrow'), {
      x: 0,
      duration: 0.35,
      ease: 'expo.out',
    })
  }

  return (
    <div ref={pageRef} className="min-h-[100dvh]" style={{ padding: '0 var(--spacing-page)' }}>
      <div className="pt-20 pb-12">
        <Link
          to="/"
          className="ap-back dcde-nav mb-8"
          onMouseEnter={handleBackEnter}
          onMouseLeave={handleBackLeave}
        >
          <ArrowLeft className="back-arrow w-4 h-4" />
          返回
        </Link>
        <h1 className="ap-title dcde-mega text-ink mt-4">关于</h1>
      </div>

      <div className="ap-rule dcde-rule-solid mb-12" />

      <div className="max-w-3xl pb-24">
        <p className="ap-lead dcde-xl text-ink-dim mb-12" style={{ lineHeight: 1.4 }}>
          DCDE·make 是 DCDE 为视觉设计师打造的工具合集。<br />
          我们相信，好的工具应该像好的设计一样——精确、直觉、没有多余的噪音。
        </p>

        <div className="space-y-12">
          {[
            { num: '01', title: '精确性优先', desc: '每一个像素、每一个数值都应该被精确控制' },
            { num: '02', title: '即时反馈', desc: '所见即所得，没有任何延迟或猜测' },
            { num: '03', title: '可访问性', desc: '工具本身就应该成为无障碍设计的典范' },
            { num: '04', title: '开放透明', desc: '开源、可审查、可扩展' },
          ].map((item) => (
            <div key={item.title} className="ap-item flex items-start gap-4">
              <span className="dcde-caption text-ink-faint mt-0.5 select-none">{item.num}</span>
              <div>
                <h3 className="dcde-lg text-ink mb-1">{item.title}</h3>
                <p className="dcde-body text-ink-dim">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
