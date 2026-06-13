<!-- From: D:/dev/dcde-make/AGENTS.md -->
# AGENTS.md — DCDE·make

## Project Overview

DCDE·make is a single-page-application (SPA) built as a curated tool collection for visual designers. It presents a dark, minimalist interface with extreme typographic scale, Apple Fluid Motion animations, and a strict interactive hierarchy. The site is bilingual: UI labels and tool metadata are authored in Chinese (Simplified) with English translations stored alongside for future expansion.

> **IMPORTANT**: All visual, typography, copywriting, and GSAP animation guidelines have been decoupled from this file.
> 👉 **For design and tone specifications, YOU MUST READ [DESIGN.md](./DESIGN.md) before making UI or animation changes.**

The project ships as a static site (`dist/` after build) and is served from a standard Vite production bundle.

---

## Quickstart

```bash
npm install
npm run dev        # Vite dev server (port 5173 by default)
npm run build      # Production build → dist/
npm run preview    # Preview production build
npm run lint       # ESLint (JS/JSX only)
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 (StrictMode) |
| Bundler | Vite 6 |
| Router | React Router 7 (`BrowserRouter`) |
| Styling | Tailwind CSS v4 (CSS-based configuration) |
| Animation | GSAP 3 + `@gsap/react` (`useGSAP` hook) |
| Smooth Scroll | Lenis 1.x (synced to GSAP ScrollTrigger) |
| Icons | `lucide-react` |
| Utilities | `clsx`, `tailwind-merge` |
| Language | Plain JavaScript (ES modules), JSX-only components |

**No test runner is configured.** There is no type checker (plain JS, no TS), although `@types/react` and `@types/react-dom` are present as devDependencies for IDE support.

---

## Project Structure

```text
src/
  pages/               — Route-level components
    HomePage.jsx       — Tool index with Bento Grid cards and Hero section
    ToolPage.jsx       — Individual tool page ("/tool/:toolId")
    AboutPage.jsx      — About page ("/about")
    NotFoundPage.jsx   — 404 page ("*")
  components/
    layout/
      Header.jsx       — Top navigation bar (includes links previously in footer)
      PageTransition.jsx — Route-change entrance animation (fade + slide)
    ui/
      Logo.jsx         — SVG logo (pure SVG, no hover state animations)
      MagneticButton.jsx — Pointer-tracking magnetic wrapper (gsap.quickTo)
      Ripple.jsx       — Click ripple effect (gsap.fromTo scale + opacity)
      RuleSweep.jsx    — Global hover sweep on `.dcde-rule-solid` dividers
      HeroAction.jsx   — Expanding hover capsule for "Start" button
    ErrorBoundary.jsx  — Class-based React error boundary
    SmoothScroll.jsx   — Lenis instance synced with GSAP ScrollTrigger
  data/
    tools.registry.js  — Static tool definitions
  hooks/               — Empty currently; add custom hooks here
  App.jsx              — Root routes + global layout (RuleSweep, Header, SmoothScroll)
  main.jsx             — React root mount with BrowserRouter + ErrorBoundary
  index.css            — Tailwind entry + full design system
```

---

## Routing

| Path | Component | Notes |
|------|-----------|-------|
| `/` | `HomePage` | Tool index rendered as a Bento Grid of cards |
| `/tool/:toolId` | `ToolPage` | Sidebar + canvas placeholder |
| `/about` | `AboutPage` | Principles list with ScrollTrigger reveal |
| `*` | `NotFoundPage` | Animated 404 counter |

Navigation uses `useNavigate` for programmatic routing and `<Link>` for declarative links. The `PageTransition` wrapper in `App.jsx` animates route changes with a fade/slide entrance (skips animation on first render).

---

## Data Layer

Tool definitions live in `src/data/tools.registry.js`:

- `tools` — array of tool objects (`id`, `name`, `nameEn`, `updatedAt`, `description`, `descriptionEn`, `featured`, `span`).
- `getToolById(id)` — lookup by slug.
- Note: The previous **category tagging system was removed**. Do not reintroduce categories unless specified. The primary metadata for a tool card is its `updatedAt` date.

This file is the **single source of truth** for tool metadata. No backend API is used.

---

## Code Style Guidelines

- **File extension**: All components must use `.jsx` (ESLint only lints `**/*.{js,jsx}`).
- **Module system**: ESM only (`"type": "module"` in `package.json`).
- **Imports**: Use `.jsx` extensions in relative imports (e.g., `import App from './App.jsx'`).
- **Strings**: Prefer single quotes in JS; double quotes in JSX attributes.
- **CSS class composition**: Use `clsx` + `tailwind-merge` when conditionally combining Tailwind classes.

---

## Security & Environment

- This is a static client-side React application. No backend API or sensitive secrets exist.
- No `.env` file is present or needed.
