# DCDE·make Animation Enhancement Plan

## Current State Audit

| Page | Animations |
|------|------------|
| PageTransition | Fade+slide entrance on route change |
| HomePage | Entrance stagger (logo→title→sub→rule→rows), per-row hover (x shift, index white, arrow slide) |
| ToolPage | Entrance timeline (back→title→desc→rule→sidebar→canvas), back arrow hover |
| AboutPage | Entrance timeline (back→title→rule→lead→items stagger), back arrow hover |
| NotFoundPage | Entrance (code scale+y→title y→button y) |
| Footer | ScrollTrigger fade-in |
| Logo | Per-letter y shift + scale on hover |
| PageTransition expand | Tool row expand to fullscreen (unused) |

---

## Implementation Plan — 11 Animations

### P0 — Core Interaction (3)

| # | Animation | File | GSAP Features |
|---|-----------|------|---------------|
| 1 | **Custom Cursor** | New: `src/components/ui/Cursor.jsx` + global mount in App | `gsap.quickTo` for x/y, scale on hover, `mix-blend-mode: difference` |
| 2 | **Magnetic Buttons** | `src/components/ui/MagneticButton.jsx` wrap for `dcde-pill`, `dcde-nav` | `pointermove` + `quickTo` relative offset ±8px, spring ease |
| 3 | **Click Ripple** | `src/components/ui/Ripple.jsx` on `dcde-pill` | `fromTo` scale 0→1.5 + opacity 1→0, centered on click |

### P1 — Scroll Experience (3)

| # | Animation | File | GSAP Features |
|---|-----------|------|---------------|
| 4 | **Parallax Brand** | `src/pages/HomePage.jsx` | `ScrollTrigger` scrub 0.5, title y offset slower than scroll |
| 5 | **Principles Reveal** | `src/pages/AboutPage.jsx` | `ScrollTrigger` per-item, start `top 85%`, stagger chars/words |
| 6 | **Scroll Progress Bar** | New: `src/components/ui/ScrollProgress.jsx` | `ScrollTrigger` on `window`, draw line width 0→100% |

### P2 — Entrance Drama (3)

| # | Animation | File | GSAP Features |
|---|-----------|------|---------------|
| 7 | **404 Counter** | `src/pages/NotFoundPage.jsx` | `gsap.to` object with `innerText` snap, `ease: "power2.out"` |
| 8 | **Tool Row Skew** | `src/pages/HomePage.jsx` entrance | Add `skewY: 3 → 0` to row `from()` |
| 9 | **Title Char Stagger** | `src/pages/HomePage.jsx`, `ToolPage.jsx`, `AboutPage.jsx` | `SplitText` plugin, `from` chars `autoAlpha: 0, y: 20` stagger 0.02 |

### P3 — Atmosphere (2)

| # | Animation | File | GSAP Features |
|---|-----------|------|---------------|
| 10 | **Canvas Breath** | `src/pages/ToolPage.jsx` Coming Soon | `gsap.to` scale 1 ↔ 0.985, yoyo, repeat -1, duration 3 |
| 11 | **Rule Sweep** | `src/index.css` + JS hook | Hover rule → `scaleX 0→1` with `transformOrigin` from mouse side |

---

## File Changes

### New Files
- `src/components/ui/Cursor.jsx` — Custom cursor component
- `src/components/ui/MagneticButton.jsx` — Magnetic wrapper
- `src/components/ui/Ripple.jsx` — Click ripple component
- `src/components/ui/ScrollProgress.jsx` — Top progress bar

### Modified Files
- `src/App.jsx` — Mount Cursor, ScrollProgress
- `src/index.css` — Import SplitText, add rule-sweep utilities
- `src/pages/HomePage.jsx` — Parallax, row skew, char stagger
- `src/pages/ToolPage.jsx` — Canvas breath
- `src/pages/AboutPage.jsx` — Principles ScrollTrigger reveal
- `src/pages/NotFoundPage.jsx` — 404 counter
- `src/components/layout/Footer.jsx` — (no change, already has ScrollTrigger)
- `src/components/ui/Logo.jsx` — (no change)

---

## GSAP Plugins Needed

```bash
npm i gsap @gsap/react  # already installed
# SplitText is in gsap core (since 3.12) — no extra install
```

---

## Execution Strategy

Launch 3 agents in parallel:
- **Agent A**: New UI components (Cursor, MagneticButton, Ripple, ScrollProgress) + App integration
- **Agent B**: Page-level animations (HomePage parallax/skew/chars, ToolPage breath, AboutPage reveal, NotFound counter)
- **Agent C**: ScrollProgress + RuleSweep + global integration + build verification

Each agent works independently on separate files. Merge sequentially.