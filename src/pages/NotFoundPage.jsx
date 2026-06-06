import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  const pageRef = useRef(null)

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.35 } })

    // 404 Counter — quick snap count
    const codeEl = pageRef.current?.querySelector('.nf-code')
    if (codeEl) {
      const counter = { val: 0 }
      tl.to(counter, {
        val: 404,
        duration: 0.6,
        ease: 'power3.out',
        snap: { val: 1 },
        onUpdate: () => {
          codeEl.innerText = String(Math.round(counter.val)).padStart(3, '0')
        },
      })
    }

    tl.from('.nf-title', { autoAlpha: 0, y: 14 }, '-=0.2')
      .from('.nf-btn', { autoAlpha: 0, y: 10 }, '-=0.2')
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
