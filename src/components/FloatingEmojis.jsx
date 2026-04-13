import { useState, useCallback, useRef, useEffect } from 'react'
import {
  FlameIcon, StarIcon, BrainIcon, DumbbellIcon, LeafIcon, BookIcon,
  CoffeeIcon, LightbulbIcon, PaletteIcon, RocketIcon, BoltIcon,
  DiamondIcon, MusicIcon, TrophyIcon, HeartIcon, TargetIcon,
  SunIcon, MoonIcon, DropletIcon, SparklesIcon, GlobeIcon,
  FlowerIcon, GamepadIcon, BellIcon, EditIcon, CheckIcon
} from './Icons'

const ICON_COMPONENTS = [
  FlameIcon, StarIcon, BrainIcon, DumbbellIcon, LeafIcon, BookIcon,
  CoffeeIcon, LightbulbIcon, PaletteIcon, RocketIcon, BoltIcon,
  DiamondIcon, MusicIcon, TrophyIcon, HeartIcon, TargetIcon,
  SunIcon, MoonIcon, DropletIcon, SparklesIcon, GlobeIcon,
  FlowerIcon, GamepadIcon, BellIcon, EditIcon, CheckIcon,
]

const ICON_COLORS = [
  '#4ade80', '#f97316', '#facc15', '#60a5fa', '#f472b6',
  '#a78bfa', '#34d399', '#fb923c', '#e879f9', '#38bdf8',
  '#fbbf24', '#c084fc', '#2dd4bf', '#f87171', '#a3e635',
]

const MAX_EMOJIS = 50
const RADIUS = 22
const BOUNCE = 0.6
const FRICTION = 0.998
const DRAG_RELEASE_MULT = 0.3
const INITIAL_SPEED = 14
const HOVER_RADIUS = 85
const HOVER_FORCE = 2.2

function getInitialItems(containerW, containerH) {
  const items = []
  for (let i = 0; i < MAX_EMOJIS; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = INITIAL_SPEED * (0.6 + Math.random() * 0.4)
    items.push({
      id: i,
      iconIndex: i % ICON_COMPONENTS.length,
      color: ICON_COLORS[i % ICON_COLORS.length],
      x: RADIUS + Math.random() * Math.max(0, containerW - 2 * RADIUS),
      y: RADIUS + Math.random() * Math.max(0, containerH - 2 * RADIUS),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    })
  }
  return items
}

function resolveCollision(a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const dist = Math.hypot(dx, dy)
  const minDist = 2 * RADIUS
  if (dist >= minDist || dist === 0) return [a, b]
  const n = { x: dx / dist, y: dy / dist }
  const overlap = minDist - dist
  const half = overlap / 2
  const a2 = {
    ...a,
    x: a.x - n.x * half,
    y: a.y - n.y * half,
    vx: a.vx - (a.vx - b.vx) * n.x * n.x - (a.vy - b.vy) * n.x * n.y,
    vy: a.vy - (a.vx - b.vx) * n.x * n.y - (a.vy - b.vy) * n.y * n.y,
  }
  const b2 = {
    ...b,
    x: b.x + n.x * half,
    y: b.y + n.y * half,
    vx: b.vx - (b.vx - a.vx) * n.x * n.x - (b.vy - a.vy) * n.x * n.y,
    vy: b.vy - (b.vx - a.vx) * n.x * n.y - (b.vy - a.vy) * n.y * n.y,
  }
  a2.vx *= BOUNCE
  a2.vy *= BOUNCE
  b2.vx *= BOUNCE
  b2.vy *= BOUNCE
  return [a2, b2]
}

function stepPhysics(items, w, h, draggingId, mouse) {
  const next = items.map((item) => {
    if (item.id === draggingId) return item
    let { x, y, vx, vy } = item
    if (mouse != null && mouse.x >= 0 && mouse.y >= 0) {
      const dx = item.x - mouse.x
      const dy = item.y - mouse.y
      const dist = Math.hypot(dx, dy)
      if (dist < HOVER_RADIUS && dist > 0) {
        const strength = HOVER_FORCE * (1 - dist / HOVER_RADIUS)
        const nx = dx / dist
        const ny = dy / dist
        vx += nx * strength
        vy += ny * strength
      }
    }
    x += vx
    y += vy
    vx *= FRICTION
    vy *= FRICTION
    if (x - RADIUS < 0) {
      x = RADIUS
      vx = -vx * BOUNCE
    }
    if (x + RADIUS > w) {
      x = w - RADIUS
      vx = -vx * BOUNCE
    }
    if (y - RADIUS < 0) {
      y = RADIUS
      vy = -vy * BOUNCE
    }
    if (y + RADIUS > h) {
      y = h - RADIUS
      vy = -vy * BOUNCE
    }
    return { ...item, x, y, vx, vy }
  })

  for (let i = 0; i < next.length; i++) {
    for (let j = i + 1; j < next.length; j++) {
      if (next[i].id === draggingId || next[j].id === draggingId) continue
      const [a2, b2] = resolveCollision(next[i], next[j])
      next[i] = a2
      next[j] = b2
    }
  }
  return next
}

function FloatingEmojis() {
  const containerRef = useRef(null)
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })
  const [items, setItems] = useState([])
  const initializedRef = useRef(false)
  const [draggingId, setDraggingId] = useState(null)
  const dragStartRef = useRef({ x: 0, y: 0, itemX: 0, itemY: 0 })
  const lastMoveRef = useRef({ x: 0, y: 0, t: 0 })
  const releaseVelRef = useRef({ vx: 0, vy: 0 })
  const rafRef = useRef(null)
  const draggingIdRef = useRef(null)
  const mouseRef = useRef({ x: -1, y: -1 })
  draggingIdRef.current = draggingId

  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const updateSize = () => {
      const rect = el.getBoundingClientRect()
      setContainerSize({ w: rect.width, h: rect.height })
    }
    updateSize()
    const ro = new ResizeObserver(updateSize)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (containerSize.w <= 0 || containerSize.h <= 0) return
    if (initializedRef.current) return
    initializedRef.current = true
    setItems(getInitialItems(containerSize.w, containerSize.h))
  }, [containerSize.w, containerSize.h])

  useEffect(() => {
    if (items.length === 0) return
    const w = containerSize.w
    const h = containerSize.h
    if (w <= 0 || h <= 0) return

    const tick = () => {
      setItems((prev) => {
        if (prev.length === 0) return prev
        return stepPhysics(prev, w, h, draggingIdRef.current, mouseRef.current)
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [items.length, containerSize.w, containerSize.h])

  const getLocalCoords = useCallback((clientX, clientY) => {
    if (!containerRef.current) return { x: 0, y: 0 }
    const rect = containerRef.current.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top }
  }, [])

  const handlePointerDown = useCallback(
    (e, id) => {
      e.preventDefault()
      const { x, y } = getLocalCoords(e.clientX, e.clientY)
      const item = items.find((i) => i.id === id)
      if (!item) return
      setDraggingId(id)
      dragStartRef.current = { x, y, itemX: item.x, itemY: item.y }
      lastMoveRef.current = { x: item.x, y: item.y, t: performance.now() }
      releaseVelRef.current = { vx: 0, vy: 0 }
    },
    [getLocalCoords, items]
  )

  useEffect(() => {
    if (draggingId === null) return
    const onMove = (e) => {
      const { x, y } = getLocalCoords(e.clientX, e.clientY)
      const { itemX, itemY } = dragStartRef.current
      const newX = itemX + (x - dragStartRef.current.x)
      const newY = itemY + (y - dragStartRef.current.y)
      const t = performance.now()
      const dt = (t - lastMoveRef.current.t) / 1000 || 0.016
      if (dt > 0) {
        releaseVelRef.current = {
          vx: (newX - lastMoveRef.current.x) / dt,
          vy: (newY - lastMoveRef.current.y) / dt,
        }
      }
      lastMoveRef.current = { x: newX, y: newY, t }
      setItems((prev) =>
        prev.map((it) =>
          it.id === draggingId
            ? {
                ...it,
                x: newX,
                y: newY,
                vx: 0,
                vy: 0,
              }
            : it
        )
      )
    }
    const onUp = () => {
      const { vx, vy } = releaseVelRef.current
      setItems((prev) =>
        prev.map((it) =>
          it.id === draggingId
            ? { ...it, vx: vx * DRAG_RELEASE_MULT, vy: vy * DRAG_RELEASE_MULT }
            : it
        )
      )
      setDraggingId(null)
    }
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [draggingId, getLocalCoords, items])

  const handlePointerMove = useCallback(
    (e) => {
      const { x, y } = getLocalCoords(e.clientX, e.clientY)
      mouseRef.current = { x, y }
    },
    [getLocalCoords]
  )
  const handlePointerLeave = useCallback(() => {
    mouseRef.current = { x: -1, y: -1 }
  }, [])

  return (
    <div
      ref={containerRef}
      className="floating-emojis-bg"
      aria-hidden="true"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {items.map(({ id, iconIndex, color, x, y }) => {
        const IconComp = ICON_COMPONENTS[iconIndex]
        return (
          <span
            key={id}
            className="floating-emoji floating-emoji-physics"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              color,
            }}
            onPointerDown={(e) => handlePointerDown(e, id)}
            role="presentation"
            draggable={false}
          >
            <IconComp size={28} />
          </span>
        )
      })}
    </div>
  )
}

export default FloatingEmojis
