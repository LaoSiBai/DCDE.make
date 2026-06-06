import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  const pageRef = useRef(null)

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.from('.nf-code', { autoAlpha: 0, y: 30, scale: 0.95, duration: 0.8 })
      .from('.nf-title', { autoAlpha: 0, y: 20, duration: 0.7 }, '-=0.5')
      .from('.nf-btn', { autoAlpha: 0, y: 15, duration: 0.5 }, '-=0.4')
  }, { scope: pageRef })

  return (
    <div ref={pageRef} className="min-h-[100dvh] flex items-center justify-center" style={{ padding: '0 var(--spacing-page)' }}>
      <div className="text-center">
        <span className="nf-code dcde-mega text-ink-faint leading-none select-none block mb-4">
          404
        </span>
        <h1 className="nf-title dcde-xl text-ink mb-6">页面未找到</h1>
        <Link to="/" className="nf-btn dcde-pill inline-flex">
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>
      </div>
    </div>
  )
}
