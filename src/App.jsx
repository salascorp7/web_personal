import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Hero from './components/Hero'
import Projects from './components/Projects'
import About from './components/About'
import Footer from './components/Footer'
import Game from './components/Game'
import Links from './components/Links'
import Tasks from './components/Tasks'
import Entendimiento from './components/Entendimiento'
import Imagenes from './components/Imagenes'
import Monitoreo from './components/Monitoreo'

function HomePage() {
  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return
    // Esperar a que el DOM esté listo tras la navegación
    const timer = setTimeout(() => {
      const el = document.querySelector(hash)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }, 100)
    return () => clearTimeout(timer)
  }, [hash])

  return (
    <>
      <Hero />
      <Projects />
      <About />
    </>
  )
}

// Layout compartido: Sidebar + Navbar siempre presentes en rutas principales
function Layout({ children }) {
  return (
    <>
      <Sidebar />
      <Navbar />
      {children}
    </>
  )
}

function App() {
  return (
    <AuthProvider>
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <main>
                <HomePage />
              </main>
              <Footer />
            </Layout>
          }
        />
        <Route path="/juego" element={<Game />} />
        <Route path="/links"  element={<Layout><Links /></Layout>} />
        <Route path="/tareas"         element={<Layout><Tasks /></Layout>} />
        <Route path="/entendimiento"  element={<Layout><Entendimiento /></Layout>} />
        <Route path="/imagenes"       element={<Layout><Imagenes /></Layout>} />
        <Route path="/monitoreo"      element={<Layout><Monitoreo /></Layout>} />
      </Routes>
    </Router>
    </AuthProvider>
  )
}

export default App
