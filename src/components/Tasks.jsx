import { Link } from 'react-router-dom'
import { useTasks } from '../hooks/useTasks'

const URGENCIA = {
  alta:  { label: 'Alta',  cls: 'task-badge-alta' },
  media: { label: 'Media', cls: 'task-badge-media' },
  baja:  { label: 'Baja',  cls: 'task-badge-baja' },
}

function formatDate(str) {
  if (!str) return null
  const [y, m, d] = str.split('-')
  if (!y || !m || !d) return str
  return `${d}/${m}/${y}`
}

function isOverdue(fecha_fin) {
  if (!fecha_fin) return false
  return new Date(fecha_fin) < new Date()
}

function TaskCard({ task }) {
  const urg     = URGENCIA[task.urgencia] || URGENCIA.media
  const overdue = isOverdue(task.fecha_fin)

  return (
    <div className={`task-card${overdue ? ' task-card-overdue' : ''}`}>
      <div className="task-card-top">
        <span className="task-nombre">{task.nombre}</span>
        <span className={`task-badge ${urg.cls}`}>{urg.label}</span>
      </div>
      {task.subgrupo && (
        <span className="task-subgrupo">{task.subgrupo}</span>
      )}
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

const groupIcons = {
  default: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
}

export default function Tasks() {
  const { tasks, grouped, loading, error } = useTasks()

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
        <div>
          <h1 className="links-title">Tareas</h1>
          <p className="links-subtitle">
            {loading
              ? 'Cargando...'
              : `${total} tarea${total !== 1 ? 's' : ''} · ${alta} urgentes · ${Object.keys(grouped).length} grupo${Object.keys(grouped).length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
      </div>

      {loading && <Skeleton />}

      {error && (
        <div className="links-error">
          <span>⚠️</span>
          <span>No se pudieron cargar las tareas. Verifica la configuración.</span>
        </div>
      )}

      {!loading && !error && total === 0 && (
        <div className="links-error" style={{ background: 'rgba(99,102,241,.08)', borderColor: '#6366f1' }}>
          <span>📋</span>
          <span>No hay tareas registradas aún. Agrega filas en la pestaña <strong>tareas</strong> del sheet.</span>
        </div>
      )}

      {!loading && !error && total > 0 && (
        <div className="links-sections">
          {Object.entries(grouped).map(([grupo, items]) => (
            <div key={grupo} className="links-category">
              <div className="links-category-header">
                <span className="links-category-icon">{groupIcons.default}</span>
                <span className="links-category-name">{grupo}</span>
                <span className="links-category-count">{items.length}</span>
              </div>
              <div className="tasks-grid">
                {items.map(task => <TaskCard key={task.id} task={task} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
