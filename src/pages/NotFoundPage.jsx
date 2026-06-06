import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  const pageRef = useRef(null)

  useGSAP(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const codeEl = pageRef.current?.querySelector('.nf-code')
    if (!codeEl) return

    if (reduced) {
      gsap.set(codeEl, { autoAlpha: 1, scale: 1 })
      gsap.set('.nf-title, .nf-btn', { autoAlpha: 1, y: 0 })
      return
    }

    const tl = gsap.timeline({ defaults: { ease: 'expo.out', duration: 0.6 } })

    // 404 Counter — snap count with heavy friction
    const counter = { val: 0 }
    tl.to(counter, {
      val: 404,
      duration: 0.8,
      ease: 'expo.out',
      snap: { val: 1 },
      onUpdate: () => {
        codeEl.innerText = String(Math.round(counter.val)).padStart(3, '0')
      },
    })

    tl.from('.nf-title', { autoAlpha: 0, y: 12 }, '-=0.4')
      .from('.nf-btn', { autoAlpha: 0, y: 8 }, '-=0.4')
  }, { scope: pageRef })

  return (
    <div ref={pageRef} className="min-h-[100dvh] flex items-center justify-center" style={{ padding: '0 var(--spacing-page)' }}>
      <div className="text-center" aria-label="404 页面未找到">
        <span className="nf-code dcde-mega text-ink-faint leading-none select-none block mb-4" aria-hidden="true">
          404
        </span>
        <h1 className="nf-title dcde-xl text-ink mb-6">页面未找到</h1>
        <Link to="/" className="nf-btn dcde-pill inline-flex">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          返回首页
        </Link>
      </div>
    </div>
  )
}
