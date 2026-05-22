import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useMonitoreo } from '../hooks/useMonitoreo'

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDuration(sec) {
  const s = Math.round(sec)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function topFrequency(data, field, n = 5) {
  const counts = {}
  data.forEach(row => {
    const v = row[field]
    if (v && v !== '(ninguna)' && v !== '(ninguno)') counts[v] = (counts[v] || 0) + 1
  })
  const total = data.length || 1
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, count]) => ({ name, count, pct: count / total }))
}

// ── SVG Line Chart ────────────────────────────────────────────────────────────
function LineChart({ data, color = '#6366f1' }) {
  if (!data.length) return null
  const W = 600, H = 150
  const pad = { t: 12, r: 12, b: 28, l: 36 }
  const cW  = W - pad.l - pad.r
  const cH  = H - pad.t - pad.b
  const vals = data.map(d => d.sesiones)
  const max  = Math.max(...vals, 1)
  const pts  = data.map((d, i) => ({
    x: pad.l + (i / Math.max(data.length - 1, 1)) * cW,
    y: pad.t + (1 - d.sesiones / max) * cH,
    d,
  }))
  const line = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `M${pts[0].x.toFixed(1)},${(pad.t + cH).toFixed(1)} ` +
    pts.map(p => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
    ` L${pts[pts.length - 1].x.toFixed(1)},${(pad.t + cH).toFixed(1)} Z`

  const yTicks = [0, Math.round(max / 2), max]
  const xIdxs  = data.length > 2
    ? [0, Math.floor((data.length - 1) / 2), data.length - 1]
    : data.map((_, i) => i)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="mon-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0"    />
        </linearGradient>
      </defs>
      {yTicks.map((v, i) => {
        const y = pad.t + (1 - v / max) * cH
        return (
          <g key={i}>
            <line x1={pad.l} y1={y} x2={pad.l + cW} y2={y} stroke="#1e293b" strokeWidth="1" />
            <text x={pad.l - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#475569">{v}</text>
          </g>
        )
      })}
      <path d={area} fill="url(#mon-grad)" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} stroke="#0f172a" strokeWidth="1.5">
          <title>{p.d.fecha}: {p.d.sesiones} sesiones</title>
        </circle>
      ))}
      {xIdxs.map(i => (
        <text key={i} x={pts[i].x} y={H - 4} textAnchor="middle" fontSize="9" fill="#475569">
          {data[i].fecha.slice(5)}
        </text>
      ))}
    </svg>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color = '#6366f1' }) {
  return (
    <div className="mon-kpi" style={{ '--kpi-color': color }}>
      <div className="mon-kpi-value">{value}</div>
      <div className="mon-kpi-label">{label}</div>
      {sub && <div className="mon-kpi-sub">{sub}</div>}
    </div>
  )
}

// ── Top Stat ──────────────────────────────────────────────────────────────────
function TopStat({ title, items }) {
  const max = items[0]?.count || 1
  return (
    <div className="mon-top-card">
      <div className="mon-top-title">{title}</div>
      {items.length === 0
        ? <div className="mon-top-empty">Sin datos</div>
        : items.map(({ name, count, pct }) => (
          <div key={name} className="mon-top-row">
            <div className="mon-top-name" title={name}>{name}</div>
            <div className="mon-top-bar-wrap">
              <div className="mon-top-bar" style={{ width: `${(count / max) * 100}%` }} />
            </div>
            <div className="mon-top-count">{Math.round(pct * 100)}%</div>
          </div>
        ))
      }
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
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

// ── Panel por web ─────────────────────────────────────────────────────────────
function WebPanel({ tab }) {
  const { data, loading, error, reload } = useMonitoreo(tab)

  const chart30 = useMemo(() => data.slice(-30), [data])

  const kpis = useMemo(() => {
    if (!data.length) return null
    const n        = data.length
    const sesiones = data.reduce((s, r) => s + r.sesiones,  0)
    const usuarios = data.reduce((s, r) => s + r.usuarios,  0)
    const pviews   = data.reduce((s, r) => s + r.page_views, 0)
    const duracion = data.reduce((s, r) => s + r.duracion_seg, 0) / n
    const rebote   = data.reduce((s, r) => s + r.tasa_rebote,  0) / n
    return { sesiones, usuarios, pviews, duracion, rebote, dias: n }
  }, [data])

  const tops = useMemo(() => ({
    paginas:     topFrequency(data, 'pagina_top'),
    canales:     topFrequency(data, 'canal_top'),
    dispositivos:topFrequency(data, 'dispositivo_top'),
    paises:      topFrequency(data, 'pais_top'),
  }), [data])

  const recent = useMemo(() => [...data].reverse().slice(0, 15), [data])

  if (loading) return <Skeleton />
  if (error)   return (
    <div className="links-error">
      <span>⚠️</span>
      <span>{error} — <button onClick={reload} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', textDecoration: 'underline' }}>reintentar</button></span>
    </div>
  )
  if (!data.length) return (
    <div className="links-error" style={{ background: 'rgba(99,102,241,.08)', borderColor: '#6366f1' }}>
      <span>📊</span>
      <span>Sin datos aún. El cron sincroniza automáticamente cada noche.</span>
    </div>
  )

  return (
    <>
      {/* KPIs */}
      <div className="mon-kpis">
        <KpiCard label="Sesiones"     value={kpis.sesiones.toLocaleString()}  color="#6366f1" />
        <KpiCard label="Usuarios"     value={kpis.usuarios.toLocaleString()}  color="#10b981" />
        <KpiCard label="Page Views"   value={kpis.pviews.toLocaleString()}    color="#8b5cf6" />
        <KpiCard label="Duración prom" value={fmtDuration(kpis.duracion)}     color="#f59e0b" sub="min:seg" />
        <KpiCard label="Rebote prom"  value={`${(kpis.rebote * 100).toFixed(1)}%`} color="#ef4444" />
        <KpiCard label="Días"         value={kpis.dias}                       color="#64748b" sub="registrados" />
      </div>

      {/* Chart */}
      <div className="mon-section">
        <div className="mon-section-title">
          Sesiones diarias
          <span className="mon-section-sub">últimos {chart30.length} días</span>
        </div>
        <div className="mon-chart-wrap">
          <LineChart data={chart30} color="#6366f1" />
        </div>
      </div>

      {/* Top stats */}
      <div className="mon-section">
        <div className="mon-section-title">Distribución histórica</div>
        <div className="mon-tops">
          <TopStat title="Páginas más visitadas"  items={tops.paginas}      />
          <TopStat title="Canal de adquisición"   items={tops.canales}      />
          <TopStat title="Dispositivos"           items={tops.dispositivos} />
          <TopStat title="Países"                 items={tops.paises}       />
        </div>
      </div>

      {/* Recent table */}
      <div className="mon-section">
        <div className="mon-section-title">
          Registros recientes
          <span className="mon-section-sub">últimos {recent.length}</span>
        </div>
        <div className="mon-table-wrap">
          <table className="mon-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Sesiones</th>
                <th>Usuarios</th>
                <th>Page Views</th>
                <th>Duración</th>
                <th>Rebote</th>
                <th>Página top</th>
                <th>Canal</th>
                <th>Dispositivo</th>
                <th>País</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(r => (
                <tr key={r.fecha}>
                  <td>{r.fecha}</td>
                  <td>{r.sesiones}</td>
                  <td>{r.usuarios}</td>
                  <td>{r.page_views}</td>
                  <td>{fmtDuration(r.duracion_seg)}</td>
                  <td>{(r.tasa_rebote * 100).toFixed(1)}%</td>
                  <td className="mon-td-page">{r.pagina_top}</td>
                  <td>{r.canal_top}</td>
                  <td>{r.dispositivo_top}</td>
                  <td>{r.pais_top}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
const WEBS = [
  { label: 'SalasCorp Web',          tab: 'analytics_salascorp'            },
  { label: 'Monitoreo Financiero',   tab: 'analytics_monitoreo_financiero' },
]

export default function Monitoreo() {
  const [activeIdx, setActiveIdx] = useState(0)
  const active = WEBS[activeIdx]

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
          <h1 className="links-title">Monitoreo Web</h1>
          <p className="links-subtitle">Analítica de tráfico — datos sincronizados desde Google Analytics</p>
        </div>
      </div>

      {/* Selector de web */}
      <div className="mon-tabs">
        {WEBS.map((w, i) => (
          <button
            key={w.tab}
            className={`mon-tab${activeIdx === i ? ' active' : ''}`}
            onClick={() => setActiveIdx(i)}
          >
            <span className="mon-tab-dot" />
            {w.label}
          </button>
        ))}
      </div>

      <WebPanel key={active.tab} tab={active.tab} />
    </div>
  )
}
