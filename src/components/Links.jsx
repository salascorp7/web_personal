import { Link } from 'react-router-dom'
import { useLinks } from '../hooks/useLinks'

const categoryIcons = {
  'Proyectos personales': (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  'Inversiones': (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
    </svg>
  ),
}

const defaultIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)

function AppCard({ link }) {
  return (
    <a href={link.url} target="_blank" rel="noopener noreferrer" className="link-app-card">
      <div className="link-app-icon" style={{ background: link.color }}>
        {link.initials}
      </div>
      <div className="link-app-info">
        <h3 className="link-app-name">{link.name}</h3>
        <p className="link-app-desc">{link.description}</p>
        <span className="link-app-url">{(() => { try { return new URL(link.url).hostname } catch { return link.url } })()}</span>
      </div>
      <div className="link-app-arrow">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
      </div>
    </a>
  )
}

function Skeleton() {
  return (
    <div className="links-skeleton">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="links-skeleton-card">
          <div className="links-skeleton-icon" />
          <div className="links-skeleton-lines">
            <div className="links-skeleton-line w-60" />
            <div className="links-skeleton-line w-40" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Links() {
  const { links, grouped, loading, error } = useLinks()

  return (
    <div className="links-page">
      <div className="links-header">
        <Link to="/" className="links-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Volver
        </Link>
        <div>
          <h1 className="links-title">Links relevantes</h1>
          <p className="links-subtitle">
            {loading ? 'Cargando...' : `${links.length} accesos · ${Object.keys(grouped).length} categorías`}
          </p>
        </div>
      </div>

      {loading && <Skeleton />}

      {error && (
        <div className="links-error">
          <span>⚠️</span>
          <span>No se pudo cargar el sheet. Verifica la configuración.</span>
        </div>
      )}

      {!loading && !error && (
        <div className="links-sections">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="links-category">
              <div className="links-category-header">
                <span className="links-category-icon">
                  {categoryIcons[category] || defaultIcon}
                </span>
                <span className="links-category-name">{category}</span>
                <span className="links-category-count">{items.length}</span>
              </div>
              <div className="links-grid">
                {items.map(link => <AppCard key={link.id} link={link} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
