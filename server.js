import 'dotenv/config'
import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import { google } from 'googleapis'
import cron from 'node-cron'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

const app  = express()
const PORT = process.env.PORT || 3001

// ── Configuración auth ──────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const JWT_SECRET       = process.env.JWT_SECRET || 'dev_secret_change_in_production'
const USUARIOS_ADMIN   = (process.env.USUARIOS_ADMIN || '')
  .split(',').map(e => e.trim()).filter(Boolean)

const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID)

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(express.json())

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  next()
})

// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`)
    }
    next()
  })
}

// ── Google Sheets — Links ───────────────────────────────────────────────────
const SHEET_ID = process.env.GSHEETS_LINKS_ID || ''
const SA_B64   = process.env.GOOGLE_SERVICE_ACCOUNT_B64 || ''

const AUTO_COLORS = ['#2a9d8f','#e63946','#f0b90b','#1a56db','#7c3aed','#e76f51','#457b9d','#0077b5']

let linksCache    = null
let linksCacheTs  = 0
const CACHE_TTL   = 5 * 60 * 1000 // 5 minutos

async function getLinksFromSheet() {
  if (linksCache && Date.now() - linksCacheTs < CACHE_TTL) return linksCache

  if (!SHEET_ID || !SA_B64) return []

  const credentials = JSON.parse(Buffer.from(SA_B64, 'base64').toString())
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
  const sheets = google.sheets({ version: 'v4', auth })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'links!A2:F1000',
  })

  const rows = res.data.values || []
  linksCache = rows
    .filter(r => r[1] && r[3]) // requiere nombre y url
    .map((r, i) => ({
      id:          i + 1,
      category:    r[0]?.trim() || 'General',
      name:        r[1]?.trim() || '',
      description: r[2]?.trim() || '',
      url:         r[3]?.trim() || '',
      initials:    r[4]?.trim() || r[1]?.trim().substring(0, 2).toUpperCase() || 'XX',
      color:       r[5]?.trim() || AUTO_COLORS[i % AUTO_COLORS.length],
    }))

  linksCacheTs = Date.now()
  return linksCache
}

app.get('/api/links', async (_req, res) => {
  try {
    const links = await getLinksFromSheet()
    res.json(links)
  } catch (e) {
    console.error('Sheets error:', e.message)
    res.status(500).json({ error: 'No se pudo cargar el sheet' })
  }
})

// ── Google Sheets — Tareas ──────────────────────────────────────────────────
let tareasCache   = null
let tareasCacheTs = 0

async function getTareasFromSheet() {
  if (tareasCache && Date.now() - tareasCacheTs < CACHE_TTL) return tareasCache

  if (!SHEET_ID || !SA_B64) return []

  const credentials = JSON.parse(Buffer.from(SA_B64, 'base64').toString())
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
  const sheets = google.sheets({ version: 'v4', auth })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'tareas!A2:F1000',
  })

  const rows = res.data.values || []
  tareasCache = rows
    .filter(r => r[0]) // requiere nombre
    .map((r, i) => ({
      id:           i + 1,
      nombre:       r[0]?.trim() || '',
      grupo:        r[1]?.trim() || 'General',
      subgrupo:     r[2]?.trim() || '',
      fecha_inicio: r[3]?.trim() || '',
      fecha_fin:    r[4]?.trim() || '',
      urgencia:     r[5]?.trim().toLowerCase() || 'media',
    }))

  tareasCacheTs = Date.now()
  return tareasCache
}

app.get('/api/tasks', async (_req, res) => {
  try {
    const tasks = await getTareasFromSheet()
    res.json(tasks)
  } catch (e) {
    console.error('Sheets tasks error:', e.message)
    res.status(500).json({ error: 'No se pudo cargar las tareas' })
  }
})

// ── Google Sheets — Entendimiento ──────────────────────────────────────────
let entCache   = null
let entCacheTs = 0

async function getEntendimientoFromSheet() {
  if (entCache && Date.now() - entCacheTs < CACHE_TTL) return entCache

  if (!SHEET_ID || !SA_B64) return []

  const credentials = JSON.parse(Buffer.from(SA_B64, 'base64').toString())
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
  const sheets = google.sheets({ version: 'v4', auth })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'entendimiento!A2:D1000',
  })

  const rows = res.data.values || []
  entCache = rows
    .filter(r => r[1] && String(r[3] ?? '1').trim() === '1') // requiere nombre y visualizar=1
    .map((r, i) => ({
      id:          i + 1,
      grupo:       r[0]?.trim() || 'General',
      nombre:      r[1]?.trim() || '',
      descripcion: r[2]?.trim() || '',
      visualizar:  String(r[3] ?? '1').trim(),
    }))

  entCacheTs = Date.now()
  return entCache
}

app.get('/api/entendimiento', async (_req, res) => {
  try {
    const items = await getEntendimientoFromSheet()
    res.json(items)
  } catch (e) {
    console.error('Sheets entendimiento error:', e.message)
    res.status(500).json({ error: 'No se pudo cargar entendimiento' })
  }
})

// ── Google Drive — proxy de imágenes privadas ───────────────────────────────
function getGoogleAuth() {
  const credentials = JSON.parse(Buffer.from(SA_B64, 'base64').toString())
  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
  })
}

app.get('/api/images/:fileId', async (req, res) => {
  if (!SA_B64) return res.status(503).json({ error: 'Sin credenciales' })
  try {
    const auth   = getGoogleAuth()
    const drive  = google.drive({ version: 'v3', auth })
    const meta   = await drive.files.get({ fileId: req.params.fileId, fields: 'mimeType,name' })
    const stream = await drive.files.get(
      { fileId: req.params.fileId, alt: 'media' },
      { responseType: 'stream' }
    )
    res.setHeader('Content-Type', meta.data.mimeType || 'image/jpeg')
    res.setHeader('Cache-Control', 'private, max-age=3600')
    stream.data.pipe(res)
  } catch (e) {
    console.error('Drive proxy error:', e.message)
    res.status(404).json({ error: 'Imagen no encontrada' })
  }
})

// ── Google Sheets — Imágenes ────────────────────────────────────────────────
let imagenesCache   = null
let imagenesCacheTs = 0

async function getImagenesFromSheet() {
  if (imagenesCache && Date.now() - imagenesCacheTs < CACHE_TTL) return imagenesCache

  if (!SHEET_ID || !SA_B64) return []

  const auth   = getGoogleAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const res    = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'imagenes!A2:E1000',
  })

  // Extrae el file ID de una URL de Drive o devuelve el valor tal cual
  const extractFileId = (val = '') => {
    const m = val.match(/\/d\/([a-zA-Z0-9_-]+)/)
    return m ? m[1] : val.trim()
  }

  const rows = res.data.values || []
  imagenesCache = rows
    .filter(r => r[1] && r[3] && String(r[4] ?? '1').trim() !== '0')
    .map((r, i) => ({
      id:          i + 1,
      categoria:   r[0]?.trim() || 'General',
      nombre:      r[1]?.trim() || '',
      descripcion: r[2]?.trim() || '',
      fileId:      extractFileId(r[3]),
      visualizar:  String(r[4] ?? '1').trim(),
    }))

  imagenesCacheTs = Date.now()
  return imagenesCache
}

app.get('/api/imagenes', async (_req, res) => {
  try {
    res.json(await getImagenesFromSheet())
  } catch (e) {
    console.error('Sheets imagenes error:', e.message)
    res.status(500).json({ error: 'No se pudo cargar imágenes' })
  }
})

// ── Google Analytics — Sync a Sheets ───────────────────────────────────────
const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID || '534540730'
const ANALYTICS_HEADERS = [
  'fecha', 'sesiones', 'usuarios', 'nuevos_usuarios',
  'page_views', 'duracion_seg', 'tasa_rebote',
  'pagina_top', 'canal_top', 'dispositivo_top', 'pais_top',
]

function getAnalyticsAuth() {
  const credentials = JSON.parse(Buffer.from(SA_B64, 'base64').toString())
  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  })
}

async function runGA4Report(analyticsdata, dateStr, dimensions, metrics, orderMetric) {
  const req = {
    property: `properties/${GA4_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: dateStr, endDate: dateStr }],
      metrics: metrics.map(name => ({ name })),
    },
  }
  if (dimensions) {
    req.requestBody.dimensions = dimensions.map(name => ({ name }))
    req.requestBody.orderBys   = [{ metric: { metricName: orderMetric }, desc: true }]
    req.requestBody.limit      = 1
  }
  const r = await analyticsdata.properties.runReport(req)
  return r.data.rows || []
}

async function syncAnalyticsToSheet() {
  if (!SHEET_ID || !SA_B64) return { error: 'Sin credenciales' }

  const auth          = getAnalyticsAuth()
  const analyticsdata = google.analyticsdata({ version: 'v1beta', auth })
  const sheets        = google.sheets({ version: 'v4', auth })

  // Fecha de ayer
  const d = new Date()
  d.setDate(d.getDate() - 1)
  const dateStr = d.toISOString().split('T')[0]

  // Verificar si la fecha ya existe para no duplicar
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'analytics!A:A',
  })
  const existingDates = (existing.data.values || []).map(r => r[0])
  if (existingDates.includes(dateStr)) {
    return { skipped: true, date: dateStr, message: 'Fecha ya registrada' }
  }

  // Query 1: métricas globales del día
  const mainRows = await runGA4Report(analyticsdata, dateStr, null, [
    'sessions', 'activeUsers', 'newUsers',
    'screenPageViews', 'averageSessionDuration', 'bounceRate',
  ])
  const mv        = mainRows[0]?.metricValues || []
  const sessions  = mv[0]?.value  || '0'
  const users     = mv[1]?.value  || '0'
  const newUsers  = mv[2]?.value  || '0'
  const pageViews = mv[3]?.value  || '0'
  const duration  = parseFloat(mv[4]?.value || '0').toFixed(1)
  const bounce    = parseFloat(mv[5]?.value || '0').toFixed(4)

  // Queries de top dimensiones
  const topPageRows    = await runGA4Report(analyticsdata, dateStr, ['pagePath'],                    ['screenPageViews'],        'screenPageViews')
  const topChannelRows = await runGA4Report(analyticsdata, dateStr, ['sessionDefaultChannelGroup'],  ['sessions'],               'sessions')
  const topDeviceRows  = await runGA4Report(analyticsdata, dateStr, ['deviceCategory'],              ['sessions'],               'sessions')
  const topCountryRows = await runGA4Report(analyticsdata, dateStr, ['country'],                     ['sessions'],               'sessions')

  const topPage    = topPageRows[0]?.dimensionValues?.[0]?.value    || '(ninguna)'
  const topChannel = topChannelRows[0]?.dimensionValues?.[0]?.value || '(ninguno)'
  const topDevice  = topDeviceRows[0]?.dimensionValues?.[0]?.value  || '(ninguno)'
  const topCountry = topCountryRows[0]?.dimensionValues?.[0]?.value || '(ninguno)'

  // Crear encabezados si la pestaña está vacía
  if (!existingDates.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: 'analytics!A1:K1',
      valueInputOption: 'RAW',
      requestBody: { values: [ANALYTICS_HEADERS] },
    })
  }

  // Agregar fila con los datos del día
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'analytics!A:K',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[
        dateStr, sessions, users, newUsers,
        pageViews, duration, bounce,
        topPage, topChannel, topDevice, topCountry,
      ]],
    },
  })

  console.log(`Analytics sync OK — ${dateStr}: ${sessions} sesiones, ${pageViews} page views`)
  return { success: true, date: dateStr, sessions, users: users, pageViews }
}

// Endpoint manual (solo admin)
app.post('/api/analytics/sync', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No autorizado' })
  try { jwt.verify(token, JWT_SECRET) } catch { return res.status(401).json({ error: 'Token inválido' }) }

  try {
    const result = await syncAnalyticsToSheet()
    res.json(result)
  } catch (e) {
    console.error('Analytics sync error:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// Leer historial del sheet (solo admin)
app.get('/api/analytics', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No autorizado' })
  try { jwt.verify(token, JWT_SECRET) } catch { return res.status(401).json({ error: 'Token inválido' }) }

  try {
    const auth   = getAnalyticsAuth()
    const sheets = google.sheets({ version: 'v4', auth })
    const r      = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'analytics!A2:K1000',
    })
    const rows = (r.data.values || []).map(row => ({
      fecha:          row[0]  || '',
      sesiones:       Number(row[1]  || 0),
      usuarios:       Number(row[2]  || 0),
      nuevos_usuarios:Number(row[3]  || 0),
      page_views:     Number(row[4]  || 0),
      duracion_seg:   parseFloat(row[5] || 0),
      tasa_rebote:    parseFloat(row[6] || 0),
      pagina_top:     row[7]  || '',
      canal_top:      row[8]  || '',
      dispositivo_top:row[9]  || '',
      pais_top:       row[10] || '',
    }))
    res.json(rows)
  } catch (e) {
    console.error('Analytics read error:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// Cron diario a las 6am UTC (1am hora Colombia)
cron.schedule('0 6 * * *', async () => {
  console.log('Cron: iniciando sync de analytics...')
  try {
    const result = await syncAnalyticsToSheet()
    console.log('Cron analytics result:', result)
  } catch (e) {
    console.error('Cron analytics error:', e.message)
  }
})

// ── Auth endpoint ───────────────────────────────────────────────────────────
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body
  if (!credential) return res.status(400).json({ error: 'Token requerido' })

  try {
    const ticket = await oauthClient.verifyIdToken({
      idToken:  credential,
      audience: GOOGLE_CLIENT_ID,
    })
    const info  = ticket.getPayload()
    const email = info.email

    let role = null
    if (USUARIOS_ADMIN.includes(email)) role = 'admin'

    if (!role) return res.status(403).json({ error: 'Correo no autorizado' })

    const payload = {
      email,
      role,
      name:    info.name,
      picture: info.picture,
    }

    // JWT propio — válido 12 horas
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' })

    return res.json({ token, role, name: info.name, email, picture: info.picture })
  } catch {
    return res.status(401).json({ error: 'Token de Google inválido' })
  }
})

// ── Archivos estáticos (producción) ────────────────────────────────────────
app.use(express.static(join(__dirname, 'dist')))

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
