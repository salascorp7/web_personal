import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Projects from './components/Projects'
import About from './components/About'
import Footer from './components/Footer'
import Game from './components/Game'

function HomePage() {
  return (
    <>
      <Hero />
      <Projects />
      <About />
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
            <>
              <Navbar />
              <main>
                <HomePage />
              </main>
              <Footer />
            </>
          }
        />
        <Route path="/juego" element={<Game />} />
      </Routes>
    </Router>
    </AuthProvider>
  )
}

export default App
