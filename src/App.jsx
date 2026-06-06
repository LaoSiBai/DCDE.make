import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import SiteHeader from './components/layout/SiteHeader.jsx'
import Footer from './components/layout/Footer.jsx'
import PageTransition from './components/layout/PageTransition.jsx'
import HomePage from './pages/HomePage.jsx'
import ToolPage from './pages/ToolPage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import { useTheme } from './hooks/useTheme.js'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function App() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div
      className={`min-h-[100dvh] transition-colors duration-500 ${
        isDark
          ? 'bg-dcde-base-dark text-dcde-text-primary'
          : 'bg-dcde-base-light text-dcde-text-dark'
      }`}
    >
      <ScrollToTop />
      <SiteHeader />
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
  )
}

export default App
