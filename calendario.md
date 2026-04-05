# Calendario de Pagos — Documentación de Implementación

Referencia técnica del componente `CalendarView.jsx` para replicar en otros proyectos.

---

## ¿Qué hace este calendario?

Muestra un calendario mensual con eventos agrupados por día. Cada día con pagos
pendientes muestra indicadores de color según el estado. Al hacer clic en un día
se abre un panel lateral (desktop) o bottom sheet (móvil) con el detalle.

**Características:**
- Navegación entre meses
- Indicadores de color por estado (vencido / próximo / normal)
- Stats del mes en la barra superior
- Panel de detalle lateral en desktop
- Bottom sheet en móvil
- Totales monetarios por día y por mes
- Completamente responsivo con Tailwind CSS
- Sin librerías externas de calendario — construido desde cero

---

## Stack requerido

```
React + Vite
Tailwind CSS
```

Sin dependencias adicionales. Solo `useState` y `useMemo` de React.

---

## Estructura del componente

```
CalendarView
├── Top bar
│   ├── Navegación de mes (← Mes Año →)
│   ├── Stats del mes (pagos, monto, vencidos, próximos)
│   └── Leyenda de colores (solo desktop)
├── Área principal
│   ├── Grid del calendario (7 columnas)
│   │   ├── Encabezado días de semana
│   │   └── Celdas de días (con puntos o badges según breakpoint)
│   └── Panel de detalle lateral (solo sm+)
└── Bottom sheet móvil (cuando hay día seleccionado)
```

---

## Props del componente

```jsx
<CalendarView
  rows={data?.tabla}   // Array de objetos con los eventos
  loading={loading}    // Boolean — reservado para skeleton si se agrega
/>
```

### Estructura de cada `row` (evento)

El componente espera estos campos en cada objeto del array `rows`:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `proximo_pago` | string | Fecha en formato `dd/mm/yyyy` |
| `estado_credito` | string | Solo muestra créditos `'pendiente'` |
| `estado_vencimiento` | string | `'Vencidos'`, `'Próximos a vencer'` o cualquier otro |
| `nombre` | string | Nombre del cliente |
| `valor_cuota` | string | Monto formateado (`'$50,000'`) |
| `dias_vencidos` | number | Días hasta el pago (negativo = vencido) |

> **Para adaptar a otro dominio:** cambia el filtro `r.estado_credito === 'pendiente'`
> por el campo que corresponda en tus datos, y ajusta los nombres de campos.

---

## Funciones auxiliares

### `parseDate(str)`
Convierte fecha `dd/mm/yyyy` a objeto `Date`.
```js
function parseDate(str) {
  if (!str) return null
  const [d, m, y] = str.split('/')
  return new Date(+y, +m - 1, +d)
}
```

> Si tu backend entrega fechas en otro formato (ISO, `yyyy-mm-dd`), cambia esta función.
> Para ISO: `return new Date(str)`
> Para `yyyy-mm-dd`: `const [y,m,d] = str.split('-'); return new Date(+y, +m-1, +d)`

### `statusStyle(estado)`
Devuelve un objeto con clases Tailwind según el estado del evento.
```js
function statusStyle(estado) {
  if (estado === 'Vencidos')          return { bg: 'bg-red-500',    light: 'bg-red-50', ... }
  if (estado === 'Próximos a vencer') return { bg: 'bg-amber-400',  light: 'bg-amber-50', ... }
  return                                     { bg: 'bg-emerald-500', light: 'bg-emerald-50', ... }
}
```

> Para adaptar: cambia los valores de `estado` y los colores Tailwind a los que necesites.

### `parseMoney(v)` y `fmtMoney(n)`
Convierte strings monetarios a número y viceversa.
```js
function parseMoney(v) { return parseFloat(String(v || '').replace(/[$,]/g, '')) || 0 }
function fmtMoney(n)   { return '$' + Math.round(n).toLocaleString('es-CO') }
```

> Si no necesitas montos, omite estas funciones y quita los cálculos de `daySum` y `selectedSum`.

---

## Estado del componente

```js
const [viewYear,  setViewYear]  = useState(today.getFullYear())  // Año visible
const [viewMonth, setViewMonth] = useState(today.getMonth())     // Mes visible (0-11)
const [selected,  setSelected]  = useState(null)                 // Día seleccionado (1-31 o null)
```

---

## Lógica clave — useMemo

### 1. `paymentsByDay` — Agrupa eventos por día del mes visible

```js
const paymentsByDay = useMemo(() => {
  const map = {}
  ;(rows || []).filter(r => r.estado_credito === 'pendiente').forEach(r => {
    const d = parseDate(r.proximo_pago)
    // Solo incluir eventos del mes/año actualmente visible
    if (!d || d.getFullYear() !== viewYear || d.getMonth() !== viewMonth) return
    const key = d.getDate()
    if (!map[key]) map[key] = []
    map[key].push(r)
  })
  return map
}, [rows, viewYear, viewMonth])
// Resultado: { 5: [row, row], 12: [row], 20: [row, row, row], ... }
```

### 2. `cells` — Genera las celdas del grid incluyendo días del mes anterior/siguiente

```js
const cells = useMemo(() => {
  const firstDay    = new Date(viewYear, viewMonth, 1)
  const startOffset = (firstDay.getDay() + 6) % 7   // Convierte domingo=0 a lunes=0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const daysPrevMonth = new Date(viewYear, viewMonth, 0).getDate()
  const total = Math.ceil((startOffset + daysInMonth) / 7) * 7  // Siempre múltiplo de 7
  return Array.from({ length: total }, (_, i) => {
    const day = i - startOffset + 1
    if (day >= 1 && day <= daysInMonth) return { day, current: true }
    if (day < 1) return { day: daysPrevMonth + day, current: false }
    return { day: day - daysInMonth, current: false }
  })
}, [viewYear, viewMonth])
// current: true = día del mes visible, false = día de mes adyacente (atenuado)
```

> **Clave del offset:** `(firstDay.getDay() + 6) % 7` convierte el sistema de
> JavaScript (semana inicia domingo=0) al europeo (semana inicia lunes=0).
> Si quieres semana iniciando en domingo, usa `firstDay.getDay()` directamente.

### 3. `monthStats` — Estadísticas del mes visible

```js
const monthStats = useMemo(() => {
  const all      = Object.values(paymentsByDay).flat()
  const sum      = all.reduce((acc, r) => acc + parseMoney(r.valor_cuota), 0)
  const vencidos = all.filter(r => r.estado_vencimiento === 'Vencidos').length
  const proximos = all.filter(r => r.estado_vencimiento === 'Próximos a vencer').length
  return { total: all.length, sum, vencidos, proximos }
}, [paymentsByDay])
```

---

## Navegación entre meses

```js
function prevMonth() {
  if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
  else setViewMonth(m => m - 1)
  setSelected(null)  // Limpiar selección al cambiar mes
}
function nextMonth() {
  if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
  else setViewMonth(m => m + 1)
  setSelected(null)
}
```

---

## Grid del calendario — detalles de layout

```jsx
{/* Grid de 7 columnas con filas de altura proporcional */}
<div
  className="flex-1 grid grid-cols-7 min-h-0"
  style={{ gridTemplateRows: `repeat(${weeks}, 1fr)` }}
>
```

- `weeks = Math.ceil(cells.length / 7)` — número de filas (4, 5 o 6 según el mes)
- `gridTemplateRows: repeat(N, 1fr)` — todas las filas con la misma altura
- `flex-1 min-h-0` — el grid ocupa el espacio restante del contenedor flex

### Lógica de cada celda

```js
const payments   = current ? (paymentsByDay[day] || []) : []
const isToday    = current && today.getDate() === day &&
                   today.getMonth() === viewMonth &&
                   today.getFullYear() === viewYear
const isSelected = current && day === selected
const isWeekend  = i % 7 >= 5   // índice 5=Sáb, 6=Dom en semana Lun-Dom
const venc   = payments.filter(r => r.estado_vencimiento === 'Vencidos').length
const prox   = payments.filter(r => r.estado_vencimiento === 'Próximos a vencer').length
const normal = payments.length - venc - prox
```

### Indicadores responsivos

```jsx
{/* Móvil: puntos de colores (w-1.5 h-1.5) */}
<div className="flex gap-0.5 flex-wrap sm:hidden">
  {Array.from({ length: Math.min(venc, 3) }).map((_, j) =>
    <span key={j} className="w-1.5 h-1.5 rounded-full bg-red-500" />
  )}
</div>

{/* Desktop: badges con texto */}
<div className="hidden sm:flex flex-col gap-0.5">
  {venc > 0 && (
    <div className="flex items-center gap-0.5 bg-red-50 rounded px-1 py-0.5">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      <span className="text-[8px] font-semibold text-red-600">{venc} venc.</span>
    </div>
  )}
</div>
```

---

## Panel de detalle

### Desktop — panel lateral fijo (w-64)

```jsx
<div className="hidden sm:flex bg-white rounded-2xl border ... w-64 flex-col">
  {/* Header cambia de color al seleccionar un día */}
  <div className={selected ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-slate-50'}>
    ...
  </div>
  {/* Lista de eventos del día */}
  <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
    {selectedPayments.map((r, i) => { ... })}
  </div>
  {/* Total del día */}
  {selectedPayments.length > 0 && (
    <div className="border-t px-4 py-2.5 bg-slate-50 flex items-center justify-between">
      <span>Total del día</span>
      <span>{fmtMoney(selectedSum)}</span>
    </div>
  )}
</div>
```

### Móvil — bottom sheet

```jsx
{selected && (
  <div className="sm:hidden fixed inset-0 z-40 flex flex-col justify-end">
    {/* Overlay oscuro */}
    <div className="absolute inset-0 bg-black/30" onClick={() => setSelected(null)} />
    {/* Sheet deslizable desde abajo */}
    <div className="relative bg-white rounded-t-2xl shadow-2xl flex flex-col max-h-[65vh]">
      ...
    </div>
  </div>
)}
```

> **Patrón bottom sheet:** `fixed inset-0` + `flex flex-col justify-end` centra el
> sheet al fondo de la pantalla. `max-h-[65vh]` evita que tape toda la pantalla.
> El overlay cierra el sheet al hacer clic fuera.

---

## Integración en App.jsx

```jsx
// El calendario necesita toda la pantalla disponible (overflow hidden)
<main className={`flex-1 min-h-0
  ${activeSection === 'calendario' ? 'overflow-hidden p-4' : 'overflow-y-auto p-5 space-y-6'}
`}>
  {activeSection === 'calendario' && (
    <CalendarView rows={data?.tabla} loading={loading} />
  )}
</main>
```

> **Importante:** usar `overflow-hidden` (no `overflow-y-auto`) en el contenedor
> padre del calendario. El componente maneja su propio scroll internamente.
> Si usas `overflow-y-auto`, el grid no respeta el alto disponible y se desborda.

---

## Checklist para replicar en otro proyecto

- [ ] Copiar el archivo `CalendarView.jsx` completo
- [ ] Adaptar `parseDate()` al formato de fecha de tu backend
- [ ] Cambiar el filtro `r.estado_credito === 'pendiente'` al campo correcto
- [ ] Adaptar los nombres de campos (`proximo_pago`, `nombre`, `valor_cuota`, etc.)
- [ ] Adaptar `statusStyle()` a los estados de tu dominio
- [ ] Si no hay montos: quitar `parseMoney`, `fmtMoney`, `daySum`, `selectedSum`
- [ ] En el contenedor padre usar `overflow-hidden` no `overflow-y-auto`
- [ ] Verificar que Tailwind tenga acceso al archivo para purgar clases correctamente

---

## Colores usados (Tailwind)

| Estado | Punto | Fondo celda | Borde | Texto | Badge |
|--------|-------|-------------|-------|-------|-------|
| Vencido | `bg-red-500` | `bg-red-50` | `border-red-200` | `text-red-600` | `bg-red-100 text-red-700` |
| Próximo | `bg-amber-400` | `bg-amber-50` | `border-amber-200` | `text-amber-600` | `bg-amber-100 text-amber-700` |
| Normal | `bg-emerald-500` | `bg-emerald-50` | `border-emerald-200` | `text-emerald-600` | `bg-emerald-100 text-emerald-700` |
| Hoy | `bg-blue-600 text-white` (número del día) | — | — | — | — |
| Seleccionado | `ring-2 ring-blue-300 bg-blue-50` | — | — | — | — |
