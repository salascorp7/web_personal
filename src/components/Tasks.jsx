import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTasks } from '../hooks/useTasks'
import TaskCalendar from './TaskCalendar'

// ── Constantes ────────────────────────────────────────────────────────────────
const URGENCIA = {
  alta:  { label: 'Alta',  cls: 'task-badge-alta',  order: 0 },
  media: { label: 'Media', cls: 'task-badge-media', order: 1 },
  baja:  { label: 'Baja',  cls: 'task-badge-baja',  order: 2 },
}

const COLUMNS = [
  { key: 'nombre',       label: 'Nombre' },
  { key: 'grupo',        label: 'Grupo' },
  { key: 'subgrupo',     label: 'Subgrupo' },
  { key: 'fecha_inicio', label: 'Inicio' },
  { key: 'fecha_fin',    label: 'Fin' },
  { key: 'urgencia',     label: 'Urgencia' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  if (!y || !m || !d) return str
  return `${d}/${m}/${y}`
}

function isOverdue(fecha_fin) {
  if (!fecha_fin) return false
  return new Date(fecha_fin) < new Date()
}

function cmpValue(a, b, key) {
  if (key === 'urgencia') {
    const ao = (URGENCIA[a.urgencia] || URGENCIA.media).order
    const bo = (URGENCIA[b.urgencia] || URGENCIA.media).order
    return ao - bo
  }
  return (a[key] || '').localeCompare(b[key] || '', 'es')
}

// ── Sub-componentes ───────────────────────────────────────────────────────────
function UrgenciaBadge({ value }) {
  const u = URGENCIA[value] || URGENCIA.media
  return <span className={`task-badge ${u.cls}`}>{u.label}</span>
}

function SortIcon({ active, dir }) {
  if (!active) return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" opacity=".35">
      <polyline points="8 9 12 5 16 9"/><polyline points="16 15 12 19 8 15"/>
    </svg>
  )
  return dir === 'asc'
    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="8 15 12 9 16 15"/></svg>
    : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="8 9 12 15 16 9"/></svg>
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

// ── Vista Tabla ───────────────────────────────────────────────────────────────
function TableView({ tasks }) {
  const [search,    setSearch]    = useState('')
  const [sortKey,   setSortKey]   = useState('urgencia')
  const [sortDir,   setSortDir]   = useState('asc')
  const [hidden,    setHidden]    = useState(new Set())
  const [showHidden, setShowHidden] = useState(false)
  const [hiddenCols, setHiddenCols] = useState(new Set())
  const [showColMenu, setShowColMenu] = useState(false)

  const visibleCols = COLUMNS.filter(c => !hiddenCols.has(c.key))

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const toggleHideRow = (id) => {
    setHidden(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleCol = (key) => {
    setHiddenCols(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return tasks
      .filter(t => {
        if (!showHidden && hidden.has(t.id)) return false
        if (!q) return true
        return Object.values(t).some(v => String(v).toLowerCase().includes(q))
      })
      .sort((a, b) => {
        const r = cmpValue(a, b, sortKey)
        return sortDir === 'asc' ? r : -r
      })
  }, [tasks, search, sortKey, sortDir, hidden, showHidden])

  return (
    <div className="task-table-wrap">
      {/* Barra de controles */}
      <div className="task-table-toolbar">
        <div className="task-search-box">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar tareas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="task-search-input"
          />
          {search && (
            <button className="task-search-clear" onClick={() => setSearch('')}>×</button>
          )}
        </div>

        <div className="task-toolbar-actions">
          {hidden.size > 0 && (
            <button
              className={`task-toolbar-btn${showHidden ? ' active' : ''}`}
              onClick={() => setShowHidden(p => !p)}
              title={showHidden ? 'Ocultar filas escondidas' : `Mostrar ${hidden.size} oculta${hidden.size > 1 ? 's' : ''}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {showHidden
                  ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                  : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                }
              </svg>
              {hidden.size} oculta{hidden.size > 1 ? 's' : ''}
            </button>
          )}

          {/* Menú columnas */}
          <div style={{ position: 'relative' }}>
            <button
              className={`task-toolbar-btn${showColMenu ? ' active' : ''}`}
              onClick={() => setShowColMenu(p => !p)}
              title="Mostrar/ocultar columnas"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="18"/><rect x="14" y="3" width="7" height="18"/>
              </svg>
              Columnas
            </button>
            {showColMenu && (
              <div className="task-col-menu">
                {COLUMNS.map(c => (
                  <label key={c.key} className="task-col-item">
                    <input
                      type="checkbox"
                      checked={!hiddenCols.has(c.key)}
                      onChange={() => toggleCol(c.key)}
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contador */}
      <div className="task-table-info">
        {filtered.length} de {tasks.length} tarea{tasks.length !== 1 ? 's' : ''}
        {search && <span> · búsqueda: <strong>"{search}"</strong></span>}
      </div>

      {/* Tabla */}
      <div className="task-table-container">
        <table className="task-table">
          <thead>
            <tr>
              {visibleCols.map(col => (
                <th key={col.key} onClick={() => toggleSort(col.key)} className="task-th">
                  <span>{col.label}</span>
                  <SortIcon active={sortKey === col.key} dir={sortDir} />
                </th>
              ))}
              <th className="task-th task-th-actions"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={visibleCols.length + 1} className="task-td-empty">
                  Sin resultados para "{search}"
                </td>
              </tr>
            )}
            {filtered.map(task => {
              const overdue  = isOverdue(task.fecha_fin)
              const isHidden = hidden.has(task.id)
              return (
                <tr
                  key={task.id}
                  className={`task-tr${overdue ? ' task-tr-overdue' : ''}${isHidden ? ' task-tr-hidden' : ''}`}
                >
                  {visibleCols.map(col => (
                    <td key={col.key} className="task-td">
                      {col.key === 'urgencia'
                        ? <UrgenciaBadge value={task.urgencia} />
                        : col.key === 'fecha_inicio' || col.key === 'fecha_fin'
                          ? <span className={col.key === 'fecha_fin' && overdue ? 'task-overdue-label' : ''}>
                              {formatDate(task[col.key])}
                            </span>
                          : task[col.key] || '—'
                      }
                    </td>
                  ))}
                  <td className="task-td task-td-act">
                    <button
                      className="task-hide-btn"
                      onClick={() => toggleHideRow(task.id)}
                      title={isHidden ? 'Mostrar fila' : 'Ocultar fila'}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {isHidden
                          ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                          : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                        }
                      </svg>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Vista Cards (agrupada) ────────────────────────────────────────────────────
function TaskCard({ task }) {
  const urg     = URGENCIA[task.urgencia] || URGENCIA.media
  const overdue = isOverdue(task.fecha_fin)
  return (
    <div className={`task-card${overdue ? ' task-card-overdue' : ''}`}>
      <div className="task-card-top">
        <span className="task-nombre">{task.nombre}</span>
        <span className={`task-badge ${urg.cls}`}>{urg.label}</span>
      </div>
      {task.subgrupo && <span className="task-subgrupo">{task.subgrupo}</span>}
      {(task.fecha_inicio || task.fecha_fin) && (
        <div className="task-dates">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>
            {formatDate(task.fecha_inicio)}
            {task.fecha_inicio && task.fecha_fin && ' → '}
            {formatDate(task.fecha_fin)}
            {overdue && <span className="task-overdue-label"> · Vencida</span>}
          </span>
        </div>
      )}
    </div>
  )
}

function CardsView({ grouped }) {
  const groupIcon = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  )
  return (
    <div className="links-sections">
      {Object.entries(grouped).map(([grupo, items]) => (
        <div key={grupo} className="links-category">
          <div className="links-category-header">
            <span className="links-category-icon">{groupIcon}</span>
            <span className="links-category-name">{grupo}</span>
            <span className="links-category-count">{items.length}</span>
          </div>
          <div className="tasks-grid">
            {items.map(task => <TaskCard key={task.id} task={task} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function Tasks() {
  const { tasks, grouped, loading, error } = useTasks()
  const [view, setView] = useState('cards') // 'cards' | 'table' | 'calendar'

  const alta  = tasks.filter(t => t.urgencia === 'alta').length
  const total = tasks.length

  return (
    <div className="links-page">
      <div className="links-header">
        <Link to="/" className="links-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Volver
        </Link>
        <div style={{ flex: 1 }}>
          <h1 className="links-title">Tareas</h1>
          <p className="links-subtitle">
            {loading
              ? 'Cargando...'
              : `${total} tarea${total !== 1 ? 's' : ''} · ${alta} urgentes · ${Object.keys(grouped).length} grupo${Object.keys(grouped).length !== 1 ? 's' : ''}`
            }
          </p>
        </div>

        {/* Toggle vista */}
        {!loading && !error && total > 0 && (
          <div className="task-view-toggle">
            <button
              className={`task-view-btn${view === 'cards' ? ' active' : ''}`}
              onClick={() => setView('cards')}
              title="Vista tarjetas"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
              </svg>
            </button>
            <button
              className={`task-view-btn${view === 'table' ? ' active' : ''}`}
              onClick={() => setView('table')}
              title="Vista tabla"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M3 12h18M3 18h18M8 3v18M16 3v18"/>
              </svg>
            </button>
            <button
              className={`task-view-btn${view === 'calendar' ? ' active' : ''}`}
              onClick={() => setView('calendar')}
              title="Vista calendario"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {loading && <Skeleton />}

      {error && (
        <div className="links-error">
          <span>⚠️</span>
          <span>No se pudieron cargar las tareas.</span>
        </div>
      )}

      {!loading && !error && total === 0 && (
        <div className="links-error" style={{ background: 'rgba(99,102,241,.08)', borderColor: '#6366f1' }}>
          <span>📋</span>
          <span>No hay tareas registradas. Agrega filas en la pestaña <strong>tareas</strong> del sheet.</span>
        </div>
      )}

      {!loading && !error && total > 0 && (
        view === 'cards'    ? <CardsView grouped={grouped} /> :
        view === 'table'    ? <TableView tasks={tasks} /> :
                              <TaskCalendar tasks={tasks} />
      )}
    </div>
  )
}
