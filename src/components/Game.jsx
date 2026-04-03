import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

export default function Game() {
  const canvasRef = useRef(null)
  const hudRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const hud = hudRef.current
    if (!canvas || !hud) return

    const ctx = canvas.getContext('2d')

    // ---- Player ----
    const player = { w: 48, h: 64, x: 100, y: 0, vy: 0, onGround: false }
    const gravity = 0.55
    const jumpForce = -11.5
    const baseSpeed = 3.2
    const keys = {}

    // ---- Obstacles ----
    const obstacles = []
    let spawnTimer = 0
    let score = 0

    // ---- Progression ----
    let stage = 0
    let phase = 'play' // 'play' | 'toHouse' | 'celebrate'
    let house = null
    let autoForward = false
    let celebrateTimer = 0
    let reachedHouse = false
    let tailsBadgeTimer = 0

    // ---- Tails SVG ----
    const tailsSVG = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='180' viewBox='0 0 240 180'><rect width='100%' height='100%' rx='16' ry='16' fill='#1e293b'/><g transform='translate(20,20)'><circle cx='60' cy='60' r='34' fill='#f59e0b'/><ellipse cx='52' cy='62' rx='10' ry='12' fill='#fff'/><ellipse cx='70' cy='62' rx='10' ry='12' fill='#fff'/><circle cx='52' cy='64' r='3' fill='#0f172a'/><circle cx='70' cy='64' r='3' fill='#0f172a'/><path d='M45 78 Q60 90 75 78' fill='none' stroke='#0f172a' stroke-width='3' stroke-linecap='round'/><path d='M42 36 L52 18 L60 40 Z' fill='#f59e0b'/><path d='M78 36 L70 18 L60 40 Z' fill='#f59e0b'/><path d='M90 78 C130 70 150 100 150 120 C120 118 100 100 90 78 Z' fill='#fbbf24'/><path d='M84 84 C124 86 146 116 146 136 C116 130 96 108 84 84 Z' fill='#f59e0b'/></g><text x='120' y='168' text-anchor='middle' font-family='system-ui,Arial' font-size='16' fill='#fde68a'>¡Hola, soy Colitas!</text></svg>`
    const tailsImg = new Image()
    tailsImg.src = 'data:image/svg+xml;base64,' + btoa(tailsSVG)

    // ---- Controls ----
    const handleKeyDown = e => {
      keys[e.code] = true
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) e.preventDefault()
    }
    const handleKeyUp = e => { keys[e.code] = false }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    function jump() {
      if (player.onGround) { player.vy = jumpForce; player.onGround = false }
    }

    function spawnObstacle() {
      const h = 42, w = 28
      obstacles.push({ x: canvas.width + 20, y: canvas.height - 60 - h, w, h, passed: false })
    }

    function rectsOverlap(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
    }

    function softReset() {
      player.x = 100; player.y = canvas.height - 60 - player.h
      player.vy = 0; player.onGround = true
      obstacles.length = 0; spawnTimer = 0
    }

    function resetWorld(resetScore = true) {
      softReset()
      if (resetScore) score = 0
    }

    function createHouse() {
      return { x: canvas.width + 60, y: canvas.height - 60 - 150, w: 180, h: 150 }
    }

    function getVar(name) {
      return getComputedStyle(document.documentElement).getPropertyValue(name)
    }

    function update() {
      if (phase === 'celebrate') {
        celebrateTimer -= 1 / 60
        if (celebrateTimer <= 0) {
          stage = 1; phase = 'play'; reachedHouse = true
          house = null; tailsBadgeTimer = 5
          resetWorld(false)
        }
        return
      }

      const forwardInput = (keys['ArrowRight'] || keys['KeyD']) ? 2.2 : 0
      const backwardInput = (keys['ArrowLeft'] || keys['KeyA']) ? -2.0 : 0
      const forward = autoForward ? 2.2 : forwardInput
      const backward = autoForward ? 0 : backwardInput

      player.x += forward + backward
      player.x = Math.max(20, Math.min(player.x, canvas.width - 60))

      player.vy += gravity
      player.y += player.vy

      const floorY = canvas.height - 60 - player.h
      if (player.y >= floorY) { player.y = floorY; player.vy = 0; player.onGround = true }
      else { player.onGround = false }

      if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && player.onGround) jump()

      const worldSpeed = baseSpeed + forward * 0.8

      if (phase === 'play') {
        spawnTimer -= 1 / 60
        if (spawnTimer <= 0) { spawnObstacle(); spawnTimer = 1.5 + Math.random() }
      }

      for (const o of obstacles) { o.x -= worldSpeed }

      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i]
        if (!o.passed && o.x + o.w < player.x) { o.passed = true; score += 10 }
        if (o.x + o.w < -40) obstacles.splice(i, 1)
      }

      if (phase === 'play') {
        for (const o of obstacles) { if (rectsOverlap(player, o)) { softReset(); break } }
      }

      if (score >= 50 && phase === 'play' && !reachedHouse) {
        phase = 'toHouse'; autoForward = true
        obstacles.length = 0; house = createHouse()
      }

      if (phase === 'toHouse' && house) {
        const worldPush = worldSpeed * 0.5
        house.x -= worldPush
        if (house.x < canvas.width - 260) house.x = canvas.width - 260

        const doorRect = { x: house.x + 120, y: house.y + house.h - 90, w: 40, h: 60 }
        if (rectsOverlap(player, doorRect)) {
          phase = 'celebrate'; autoForward = false; celebrateTimer = 2.5
        }
      }

      if (tailsBadgeTimer > 0) tailsBadgeTimer -= 1 / 60
    }

    function drawBackground() {
      if (stage === 0) {
        const sky = ctx.createLinearGradient(0, 0, 0, canvas.height)
        sky.addColorStop(0, '#6fd5ff')
        sky.addColorStop(0.7, '#87ceeb')
        sky.addColorStop(0.7, '#3bbf3b')
        ctx.fillStyle = sky; ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#8b4513'
        ctx.fillRect(0, canvas.height - 20, canvas.width, 20)
        ctx.fillStyle = '#228B22'
        for (let i = 0; i < canvas.width / 80 + 2; i++) {
          ctx.beginPath()
          ctx.arc((i * 80) + 40, canvas.height - 60, 50, Math.PI, 0)
          ctx.fill()
        }
      } else {
        const sky = ctx.createLinearGradient(0, 0, 0, canvas.height)
        sky.addColorStop(0, '#ffedd5')
        sky.addColorStop(0.6, '#fca5a5')
        sky.addColorStop(0.6, '#60a5fa')
        ctx.fillStyle = sky; ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#f4d28a'
        ctx.fillRect(0, canvas.height - 70, canvas.width, 70)
        ctx.globalAlpha = 0.3
        for (let i = 0; i < 3; i++) {
          ctx.beginPath()
          ctx.moveTo(0, canvas.height - 100 - i * 14)
          for (let x = 0; x <= canvas.width; x += 20) {
            ctx.lineTo(x, canvas.height - 102 - i * 14 + Math.sin((x + i * 20) / 30) * 4)
          }
          ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.stroke()
        }
        ctx.globalAlpha = 1
      }
    }

    function drawPlayer() {
      ctx.fillStyle = '#0055ff'
      ctx.beginPath()
      ctx.arc(player.x + player.w / 2, player.y + 18, player.w / 2.2, 0, Math.PI * 2)
      ctx.fill()
      for (let i = 0; i < 4; i++) {
        ctx.beginPath()
        ctx.moveTo(player.x + player.w / 2, player.y + 18)
        ctx.lineTo(player.x + player.w / 2 + 24, player.y + 8 - i * 4)
        ctx.lineTo(player.x + player.w / 2, player.y + 14 - i * 4)
        ctx.closePath(); ctx.fill()
      }
      ctx.fillStyle = '#ffcc99'
      ctx.beginPath()
      ctx.arc(player.x + player.w / 2, player.y + 20, 12, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.fillRect(player.x + player.w / 2 - 10, player.y + 8, 8, 14)
      ctx.fillRect(player.x + player.w / 2 + 2, player.y + 8, 8, 14)
      ctx.fillStyle = '#000'
      ctx.fillRect(player.x + player.w / 2 - 6, player.y + 12, 2, 6)
      ctx.fillRect(player.x + player.w / 2 + 4, player.y + 12, 2, 6)
      ctx.beginPath()
      ctx.arc(player.x + player.w / 2 + 2, player.y + 26, 6, 0, Math.PI)
      ctx.stroke()
      ctx.fillStyle = '#0055ff'
      ctx.fillRect(player.x + 8, player.y + 30, player.w - 16, 24)
      ctx.fillStyle = '#ffcc99'
      ctx.beginPath()
      ctx.ellipse(player.x + player.w / 2, player.y + 42, 10, 14, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#0055ff'
      ctx.fillRect(player.x - 10, player.y + 30, 6, 16)
      ctx.fillRect(player.x + player.w + 4, player.y + 30, 6, 16)
      ctx.fillStyle = '#fff'
      ctx.fillRect(player.x - 12, player.y + 44, 10, 8)
      ctx.fillRect(player.x + player.w + 4, player.y + 44, 10, 8)
      ctx.fillStyle = '#0055ff'
      ctx.fillRect(player.x + 10, player.y + player.h - 14, 6, 14)
      ctx.fillRect(player.x + player.w - 16, player.y + player.h - 14, 6, 14)
      ctx.fillStyle = '#ff0000'
      ctx.fillRect(player.x + 6, player.y + player.h, 14, 6)
      ctx.fillRect(player.x + player.w - 20, player.y + player.h, 14, 6)
      ctx.fillStyle = '#fff'
      ctx.fillRect(player.x + 6, player.y + player.h, 14, 2)
      ctx.fillRect(player.x + player.w - 20, player.y + player.h, 14, 2)
    }

    function drawShadow(o) {
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(o.x + o.w / 2, o.y + 14, o.w / 2.1, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ff0000'
      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        ctx.moveTo(o.x + o.w / 2, o.y + 14)
        ctx.lineTo(o.x + o.w / 2 + 16, o.y + 6 - i * 3)
        ctx.lineTo(o.x + o.w / 2, o.y + 12 - i * 3)
        ctx.closePath(); ctx.fill()
      }
    }

    function drawHouse() {
      if (!house) return
      const { x, y, w, h } = house
      ctx.fillStyle = '#fef08a'; ctx.fillRect(x, y, w, h)
      ctx.fillStyle = '#dc2626'
      ctx.beginPath()
      ctx.moveTo(x - 10, y); ctx.lineTo(x + w / 2, y - 70); ctx.lineTo(x + w + 10, y)
      ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#93c5fd'
      ctx.fillRect(x + 20, y + 30, 40, 30)
      ctx.fillRect(x + w - 60, y + 30, 40, 30)
      ctx.fillStyle = '#78350f'
      ctx.fillRect(x + 120, y + h - 90, 40, 60)
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawBackground()
      if (phase !== 'celebrate') { for (const o of obstacles) drawShadow(o) }
      if (phase !== 'celebrate') drawPlayer()
      if (phase === 'toHouse' && house) drawHouse()

      hud.textContent = `Puntos: ${score}  ·  Etapa: ${stage === 0 ? 'Colinas' : 'Playa'}`

      if (tailsBadgeTimer > 0) {
        const iw = 120, ih = 90
        ctx.drawImage(tailsImg, canvas.width - iw - 12, 12, iw, ih)
      }

      if (phase === 'celebrate') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        if (house) drawHouse()
        const iw = 300, ih = 220
        const ix = (canvas.width - iw) / 2, iy = (canvas.height - ih) / 2
        ctx.drawImage(tailsImg, ix, iy, iw, ih)
        ctx.fillStyle = '#fff'
        ctx.font = '20px system-ui, Arial'
        ctx.fillText('¡Has llegado a casa y te saluda Colitas! ✨', ix - 40, iy - 16)
        ctx.font = '14px system-ui, Arial'
        ctx.fillText('La aventura continúa en un nuevo escenario...', ix + 18, iy + ih + 22)
      }
    }

    function init() {
      player.y = canvas.height - 60 - player.h
      player.onGround = true
      spawnTimer = 0; score = 0; obstacles.length = 0
    }

    let rafId
    function loop() {
      update(); draw()
      rafId = requestAnimationFrame(loop)
    }

    init()
    rafId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Mobile touch controls — update shared keys via events
  const pressKey = code => window.dispatchEvent(new KeyboardEvent('keydown', { code }))
  const releaseKey = code => window.dispatchEvent(new KeyboardEvent('keyup', { code }))

  return (
    <div className="game-page">
      <Link to="/" className="btn btn-outline-light mb-3 align-self-start ms-3">
        ← Volver al portafolio
      </Link>

      <div className="game-wrapper">
        <canvas
          ref={canvasRef}
          className="game-canvas"
          width={900}
          height={460}
        />
        <div ref={hudRef} className="game-hud" />
        <div className="game-hint d-none d-md-block">
          Mover: ⬅️➡️  ·  Saltar: ⬆️ / W / Espacio
        </div>
      </div>

      {/* Mobile controls */}
      <div className="game-controls d-md-none">
        <button
          className="game-btn"
          onPointerDown={() => pressKey('ArrowLeft')}
          onPointerUp={() => releaseKey('ArrowLeft')}
          onPointerLeave={() => releaseKey('ArrowLeft')}
        >
          ⬅
        </button>
        <button
          className="game-btn"
          onPointerDown={() => pressKey('ArrowUp')}
          onPointerUp={() => releaseKey('ArrowUp')}
          onPointerLeave={() => releaseKey('ArrowUp')}
        >
          ⬆
        </button>
        <button
          className="game-btn"
          onPointerDown={() => pressKey('ArrowRight')}
          onPointerUp={() => releaseKey('ArrowRight')}
          onPointerLeave={() => releaseKey('ArrowRight')}
        >
          ➡
        </button>
      </div>
    </div>
  )
}
