import { useEffect } from 'react'
import gsap from 'gsap'

export default function RuleSweep() {
  useEffect(() => {
    // Track currently hovered rule and active tween
    let currentRule = null
    let currentTween = null
    let entrySide = 'left'

    const onMouseEnter = (e) => {
      const rule = e.target.closest('.dcde-rule-solid')
      if (!rule) return

      // Determine entry side based on mouse position
      const rect = rule.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      entrySide = mouseX < rect.width / 2 ? 'left' : 'right'

      // Kill previous tween on this rule
      if (currentRule === rule && currentTween) {
        currentTween.kill()
      }
      currentRule = rule

      // If rule is already visible (scaleX ≈ 1), skip the sweep-in
      // to avoid the "flash to zero" bug on quick hovers
      const currentScaleX = gsap.getProperty(rule, 'scaleX')
      if (currentScaleX >= 0.99) {
        return
      }

      currentTween = gsap.fromTo(
        rule,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 0.35,
          ease: 'power3.out',
          transformOrigin: `${entrySide} center`,
        }
      )
    }

    const onMouseLeave = (e) => {
      const rule = e.target.closest('.dcde-rule-solid')
      if (!rule) return

      if (currentRule === rule && currentTween) {
        currentTween.kill()
      }

      // Keep rule visible — do not scale back to zero
      currentTween = gsap.to(rule, {
        scaleX: 1,
        duration: 0.25,
        ease: 'power3.out',
      })
    }

    // Event delegation on body — catches all existing and future rules
    document.body.addEventListener('mouseenter', onMouseEnter, true)
    document.body.addEventListener('mouseleave', onMouseLeave, true)

    return () => {
      document.body.removeEventListener('mouseenter', onMouseEnter, true)
      document.body.removeEventListener('mouseleave', onMouseLeave, true)
      if (currentTween) currentTween.kill()
    }
  }, [])

  return null
}
