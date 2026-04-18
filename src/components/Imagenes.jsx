import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useImagenes } from '../hooks/useImagenes'

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ item, onClose, onPrev, onNext, hasPrev, hasNext }) {
  if (!item) return null

  const handleKey = (e) => {
    if (e.key === 'Escape')    onClose()
    if (e.key === 'ArrowLeft'  && hasPrev) onPrev()
    if (e.key === 'ArrowRight' && hasNext) onNext()
  }

  return (
    <div className="lb-overlay" onClick={onClose} onKeyDown={handleKey} tabIndex={0}
      ref={el => el?.focus()}
    >
      <button className="lb-close" onClick={onClose} title="Cerrar (Esc)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      {hasPrev && (
        <button className="lb-arrow lb-arrow-left" onClick={e => { e.stopPropagation(); onPrev() }} title="Anterior">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
      )}

      <div className="lb-content" onClick={e => e.stopPropagation()}>
        <img
          src={`/api/images/${item.fileId}`}
          alt={item.nombre}
          className="lb-img"
        />
        <div className="lb-info">
          <span className="lb-nombre">{item.nombre}</span>
          {item.categoria && <span className="lb-categoria">{item.categoria}</span>}
          {item.descripcion && <p className="lb-desc">{item.descripcion}</p>}
        </div>
      </div>

      {hasNext && (
        <button className="lb-arrow lb-arrow-right" onClick={e => { e.stopPropagation(); onNext() }} title="Siguiente">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      )}
    </div>
  )
}

// ── Miniatura ─────────────────────────────────────────────────────────────────
function Thumbnail({ item, onClick }) {
  const [loaded,  setLoaded]  = useState(false)
  const [errored, setErrored] = useState(false)

  return (
    <button className="img-thumb-btn" onClick={onClick} title={item.nombre}>
      {!loaded && !errored && <div className="img-thumb-skeleton" />}
      {errored && (
        <div className="img-thumb-error">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
      )}
      <img
        src={`/api/images/${item.fileId}`}
        alt={item.nombre}
        className={`img-thumb${loaded ? ' loaded' : ''}`}
        onLoad={() => setLoaded(true)}
        onError={() => { setLoaded(true); setErrored(true) }}
        style={{ display: errored ? 'none' : undefined }}
      />
      <div className="img-thumb-overlay">
        <span className="img-thumb-name">{item.nombre}</span>
        {item.descripcion && (
          <span className="img-thumb-desc">{item.descripcion.slice(0, 60)}{item.descripcion.length > 60 ? '…' : ''}</span>
        )}
      </div>
    </button>
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

const groupIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
)

// ── Página principal ──────────────────────────────────────────────────────────
export default function Imagenes() {
  const { items, grouped, loading, error } = useImagenes()
  const [lbIndex, setLbIndex] = useState(null) // índice global en items[]

  const total  = items.length
  const grupos = Object.keys(grouped).length

  const openItem  = (idx) => setLbIndex(idx)
  const closeLb   = () => setLbIndex(null)
  const prevLb    = () => setLbIndex(i => Math.max(0, i - 1))
  const nextLb    = () => setLbIndex(i => Math.min(items.length - 1, i + 1))

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
          <h1 className="links-title">Imágenes relevantes</h1>
          <p className="links-subtitle">
            {loading
              ? 'Cargando...'
              : `${total} imagen${total !== 1 ? 'es' : ''} · ${grupos} categoría${grupos !== 1 ? 's' : ''}`
            }
          </p>
        </div>
      </div>

      {loading && <Skeleton />}

      {error && (
        <div className="links-error">
          <span>⚠️</span>
          <span>No se pudieron cargar las imágenes. Verifica la configuración.</span>
        </div>
      )}

      {!loading && !error && total === 0 && (
        <div className="links-error" style={{ background: 'rgba(99,102,241,.08)', borderColor: '#6366f1' }}>
          <span>🖼️</span>
          <span>No hay imágenes visibles. Agrega filas con <strong>visualizar = 1</strong> en la pestaña <strong>imagenes</strong> del sheet.</span>
        </div>
      )}

      {!loading && !error && total > 0 && (
        <div className="links-sections">
          {Object.entries(grouped).map(([categoria, catItems]) => (
            <div key={categoria} className="links-category">
              <div className="links-category-header">
                <span className="links-category-icon">{groupIcon}</span>
                <span className="links-category-name">{categoria}</span>
                <span className="links-category-count">{catItems.length}</span>
              </div>
              <div className="img-grid">
                {catItems.map(item => {
                  const globalIdx = items.findIndex(i => i.id === item.id)
                  return (
                    <Thumbnail key={item.id} item={item} onClick={() => openItem(globalIdx)} />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Lightbox
        item={lbIndex !== null ? items[lbIndex] : null}
        onClose={closeLb}
        onPrev={prevLb}
        onNext={nextLb}
        hasPrev={lbIndex > 0}
        hasNext={lbIndex < items.length - 1}
      />
    </div>
  )
}
