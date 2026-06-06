# AGENTS.md — DCDE·make

## Quickstart

```bash
npm install
npm run dev        # Vite dev server
npm run build      # Production build → dist/
npm run preview    # Preview production build
npm run lint       # ESLint (JS/JSX only)
```

## Tech Stack

- **React 19** + **Vite 6** + **React Router 7**
- **Tailwind CSS v4** — configured in CSS (`@import "tailwindcss"`, `@theme` block in `src/index.css`), NOT in `tailwind.config.js` (that file is empty and unused)
- **GSAP 3** + `@gsap/react` (`useGSAP` hook) for all animations
- **No test runner** is configured
- `type: "module"` — all files are ESM

## Tailwind v4 Quirk

- The real theme lives in `src/index.css` under `@theme` (colors, fonts, spacing, easing)
- `tailwind.config.js` is a no-op; do not edit it for theme changes
- PostCSS is also a no-op (`postcss.config.js` exports empty plugins); Tailwind runs through the `@tailwindcss/vite` plugin

## Code Conventions

- Use `.jsx` for all components (ESLint only lints `**/*.{js,jsx}`)
- Design system classes are prefixed `dcde-*` (e.g., `dcde-mega`, `dcde-pill`, `dcde-rule`) — define new ones in `src/index.css` `@layer components`
- Apple Fluid Motion easing: `cubic-bezier(0.16, 1, 0.3, 1)` (available as CSS var `--ease-apple`)
- Always respect `prefers-reduced-motion` before running GSAP timelines (see existing pages for the pattern)
- GSAP hover effects use `gsap.quickTo` for interruptible smooth motion
- `useGSAP` should be called with a `scope` ref matching the container ref

## Project Structure

```
src/
  pages/           — Route-level components (HomePage, ToolPage, AboutPage, NotFoundPage)
  components/
    layout/        — PageTransition, Footer
    ui/            — Reusable UI (Logo, ScrollProgress, RuleSweep, etc.)
    effects/       — Visual effects
  data/            — Static data (tools.registry.js)
  hooks/           — Empty currently; add custom hooks here
  index.css        — Tailwind entry + full design system
```

## Routing

- `/` — Home (tool index)
- `/tool/:toolId` — Individual tool page
- `/about` — About page
- `*` — 404

## Lint / Build

- `npm run lint` first; there is no type checker (plain JS, no TS)
- Build order: `lint` → `build` (no tests to run)

## Plan File

`plan.md` at repo root is a human-written animation enhancement roadmap; it is **not** executable spec. Verify current code state before implementing anything from it.
