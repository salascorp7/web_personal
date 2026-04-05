import { useState, useMemo } from 'react'

// ── Helpers ───────────────────────────────────────────────────────────────────
const today = new Date()

function parseDate(str) {
  if (!str) return null
  const [y, m, d] = str.split('-')
  return new Date(+y, +m - 1, +d)
}

function formatDate(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

function isOverdue(fecha_fin) {
  if (!fecha_fin) return false
  return parseDate(fecha_fin) < today
}

// Prioridad de color: vencida > alta > media > baja
function dayColor(tasks) {
  if (tasks.some(t => isOverdue(t.fecha_fin))) return 'vencida'
  if (tasks.some(t => t.urgencia === 'alta'))  return 'alta'
  if (tasks.some(t => t.urgencia === 'media')) return 'media'
  return 'baja'
}

const URGENCIA = {
  alta:  { label: 'Alta',  cls: 'task-badge-alta' },
  media: { label: 'Media', cls: 'task-badge-media' },
  baja:  { label: 'Baja',  cls: 'task-badge-baja' },
}

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                     'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAY_NAMES   = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']

// ── Componente ────────────────────────────────────────────────────────────────
export default function TaskCalendar({ tasks }) {
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selected,  setSelected]  = useState(null)

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
    setSelected(null)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
    setSelected(null)
  }

  // Agrupa tareas por día del mes visible (usa fecha_fin, o fecha_inicio si no hay fin)
  const tasksByDay = useMemo(() => {
    const map = {}
    tasks.forEach(t => {
      const dateStr = t.fecha_fin || t.fecha_inicio
      const d = parseDate(dateStr)
      if (!d || d.getFullYear() !== viewYear || d.getMonth() !== viewMonth) return
      const key = d.getDate()
      if (!map[key]) map[key] = []
      map[key].push(t)
    })
    return map
  }, [tasks, viewYear, viewMonth])

  // Genera celdas del grid (incluyendo días adyacentes para completar semanas)
  const cells = useMemo(() => {
    const firstDay      = new Date(viewYear, viewMonth, 1)
    const startOffset   = (firstDay.getDay() + 6) % 7   // lunes=0
    const daysInMonth   = new Date(viewYear, viewMonth + 1, 0).getDate()
    const daysPrevMonth = new Date(viewYear, viewMonth, 0).getDate()
    const total = Math.ceil((startOffset + daysInMonth) / 7) * 7
    return Array.from({ length: total }, (_, i) => {
      const day = i - startOffset + 1
      if (day >= 1 && day <= daysInMonth) return { day, current: true }
      if (day < 1) return { day: daysPrevMonth + day, current: false }
      return { day: day - daysInMonth, current: false }
    })
  }, [viewYear, viewMonth])

  const weeks = Math.ceil(cells.length / 7)

  // Stats del mes
  const monthStats = useMemo(() => {
    const all      = Object.values(tasksByDay).flat()
    const vencidas = all.filter(t => isOverdue(t.fecha_fin)).length
    const altas    = all.filter(t => t.urgencia === 'alta').length
    return { total: all.length, vencidas, altas }
  }, [tasksByDay])

  const selectedTasks = selected ? (tasksByDay[selected] || []) : []

  return (
    <div className="cal-wrap">

      {/* ── Barra superior ─────────────────────────────────────────────────── */}
      <div className="cal-topbar">
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={prevMonth}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span className="cal-month-label">{MONTH_NAMES[viewMonth]} {viewYear}</span>
          <button className="cal-nav-btn" onClick={nextMonth}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

        <div className="cal-stats">
          <div className="cal-stat">
            <span className="cal-stat-num">{monthStats.total}</span>
            <span className="cal-stat-lbl">este mes</span>
          </div>
          <div className="cal-stat">
            <span className="cal-stat-num cal-stat-red">{monthStats.vencidas}</span>
            <span className="cal-stat-lbl">vencidas</span>
          </div>
          <div className="cal-stat">
            <span className="cal-stat-num cal-stat-amber">{monthStats.altas}</span>
            <span className="cal-stat-lbl">urgentes</span>
          </div>
        </div>

        <div className="cal-legend">
          <span className="cal-dot cal-dot-vencida" /> Vencida
          <span className="cal-dot cal-dot-alta" />    Alta
          <span className="cal-dot cal-dot-media" />   Media
          <span className="cal-dot cal-dot-baja" />    Baja
        </div>
      </div>

      {/* ── Área principal ─────────────────────────────────────────────────── */}
      <div className="cal-main">

        {/* Grid */}
        <div className="cal-grid-wrap">
          {/* Encabezado días */}
          <div className="cal-grid cal-header-row">
            {DAY_NAMES.map(d => (
              <div key={d} className="cal-day-header">{d}</div>
            ))}
          </div>

          {/* Celdas */}
          <div className="cal-grid" style={{ gridTemplateRows: `repeat(${weeks}, 1fr)` }}>
            {cells.map(({ day, current }, i) => {
              const dayTasks   = current ? (tasksByDay[day] || []) : []
              const isToday    = current && today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear
              const isSelected = current && day === selected
              const isWeekend  = i % 7 >= 5
              const color      = dayTasks.length ? dayColor(dayTasks) : null

              return (
                <div
                  key={i}
                  className={[
                    'cal-cell',
                    !current   ? 'cal-cell-other'    : '',
                    isToday    ? 'cal-cell-today'    : '',
                    isSelected ? 'cal-cell-selected' : '',
                    isWeekend && current ? 'cal-cell-weekend' : '',
                    color      ? `cal-cell-has-${color}` : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => current && dayTasks.length && setSelected(day === selected ? null : day)}
                >
                  <span className={`cal-day-num${isToday ? ' cal-day-today-num' : ''}`}>{day}</span>

                  {/* Puntos móvil */}
                  {dayTasks.length > 0 && (
                    <div className="cal-dots d-sm-none">
                      {dayTasks.slice(0, 3).map((t, j) => (
                        <span key={j} className={`cal-dot cal-dot-${isOverdue(t.fecha_fin) ? 'vencida' : t.urgencia}`} />
                      ))}
                    </div>
                  )}

                  {/* Badges desktop */}
                  {dayTasks.length > 0 && (
                    <div className="cal-badges d-none d-sm-flex">
                      {dayTasks.slice(0, 2).map((t, j) => {
                        const st = isOverdue(t.fecha_fin) ? 'vencida' : t.urgencia
                        return (
                          <div key={j} className={`cal-badge cal-badge-${st}`}>
                            <span className={`cal-dot cal-dot-${st}`} />
                            <span className="cal-badge-text">{t.nombre}</span>
                          </div>
                        )
                      })}
                      {dayTasks.length > 2 && (
                        <div className="cal-badge cal-badge-more">+{dayTasks.length - 2}</div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Panel detalle desktop */}
        <div className={`cal-panel${selected ? ' cal-panel-active' : ''}`}>
          <div className={`cal-panel-header${selected ? ' cal-panel-header-active' : ''}`}>
            {selected ? (
              <>
                <div className="cal-panel-date">
                  {selected} de {MONTH_NAMES[viewMonth]}
                </div>
                <div className="cal-panel-count">{selectedTasks.length} tarea{selectedTasks.length !== 1 ? 's' : ''}</div>
              </>
            ) : (
              <div className="cal-panel-empty-hint">Selecciona un día con tareas</div>
            )}
            {selected && (
              <button className="cal-panel-close" onClick={() => setSelected(null)}>×</button>
            )}
          </div>

          <div className="cal-panel-body">
            {!selected && (
              <div className="cal-panel-placeholder">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>Haz clic en un día para ver sus tareas</span>
              </div>
            )}

            {selectedTasks.map((t, i) => {
              const st  = isOverdue(t.fecha_fin) ? 'vencida' : t.urgencia
              const urg = URGENCIA[t.urgencia] || URGENCIA.media
              return (
                <div key={i} className={`cal-task-item cal-task-item-${st}`}>
                  <div className="cal-task-name">{t.nombre}</div>
                  {t.subgrupo && <div className="cal-task-sub">{t.subgrupo}</div>}
                  <div className="cal-task-meta">
                    <span className={`task-badge ${urg.cls}`}>{urg.label}</span>
                    {t.grupo && <span className="cal-task-grupo">{t.grupo}</span>}
                  </div>
                  {(t.fecha_inicio || t.fecha_fin) && (
                    <div className="cal-task-dates">
                      {formatDate(t.fecha_inicio)}
                      {t.fecha_inicio && t.fecha_fin && ' → '}
                      {formatDate(t.fecha_fin)}
                      {isOverdue(t.fecha_fin) && <span className="task-overdue-label"> · Vencida</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Bottom sheet móvil ──────────────────────────────────────────────── */}
      {selected && (
        <div className="cal-sheet-overlay" onClick={() => setSelected(null)}>
          <div className="cal-sheet" onClick={e => e.stopPropagation()}>
            <div className="cal-sheet-header">
              <div>
                <div className="cal-panel-date">{selected} de {MONTH_NAMES[viewMonth]}</div>
                <div className="cal-panel-count">{selectedTasks.length} tarea{selectedTasks.length !== 1 ? 's' : ''}</div>
              </div>
              <button className="cal-panel-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="cal-sheet-body">
              {selectedTasks.map((t, i) => {
                const st  = isOverdue(t.fecha_fin) ? 'vencida' : t.urgencia
                const urg = URGENCIA[t.urgencia] || URGENCIA.media
                return (
                  <div key={i} className={`cal-task-item cal-task-item-${st}`}>
                    <div className="cal-task-name">{t.nombre}</div>
                    {t.subgrupo && <div className="cal-task-sub">{t.subgrupo}</div>}
                    <div className="cal-task-meta">
                      <span className={`task-badge ${urg.cls}`}>{urg.label}</span>
                      {t.grupo && <span className="cal-task-grupo">{t.grupo}</span>}
                    </div>
                    {(t.fecha_inicio || t.fecha_fin) && (
                      <div className="cal-task-dates">
                        {formatDate(t.fecha_inicio)}
                        {t.fecha_inicio && t.fecha_fin && ' → '}
                        {formatDate(t.fecha_fin)}
                        {isOverdue(t.fecha_fin) && <span className="task-overdue-label"> · Vencida</span>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
