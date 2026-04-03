import { useRef, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'

const PersonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
  </svg>
)

function AuthSection() {
  const { user, isAdmin, login, logout } = useAuth()
  const [error, setError] = useState(null)

  const handleSuccess = async (credentialResponse) => {
    setError(null)
    try { await login(credentialResponse.credential) }
    catch (e) { setError(e.message) }
  }

  if (user) {
    return (
      <div className="dropdown">
        <button
          className="btn p-0 border-0 bg-transparent d-flex align-items-center gap-2 nav-user-btn"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          <img src={user.picture} alt={user.name} className="nav-avatar" />
          <span className="text-white fw-semibold d-none d-lg-inline nav-display-name">
            {user.name.split(' ')[0]}
          </span>
          {isAdmin && <span className="badge bg-linkedin nav-admin-badge">Admin</span>}
        </button>

        <ul className="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow mt-2">
          <li className="px-3 py-2">
            <div className="d-flex align-items-center gap-2">
              <img src={user.picture} alt={user.name} className="nav-avatar" />
              <div>
                <div className="text-white fw-semibold" style={{ fontSize: '0.88rem' }}>{user.name}</div>
                <div className="text-white-50" style={{ fontSize: '0.75rem' }}>{user.email}</div>
              </div>
            </div>
          </li>
          <li><hr className="dropdown-divider" /></li>
          <li>
            <button className="dropdown-item text-danger" onClick={logout}>
              Cerrar sesión
            </button>
          </li>
        </ul>
      </div>
    )
  }

  return (
    <div className="dropdown">
      <button
        className="btn nav-account-btn d-flex align-items-center gap-2"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <PersonIcon />
        <span className="d-none d-lg-inline">Mi cuenta</span>
      </button>

      <div className="dropdown-menu dropdown-menu-end shadow p-3 nav-login-dropdown">
        <p className="text-muted text-center mb-3" style={{ fontSize: '0.85rem' }}>
          Inicia sesión para continuar
        </p>
        <div className="d-flex justify-content-center">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => setError('Error al iniciar sesión')}
            theme="outline"
            size="medium"
            text="continue_with"
            locale="es"
          />
        </div>
        {error && (
          <p className="text-danger text-center mt-2 mb-0" style={{ fontSize: '0.75rem' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

export default function Navbar() {
  const collapseRef = useRef(null)
  const location    = useLocation()

  useEffect(() => {
    if (collapseRef.current?.classList.contains('show')) {
      document.querySelector('[data-bs-toggle="collapse"]')?.click()
    }
  }, [location])

  return (
    <nav id="header" className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm">
      <div className="container">

        {/* Logo — siempre a la izquierda */}
        <a className="navbar-brand" href="#main">
          <img src="/assets/images/salascorp_logo.svg" alt="SalasCorp" height="46" />
        </a>

        {/* Links colapsables */}
        <div ref={collapseRef} className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto gap-lg-2">
            <li className="nav-item"><a className="nav-link" href="#main">Inicio</a></li>
            <li className="nav-item"><a className="nav-link" href="#projects">Proyectos</a></li>
            <li className="nav-item"><a className="nav-link" href="#about">Contacto</a></li>
          </ul>
        </div>

        {/* Auth — siempre a la derecha */}
        <AuthSection />

        {/* Hamburguesa — móvil */}
        <button
          className="navbar-toggler border-0 ms-2"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Abrir menú"
        >
          <span className="navbar-toggler-icon" />
        </button>

      </div>
    </nav>
  )
}
