import { useRef, useEffect, useState, useCallback } from 'react'

const PARTICLE_COUNT = 120
const MOUSE_RADIUS = 120
const REPEL_STRENGTH = 0.8
const FRICTION = 0.92
const RIPPLE_SPEED = 6

function FocusInteractive() {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const particlesRef = useRef([])
  const ripplesRef = useRef([])
  const [ready, setReady] = useState(false)

  const initParticles = useCallback((width, height) => {
    const particles = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        baseX: Math.random() * width,
        baseY: Math.random() * height,
        radius: 2 + Math.random() * 2,
      })
    }
    return particles
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let width = 0
    let height = 0

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      particlesRef.current = initParticles(width, height)
      setReady(true)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement)
    return () => ro.disconnect()
  }, [initParticles])

  useEffect(() => {
    if (!ready || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const width = canvas.getBoundingClientRect().width
    const height = canvas.getBoundingClientRect().height

    const loop = () => {
      const particles = particlesRef.current
      const mouse = mouseRef.current
      const ripples = ripplesRef.current

      ctx.clearRect(0, 0, width, height)

      for (const p of particles) {
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const dist = Math.hypot(dx, dy)
        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS
          const ax = (dx / dist) * force * REPEL_STRENGTH
          const ay = (dy / dist) * force * REPEL_STRENGTH
          p.vx += ax
          p.vy += ay
        }
        p.vx += (p.baseX - p.x) * 0.012
        p.vy += (p.baseY - p.y) * 0.012
        p.vx *= FRICTION
        p.vy *= FRICTION
        p.x += p.vx
        p.y += p.vy
        p.x = Math.max(0, Math.min(width, p.x))
        p.y = Math.max(0, Math.min(height, p.y))

        const alpha = 0.5 + 0.5 * Math.min(1, dist / MOUSE_RADIUS)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(90, 159, 212, ${alpha})`
        ctx.fill()
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i]
        r.radius += RIPPLE_SPEED
        r.alpha = Math.max(0, 1 - r.radius / 180)
        if (r.alpha <= 0) {
          ripples.splice(i, 1)
          continue
        }
        ctx.beginPath()
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(90, 159, 212, ${r.alpha * 0.4})`
        ctx.lineWidth = 2
        ctx.stroke()
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [ready])

  const handlePointerMove = useCallback((e) => {
    const el = canvasRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }, [])

  const handlePointerLeave = useCallback(() => {
    mouseRef.current = { x: -1000, y: -1000 }
  }, [])

  const handlePointerDown = useCallback((e) => {
    const el = canvasRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    ripplesRef.current.push({ x, y, radius: 0, alpha: 1 })
  }, [])

  return (
    <div className="focus-interactive">
      <canvas
        ref={canvasRef}
        className="focus-interactive-canvas"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        style={{ width: '100%', height: '100%', display: 'block' }}
        aria-label="Interactive particles — move cursor to push them, click for a ripple"
      />
      <p className="focus-interactive-hint">Move to push · Click for a ripple</p>
    </div>
  )
}

export default FocusInteractive
