import { Routes, Route } from 'react-router-dom'
import Footer from './components/layout/Footer.jsx'
import PageTransition from './components/layout/PageTransition.jsx'
import HomePage from './pages/HomePage.jsx'
import ToolPage from './pages/ToolPage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import RuleSweep from './components/ui/RuleSweep.jsx'
import SmoothScroll from './components/SmoothScroll.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

function App() {
  return (
    <SmoothScroll>
      <div className="min-h-[100dvh] bg-void text-ink">
        <RuleSweep />
        <main>
          <PageTransition>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/tool/:toolId" element={<ToolPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </PageTransition>
        </main>
        <Footer />
      </div>
    </SmoothScroll>
  )
}

export default App
