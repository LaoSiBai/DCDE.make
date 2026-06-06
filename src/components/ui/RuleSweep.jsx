import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

export default function RuleSweep() {
  useGSAP(() => {
    const rules = document.querySelectorAll('.dcde-rule-solid')
    if (!rules.length) return

    const ctx = gsap.context(() => {
      rules.forEach((rule) => {
        let entrySide = 'left'

        const onMouseEnter = (e) => {
          const rect = rule.getBoundingClientRect()
          const mouseX = e.clientX - rect.left
          entrySide = mouseX < rect.width / 2 ? 'left' : 'right'

          gsap.killTweensOf(rule)

          gsap.fromTo(
            rule,
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: 0.4,
              ease: 'power2.out',
              transformOrigin: `${entrySide} center`,
            }
          )
        }

        const onMouseLeave = () => {
          gsap.killTweensOf(rule)

          gsap.to(rule, {
            scaleX: 0,
            duration: 0.3,
            ease: 'power2.in',
            transformOrigin: `${entrySide} center`,
          })
        }

        rule.addEventListener('mouseenter', onMouseEnter)
        rule.addEventListener('mouseleave', onMouseLeave)

        rule.style.transformOrigin = 'left center'
        rule.style.willChange = 'transform'
      })
    })

    return () => ctx.revert()
  }, [])

  return null
}