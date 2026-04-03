import 'dotenv/config'
import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'

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
