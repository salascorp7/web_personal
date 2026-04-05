import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useEntendimiento } from '../hooks/useEntendimiento'

// Icono por grupo (genérico + algunos reconocidos)
const groupIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
)

// Modal para leer descripción completa
function DescModal({ item, onClose }) {
  if (!item) return null
  return (
    <div className="ent-modal-overlay" onClick={onClose}>
      <div className="ent-modal" onClick={e => e.stopPropagation()}>
        <div className="ent-modal-header">
          <div>
            <h2 className="ent-modal-title">{item.nombre}</h2>
            <span className="ent-modal-grupo">{item.grupo}</span>
          </div>
          <button className="ent-modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="ent-modal-body">
          <p className="ent-modal-desc">{item.descripcion || 'Sin descripción.'}</p>
        </div>
      </div>
    </div>
  )
}

function EntCard({ item, onRead }) {
  const short  = item.descripcion && item.descripcion.length > 120
  const preview = short ? item.descripcion.slice(0, 120) + '…' : item.descripcion

  return (
    <div className="ent-card">
      <div className="ent-card-header">
        <span className="ent-card-name">{item.nombre}</span>
      </div>
      {item.descripcion ? (
        <p className="ent-card-desc">{preview}</p>
      ) : (
        <p className="ent-card-desc ent-card-desc-empty">Sin descripción.</p>
      )}
      {short && (
        <button className="ent-card-read-btn" onClick={() => onRead(item)}>
          Leer completo
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      )}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="links-skeleton">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="links-skeleton-card">
          <div className="links-skeleton-icon" style={{ borderRadius: 8 }} />
          <div className="links-skeleton-lines">
            <div className="links-skeleton-line w-60" />
            <div className="links-skeleton-line w-40" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Entendimiento() {
  const { items, grouped, loading, error } = useEntendimiento()
  const [modalItem, setModalItem] = useState(null)

  const total  = items.length
  const grupos = Object.keys(grouped).length

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
          <h1 className="links-title">Entendimiento</h1>
          <p className="links-subtitle">
            {loading
              ? 'Cargando...'
              : `${total} entrada${total !== 1 ? 's' : ''} · ${grupos} grupo${grupos !== 1 ? 's' : ''}`
            }
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

      {!loading && !error && total === 0 && (
        <div className="links-error" style={{ background: 'rgba(99,102,241,.08)', borderColor: '#6366f1' }}>
          <span>📖</span>
          <span>No hay entradas visibles. Agrega filas con <strong>visualizar = 1</strong> en la pestaña <strong>entendimiento</strong> del sheet.</span>
        </div>
      )}

      {!loading && !error && total > 0 && (
        <div className="links-sections">
          {Object.entries(grouped).map(([grupo, entries]) => (
            <div key={grupo} className="links-category">
              <div className="links-category-header">
                <span className="links-category-icon">{groupIcon}</span>
                <span className="links-category-name">{grupo}</span>
                <span className="links-category-count">{entries.length}</span>
              </div>
              <div className="ent-grid">
                {entries.map(item => (
                  <EntCard key={item.id} item={item} onRead={setModalItem} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <DescModal item={modalItem} onClose={() => setModalItem(null)} />
    </div>
  )
}
