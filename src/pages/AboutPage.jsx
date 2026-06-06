import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ArrowLeft } from 'lucide-react'

export default function AboutPage() {
  const pageRef = useRef(null)

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    tl.from('.ap-back', { autoAlpha: 0, x: -10, duration: 0.5 })
      .from('.ap-title', { autoAlpha: 0, y: 30, duration: 0.9 }, '-=0.3')
      .from('.ap-rule', { scaleX: 0, transformOrigin: 'left center', duration: 0.8, ease: 'power2.inOut' }, '-=0.5')
      .from('.ap-lead', { autoAlpha: 0, y: 20, duration: 0.7 }, '-=0.4')
      .from('.ap-item', {
        autoAlpha: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.1,
      }, '-=0.3')
  }, { scope: pageRef })

  // Back button arrow shift
  const handleBackEnter = (e) => {
    gsap.to(e.currentTarget.querySelector('.back-arrow'), { x: -4, duration: 0.25, ease: 'power2.out' })
  }
  const handleBackLeave = (e) => {
    gsap.to(e.currentTarget.querySelector('.back-arrow'), { x: 0, duration: 0.25, ease: 'power2.out' })
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
