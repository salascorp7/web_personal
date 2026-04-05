import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
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
              <Sidebar />
              <Navbar />
              <main>
                <HomePage />
              </main>
              <Footer />
            </>
          }
        />
        <Route path="/juego" element={<Game />} />
        <Route path="/links"  element={<><Navbar /><Links /></>} />
        <Route path="/tareas" element={<><Navbar /><Tasks /></>} />
      </Routes>
    </Router>
    </AuthProvider>
  )
}

export default App
