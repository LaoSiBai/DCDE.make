import { Routes, Route, useLocation, matchPath } from 'react-router-dom'
import clsx from 'clsx'
import PageTransition from './components/layout/PageTransition.jsx'
import HomePage from './pages/HomePage.jsx'
import ToolPage, { toolComponents } from './pages/ToolPage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import Header from './components/layout/Header.jsx'
import RuleSweep from './components/ui/RuleSweep.jsx'
import SmoothScroll from './components/SmoothScroll.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

function App() {
  const location = useLocation()
  const match = matchPath('/tool/:toolId', location.pathname)
  let isAppLayout = false

  if (match && match.params.toolId) {
    const ToolComp = toolComponents[match.params.toolId]
    if (ToolComp && ToolComp.isAppLayout) {
      isAppLayout = true
    }
  }

  return (
    <SmoothScroll>
      <div className={clsx("bg-void text-ink flex flex-col", isAppLayout ? "h-[100dvh] overflow-hidden" : "min-h-[100dvh]")}>
        <RuleSweep />
        {!isAppLayout && <Header />}
        <main className={isAppLayout ? "flex-1 flex flex-col" : "pt-14 md:pt-16 flex-1 flex flex-col"}>
          <PageTransition className="flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/tool/:toolId" element={<ToolPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </PageTransition>
        </main>
      </div>
    </SmoothScroll>
  )
}

export default App
