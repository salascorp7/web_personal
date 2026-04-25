import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import sidebarLinks from '../data/sidebarLinks'

const icons = {
  links: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  tareas: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  entendimiento: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  chevron: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  external: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
  home: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  proyectos: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  contacto: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  imagenes: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  monitoreo: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
}

const navItems = [
  { id: 'links',        label: 'Links relevantes',   icon: icons.links },
  { id: 'tareas',       label: 'Tareas',              icon: icons.tareas },
  { id: 'entendimiento',label: 'Entendimiento',       icon: icons.entendimiento },
  { id: 'imagenes',     label: 'Imágenes relevantes', icon: icons.imagenes },
  { id: 'monitoreo',    label: 'Monitoreo Web',       icon: icons.monitoreo },
]

function LinkCard({ link }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="sb-link-card"
      data-bs-dismiss="offcanvas"
    >
      <div className="sb-link-avatar" style={{ background: link.color }}>
        {link.initials}
      </div>
      <div className="sb-link-info">
        <span className="sb-link-name">{link.name}</span>
        <span className="sb-link-desc">{link.description}</span>
      </div>
      <span className="sb-link-ext">{icons.external}</span>
    </a>
  )
}

// Cierra el offcanvas programáticamente
function closeOffcanvas() {
  const el = document.getElementById('mainSidebar')
  if (el && window.bootstrap) {
    window.bootstrap.Offcanvas.getInstance(el)?.hide()
  }
}

const homeLinks = [
  { id: 'inicio',    label: 'Inicio',    icon: icons.home,      hash: '#main' },
  { id: 'proyectos', label: 'Proyectos', icon: icons.proyectos, hash: '#projects' },
  { id: 'contacto',  label: 'Contacto',  icon: icons.contacto,  hash: '#about' },
]

export default function Sidebar() {
  const { user, isAdmin } = useAuth()
  const [openSection, setOpenSection] = useState(null)
  const navigate  = useNavigate()
  const location  = useLocation()

  if (!isAdmin) return null

  const handleHomeLink = (hash) => {
    closeOffcanvas()
    if (location.pathname === '/') {
      // Ya estamos en home: solo hacer scroll
      const el = document.querySelector(hash)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    } else {
      // Navegar a home y luego scroll al llegar
      navigate('/' + hash)
    }
  }

  const handleNavItem = (id) => {
    if (id === 'links' || id === 'tareas' || id === 'entendimiento' || id === 'imagenes' || id === 'monitoreo') {
      closeOffcanvas()
      navigate('/' + id)
    } else {
      setOpenSection(prev => prev === id ? null : id)
    }
  }

  return (
    <div
      className="offcanvas offcanvas-start sb-panel"
      id="mainSidebar"
      tabIndex="-1"
    >
      {/* Header con perfil */}
      <div className="sb-header">
        <div className="sb-profile">
          <img src={user.picture} alt={user.name} className="sb-avatar" />
          <div>
            <div className="sb-profile-name">{user.name.split(' ')[0]}</div>
            <div className="sb-profile-role">Administrador</div>
          </div>
        </div>
        <button
          className="btn-close btn-close-white sb-close"
          data-bs-dismiss="offcanvas"
          aria-label="Cerrar"
        />
      </div>

      {/* Accesos directos — home */}
      <div className="sb-nav-divider-label">Página principal</div>
      <nav className="sb-nav sb-nav-home">
        {homeLinks.map(item => (
          <button
            key={item.id}
            className="sb-nav-item"
            onClick={() => handleHomeLink(item.hash)}
          >
            <span className="sb-nav-icon">{item.icon}</span>
            <span className="sb-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sb-nav-divider-label">Admin</div>
      {/* Navegación admin */}
      <nav className="sb-nav">
        {navItems.map(item => (
          <div key={item.id} className="sb-nav-section">

            {/* Ítem principal */}
            <button
              className={`sb-nav-item${openSection === item.id ? ' active' : ''}`}
              onClick={() => handleNavItem(item.id)}
            >
              <span className="sb-nav-icon">{item.icon}</span>
              <span className="sb-nav-label">{item.label}</span>
              <span className={`sb-nav-chevron${openSection === item.id ? ' open' : ''}`}>
                {icons.chevron}
              </span>
            </button>

            {/* Contenido expandible */}
            {openSection === item.id && (
              <div className="sb-nav-content">
                {item.id === 'links' && (
                  <div className="sb-links-list">
                    {sidebarLinks.map(link => (
                      <LinkCard key={link.id} link={link} />
                    ))}
                  </div>
                )}
                {item.id === 'tareas' && (
                  <div className="sb-empty">
                    <span>🚧</span><span>Próximamente</span>
                  </div>
                )}
                {item.id === 'entendimiento' && (
                  <div className="sb-empty">
                    <span>📖</span><span>Próximamente</span>
                  </div>
                )}
              </div>
            )}

          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sb-footer">
        <img src="/assets/images/salascorp_logo.svg" alt="SalasCorp" height="28" />
      </div>
    </div>
  )
}
