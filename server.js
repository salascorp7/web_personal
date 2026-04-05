import 'dotenv/config'
import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import { google } from 'googleapis'

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
