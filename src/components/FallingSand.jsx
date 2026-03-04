import { useRef, useEffect, useState, useCallback } from 'react'
import {
  ELEMENTS,
  CATEGORIES,
  ELEMENT_IDS_BY_CATEGORY,
  getElement,
  getElementId,
  TYPES,
} from '../data/sandElements'

const CELL_SIZE = 5
const BOUNCE = 0.6
const DEFAULT_TPS = 30
const MIN_TPS = 5
const MAX_TPS = 60

const TOOLS = [
  { id: 'erase', label: 'ERASE', className: 'tool-erase' },
  { id: 'draw', label: 'DRAW', className: 'tool-draw' },
  { id: 'pick', label: 'PICK', className: 'tool-pick' },
  { id: 'heat', label: 'HEAT', className: 'tool-heat' },
  { id: 'cool', label: 'COOL', className: 'tool-cool' },
]

function FallingSand() {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const gridRef = useRef(null)
  const colsRef = useRef(0)
  const rowsRef = useRef(0)
  const rafRef = useRef(null)
  const intervalRef = useRef(null)
  const fpsRef = useRef(0)
  const lastFrameRef = useRef(0)
  const drawingRef = useRef(false)
  const stepCountRef = useRef(0)

  const [paused, setPaused] = useState(false)
  const [tps, setTps] = useState(DEFAULT_TPS)
  const [tool, setTool] = useState('draw')
  const [brush, setBrush] = useState(getElementId('SAND'))
  const [category, setCategory] = useState('LAND')
  const [mousePos, setMousePos] = useState({ x: -1, y: -1 })
  const [pxls, setPxls] = useState(0)
  const [fps, setFps] = useState(0)
  const [initialized, setInitialized] = useState(false)

  const initGrid = useCallback((cols, rows) => {
    const grid = []
    for (let y = 0; y < rows; y++) {
      const row = []
      for (let x = 0; x < cols; x++) row.push(0)
      grid.push(row)
    }
    colsRef.current = cols
    rowsRef.current = rows
    gridRef.current = grid
    setInitialized(true)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return
    const resize = () => {
      const rect = container.getBoundingClientRect()
      const cols = Math.floor(rect.width / CELL_SIZE)
      const rows = Math.floor(rect.height / CELL_SIZE)
      canvas.width = cols * CELL_SIZE
      canvas.height = rows * CELL_SIZE
      if (!gridRef.current || colsRef.current !== cols || rowsRef.current !== rows) {
        initGrid(cols, rows)
      }
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)
    return () => ro.disconnect()
  }, [initGrid])

  const fireId = getElementId('FIRE')
  const waterId = getElementId('WATER')
  const steamId = getElementId('STEAM')
  const iceId = getElementId('ICE')
  const wallId = getElementId('WALL')

  useEffect(() => {
    if (!initialized || !gridRef.current) return
    const cols = colsRef.current
    const rows = rowsRef.current

    const step = () => {
      const grid = gridRef.current
      if (!grid || paused) return
      const next = grid.map((r) => [...r])
      stepCountRef.current += 1
      const stepCount = stepCountRef.current

      const canSwap = (nx, ny) => {
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) return false
        const nid = grid[ny][nx]
        const nel = getElement(nid)
        return nel.type === TYPES.EMPTY || nel.type === TYPES.GAS
      }

      // Liquid sinking: can move into empty or into less-dense fluid
      const canSinkInto = (nx, ny, myDensity) => {
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) return false
        const nid = grid[ny][nx]
        const nel = getElement(nid)
        if (nel.type === TYPES.EMPTY) return true
        if (nel.type === TYPES.GAS || nel.type === TYPES.LIQUID) {
          const nDensity = nel.density ?? 1
          return myDensity > nDensity
        }
        return false
      }
      // Gas rising: can move into empty or into denser fluid (lighter rises)
      const canRiseInto = (nx, ny, myDensity) => {
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) return false
        const nid = grid[ny][nx]
        const nel = getElement(nid)
        if (nel.type === TYPES.EMPTY) return true
        if (nel.type === TYPES.GAS || nel.type === TYPES.LIQUID) {
          const nDensity = nel.density ?? 1
          return myDensity < nDensity
        }
        return false
      }

      for (let y = rows - 1; y >= 0; y--) {
        for (let x = 0; x < cols; x++) {
          const id = grid[y][x]
          const el = getElement(id)
          const t = el.type
          const density = el.density ?? 1
          if (t === TYPES.EMPTY || t === TYPES.WALL || t === TYPES.SOLID || t === TYPES.MACHINE || t === TYPES.WEAPON) continue
          if (t === TYPES.SPECIAL && id !== getElementId('SUN') && id !== getElementId('TORCH')) continue

          const swap = (nx, ny) => {
            next[y][x] = grid[ny][nx]
            next[ny][nx] = id
          }

          if (t === TYPES.POWDER || t === TYPES.LIFE || t === TYPES.FOOD) {
            if (canSwap(x, y + 1)) { swap(x, y + 1); continue }
            const dl = canSwap(x - 1, y + 1), dr = canSwap(x + 1, y + 1)
            if (dl && dr) {
              const goLeft = (x + y + stepCount) % 2 === 0
              swap(x + (goLeft ? -1 : 1), y + 1)
            } else if (dl) swap(x - 1, y + 1)
            else if (dr) swap(x + 1, y + 1)
            continue
          }

          if (t === TYPES.LIQUID) {
            const viscosity = el.viscosity ?? 0
            if (Math.random() < viscosity) continue
            if (canSinkInto(x, y + 1, density)) { swap(x, y + 1); continue }
            const dir = (x + stepCount) % 2 === 0 ? 1 : -1
            for (const d of [1, 2]) {
              const nx = x + d * dir
              if (canSinkInto(nx, y + 1, density)) { next[y][x] = grid[y + 1][nx]; next[y + 1][nx] = id; break }
            }
            if (next[y][x] === id) {
              const leftEmpty = x > 0 && getElement(grid[y][x - 1]).type === TYPES.EMPTY
              const rightEmpty = x < cols - 1 && getElement(grid[y][x + 1]).type === TYPES.EMPTY
              if (leftEmpty && rightEmpty) {
                const goLeft = (x + stepCount) % 2 === 0
                const sx = goLeft ? x - 1 : x + 1
                next[y][x] = grid[y][sx]
                next[y][sx] = id
              } else if (leftEmpty) { next[y][x] = grid[y][x - 1]; next[y][x - 1] = id }
              else if (rightEmpty) { next[y][x] = grid[y][x + 1]; next[y][x + 1] = id }
            }
            continue
          }

          if (t === TYPES.GAS) {
            if (y > 0 && canRiseInto(x, y - 1, density)) { next[y][x] = grid[y - 1][x]; next[y - 1][x] = id; continue }
            const sx = (x + stepCount) % 2 === 0 ? x + 1 : x - 1
            if (sx >= 0 && sx < cols && getElement(grid[y][sx]).type === TYPES.EMPTY) {
              next[y][x] = grid[y][sx]
              next[y][sx] = id
            }
            continue
          }

          if (t === TYPES.ENERGY || (t === TYPES.SPECIAL && (id === getElementId('SUN') || id === getElementId('TORCH')))) {
            const burn = (nx, ny) => {
              if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) return
              const nid = grid[ny][nx]
              const nel = getElement(nid)
              if (nid === waterId) { next[ny][nx] = steamId; next[y][x] = 0; return }
              if (nel.type === TYPES.LIQUID && nid === getElementId('OIL') && Math.random() < 0.5) next[ny][nx] = fireId
              if (nel.type === TYPES.POWDER && Math.random() < 0.02) next[ny][nx] = fireId
            }
            for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1]]) {
              if (grid[y + dy]?.[x + dx] === waterId) { next[y][x] = 0; break }
            }
            if (next[y][x] === id && Math.random() < 0.1) next[y][x] = 0
            else if (next[y][x] === id && y > 0 && canSwap(x, y - 1) && Math.random() < 0.4) {
              next[y][x] = grid[y - 1][x]
              next[y - 1][x] = id
            }
            if (next[y][x] === id) {
              burn(x - 1, y); burn(x + 1, y); burn(x, y - 1); burn(x, y + 1)
            }
          }
        }
      }

      // Density pass: heavier liquids sink below lighter (real-world layering)
      for (let y = 0; y < rows - 1; y++) {
        for (let x = 0; x < cols; x++) {
          const topId = next[y][x]
          const botId = next[y + 1][x]
          const topEl = getElement(topId)
          const botEl = getElement(botId)
          if (topEl.type === TYPES.LIQUID && botEl.type === TYPES.LIQUID) {
            const dTop = topEl.density ?? 1
            const dBot = botEl.density ?? 1
            if (dTop > dBot) {
              next[y][x] = botId
              next[y + 1][x] = topId
            }
          }
          if (topEl.type === TYPES.GAS && botEl.type === TYPES.GAS) {
            const dTop = topEl.density ?? 1
            const dBot = botEl.density ?? 1
            if (dTop > dBot) {
              next[y][x] = botId
              next[y + 1][x] = topId
            }
          }
        }
      }

      gridRef.current = next
      let count = 0
      for (let yy = 0; yy < rows; yy++) for (let xx = 0; xx < cols; xx++) if (next[yy][xx] !== 0) count++
      setPxls(count)
    }

    intervalRef.current = setInterval(step, 1000 / tps)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [initialized, paused, tps, fireId, waterId, steamId])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !gridRef.current) return
    const cols = colsRef.current
    const rows = rowsRef.current
    const ctx = canvas.getContext('2d')

    const draw = () => {
      const grid = gridRef.current
      if (!grid) return
      for (let yy = 0; yy < rows; yy++) {
        for (let xx = 0; xx < cols; xx++) {
          const el = getElement(grid[yy][xx])
          ctx.fillStyle = el.color
          ctx.fillRect(xx * CELL_SIZE, yy * CELL_SIZE, CELL_SIZE, CELL_SIZE)
        }
      }
      const now = performance.now()
      fpsRef.current = 1000 / (now - lastFrameRef.current) || 0
      lastFrameRef.current = now
      setFps(Math.round(fpsRef.current))
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [initialized])

  const getCell = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = Math.floor(((e.clientX - rect.left) * scaleX) / CELL_SIZE)
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / CELL_SIZE)
    const cols = colsRef.current
    const rows = rowsRef.current
    if (x < 0 || x >= cols || y < 0 || y >= rows) return null
    return { x, y }
  }, [])

  const drawAt = useCallback(
    (e, forceId) => {
      const cell = getCell(e)
      if (!cell || !gridRef.current) return
      const { x, y } = cell
      const grid = gridRef.current
      if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return
      const id = forceId ?? (tool === 'erase' ? 0 : brush)
      if (tool === 'heat') {
        grid[y][x] = fireId
        if (x > 0) grid[y][x - 1] = getElement(grid[y][x - 1]).type === TYPES.LIQUID && grid[y][x - 1] === waterId ? steamId : grid[y][x - 1]
        if (x < grid[0].length - 1) grid[y][x + 1] = getElement(grid[y][x + 1]).type === TYPES.LIQUID && grid[y][x + 1] === waterId ? steamId : grid[y][x + 1]
        if (y > 0) grid[y - 1][x] = getElement(grid[y - 1][x]).type === TYPES.LIQUID && grid[y - 1][x] === waterId ? steamId : grid[y - 1][x]
        if (y < grid.length - 1) grid[y + 1][x] = getElement(grid[y + 1][x]).type === TYPES.LIQUID && grid[y + 1][x] === waterId ? steamId : grid[y + 1][x]
      } else if (tool === 'cool') {
        grid[y][x] = iceId
        if (x > 0 && grid[y][x - 1] === waterId) grid[y][x - 1] = iceId
        if (x < grid[0].length - 1 && grid[y][x + 1] === waterId) grid[y][x + 1] = iceId
        if (y > 0 && grid[y - 1][x] === waterId) grid[y - 1][x] = iceId
        if (y < grid.length - 1 && grid[y + 1][x] === waterId) grid[y + 1][x] = iceId
      } else if (tool === 'pick') {
        const picked = grid[y][x]
        if (picked !== 0) setBrush(picked)
      } else {
        grid[y][x] = id
      }
    },
    [tool, brush, getCell, fireId, waterId, steamId, iceId]
  )

  const handlePointerDown = useCallback(
    (e) => {
      drawingRef.current = true
      drawAt(e)
    },
    [drawAt]
  )
  const handlePointerMove = useCallback(
    (e) => {
      const cell = getCell(e)
      setMousePos(cell ? { x: cell.x, y: cell.y } : { x: -1, y: -1 })
      if (drawingRef.current) drawAt(e)
    },
    [getCell, drawAt]
  )
  const handlePointerUp = useCallback(() => { drawingRef.current = false }, [])
  useEffect(() => {
    const onUp = () => { drawingRef.current = false }
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => { window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp) }
  }, [])

  const reset = useCallback(() => {
    const grid = gridRef.current
    if (!grid) return
    const cols = colsRef.current
    const rows = rowsRef.current
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) grid[y][x] = 0
    setPxls(0)
  }, [])

  const elementIds = ELEMENT_IDS_BY_CATEGORY[category] || []

  return (
    <div ref={containerRef} className="falling-sand">
      <div className="sand-ui">
        <div className="sand-status">
          <span>x{mousePos.x >= 0 ? mousePos.x : '-'}, y{mousePos.y >= 0 ? mousePos.y : '-'}</span>
          <span>Pxls: {pxls}</span>
          <span>{fps} fps</span>
          <span>[↑]</span>
        </div>
        <div className="sand-controls">
          <button type="button" className={paused ? 'active' : ''} onClick={() => setPaused((p) => !p)}>PAUSE</button>
          <button type="button" onClick={() => setPaused(false)}>&gt;</button>
          <button type="button" onClick={() => setTps((t) => Math.max(MIN_TPS, t - 5))}>-</button>
          <button type="button" onClick={() => setTps((t) => Math.min(MAX_TPS, t + 5))}>+</button>
          <button type="button" onClick={reset}>RESET</button>
          <span className="sand-controls-fill" />
          <button type="button" className="sand-btn-ghost">REPLACE</button>
          <button type="button" className="sand-btn-ghost">ELEM</button>
          <button type="button" className="sand-btn-ghost">EDIT</button>
          <button type="button" className="sand-btn-ghost">INFO</button>
          <button type="button" className="sand-btn-ghost">SAVES</button>
          <button type="button" className="sand-btn-ghost">MODS</button>
          <button type="button" className="sand-btn-ghost">SETTINGS</button>
        </div>
        <div className="sand-tools">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`sand-tool ${t.className}${tool === t.id ? ' active' : ''}`}
              onClick={() => setTool(t.id)}
            >
              {t.label}
            </button>
          ))}
          <span className="sand-controls-fill" />
          <button type="button" className="sand-tool tool-paint">PAINT</button>
          <button type="button" className="sand-tool tool-smash">SMASH</button>
        </div>
        <div className="sand-categories">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`sand-cat${category === c.id ? ' active' : ''}`}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="sand-elements">
          {elementIds.map((id) => {
            const el = getElement(id)
            return (
              <button
                key={id}
                type="button"
                className={`sand-el${brush === id ? ' active' : ''}`}
                onClick={() => { setBrush(id); setTool('draw') }}
                title={el.name}
                style={{ background: el.color }}
              >
                {el.name}
              </button>
            )
          })}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="falling-sand-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  )
}

export default FallingSand
