const BACKGROUNDS = [
  ['#34d399', '#064e3b', '#a7f3d0'],
  ['#60a5fa', '#172554', '#bfdbfe'],
  ['#f97316', '#431407', '#fdba74'],
  ['#e879f9', '#4a044e', '#f5d0fe'],
  ['#f43f5e', '#4c0519', '#fda4af'],
  ['#facc15', '#422006', '#fde68a'],
  ['#22d3ee', '#083344', '#a5f3fc'],
  ['#a78bfa', '#2e1065', '#ddd6fe'],
]

const SKIN_TONES = ['#f8d7c4', '#f1c7a5', '#e6b18a', '#d49a6a', '#b97850', '#8c5937']
const HAIR_COLORS = ['#231815', '#3b2618', '#5b3b24', '#6f4e37', '#1f2937', '#7c3f00', '#d6d3d1']
const SHIRT_COLORS = ['#2563eb', '#7c3aed', '#ea580c', '#0f766e', '#db2777', '#16a34a', '#b45309', '#334155']
const LIP_COLORS = ['#a8555d', '#9f1239', '#7f1d1d', '#92400e']

function hashSeed(value) {
  let hash = 2166136261
  const input = String(value || 'guest')
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createRng(seed) {
  let t = seed || 1
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function pick(list, rng) {
  return list[Math.floor(rng() * list.length)]
}

function buildInitials(user) {
  const source = user?.user_metadata?.full_name || user?.email || user?.id || 'Dailo'
  const cleaned = String(source).trim()
  if (!cleaned) return 'DL'

  const fromWords = cleaned
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  if (fromWords.length >= 2) return fromWords.slice(0, 2)
  return cleaned.slice(0, 2).toUpperCase()
}

function buildHair(style, hairColor, faceWidth, hairHeight, faceTop) {
  const left = 48 - faceWidth - 3
  const right = 48 + faceWidth + 3
  const top = faceTop - 8

  if (style === 'buzz') {
    return `
      <path d="M${left + 6} ${faceTop + 6}C${left + 10} ${top - 4},${right - 10} ${top - 4},${right - 6} ${faceTop + 6}L${right - 8} ${faceTop + 10}C${right - 16} ${faceTop + 1},${left + 16} ${faceTop + 1},${left + 8} ${faceTop + 10}Z" fill="${hairColor}" />
    `
  }

  if (style === 'side-swoop') {
    return `
      <path d="M${left} ${faceTop + 12}C${left + 2} ${top - 10},${right - 4} ${top - 12},${right} ${faceTop + 10}C${right - 5} ${faceTop + 4},58 ${faceTop - 1},46 ${faceTop + 6}C38 ${faceTop + 11},30 ${faceTop + 11},${left} ${faceTop + 12}Z" fill="${hairColor}" />
      <path d="M60 ${faceTop + 5}C56 ${faceTop - 4},46 ${faceTop - 6},38 ${faceTop + 4}C47 ${faceTop + 2},55 ${faceTop + 7},58 ${faceTop + 15}" fill="${hairColor}" />
    `
  }

  if (style === 'curly') {
    return `
      <g fill="${hairColor}">
        <circle cx="${48 - faceWidth + 4}" cy="${faceTop + 11}" r="8" />
        <circle cx="${48 - faceWidth / 2}" cy="${faceTop + 5}" r="10" />
        <circle cx="48" cy="${top + 8}" r="${hairHeight / 3}" />
        <circle cx="${48 + faceWidth / 2}" cy="${faceTop + 5}" r="10" />
        <circle cx="${48 + faceWidth - 4}" cy="${faceTop + 11}" r="8" />
      </g>
      <path d="M${left + 6} ${faceTop + 18}C${left + 16} ${faceTop + 10},${right - 16} ${faceTop + 10},${right - 6} ${faceTop + 18}L${right - 8} ${faceTop + 24}C${right - 18} ${faceTop + 18},${left + 18} ${faceTop + 18},${left + 8} ${faceTop + 24}Z" fill="${hairColor}" />
    `
  }

  if (style === 'top-knot') {
    return `
      <circle cx="48" cy="${top + 2}" r="8" fill="${hairColor}" />
      <path d="M${left + 2} ${faceTop + 14}C${left + 6} ${top - 8},${right - 6} ${top - 8},${right - 2} ${faceTop + 14}C${right - 8} ${faceTop + 4},${left + 8} ${faceTop + 4},${left + 2} ${faceTop + 14}Z" fill="${hairColor}" />
    `
  }

  return `
    <path d="M${left} ${faceTop + 14}C${left + 4} ${top - 8},${right - 4} ${top - 8},${right} ${faceTop + 14}L${right - 2} ${faceTop + 18}C${right - 10} ${faceTop + 8},${left + 10} ${faceTop + 8},${left + 2} ${faceTop + 18}Z" fill="${hairColor}" />
    <path d="M${left + 8} ${faceTop + 18}C${left + 12} ${faceTop + 7},${right - 12} ${faceTop + 7},${right - 8} ${faceTop + 18}" fill="none" stroke="${hairColor}" stroke-width="6" stroke-linecap="round" />
  `
}

function buildEyes(style, irisColor) {
  if (style === 'sleepy') {
    return `
      <path d="M34 44C37 42,41 42,44 44" fill="none" stroke="#111827" stroke-width="2.6" stroke-linecap="round" />
      <path d="M52 44C55 42,59 42,62 44" fill="none" stroke="#111827" stroke-width="2.6" stroke-linecap="round" />
    `
  }

  if (style === 'smile') {
    return `
      <path d="M34 45C37 49,41 49,44 45" fill="none" stroke="#111827" stroke-width="2.6" stroke-linecap="round" />
      <path d="M52 45C55 49,59 49,62 45" fill="none" stroke="#111827" stroke-width="2.6" stroke-linecap="round" />
    `
  }

  return `
    <g>
      <ellipse cx="39" cy="45" rx="4.2" ry="4.7" fill="#ffffff" />
      <ellipse cx="57" cy="45" rx="4.2" ry="4.7" fill="#ffffff" />
      <circle cx="39" cy="45.5" r="2.3" fill="${irisColor}" />
      <circle cx="57" cy="45.5" r="2.3" fill="${irisColor}" />
      <circle cx="39.7" cy="44.8" r="0.75" fill="#ffffff" />
      <circle cx="57.7" cy="44.8" r="0.75" fill="#ffffff" />
    </g>
  `
}

function buildMouth(style, mouthColor) {
  if (style === 'open') {
    return `
      <path d="M41 61C44 64,52 64,55 61" fill="none" stroke="#5b1a1a" stroke-width="2.2" stroke-linecap="round" />
      <ellipse cx="48" cy="62.5" rx="6.2" ry="4.2" fill="#7f1d1d" />
      <path d="M43 61.5C45 60.5,51 60.5,53 61.5" fill="none" stroke="#fecdd3" stroke-width="1.6" stroke-linecap="round" />
    `
  }

  if (style === 'grin') {
    return `
      <path d="M40 60C43 64,53 64,56 60" fill="#ffffff" stroke="#111827" stroke-width="1.6" stroke-linejoin="round" />
      <path d="M40.8 60.7H55.2" stroke="#e5e7eb" stroke-width="1" />
    `
  }

  if (style === 'smirk') {
    return `<path d="M42 61C46 63,52 63,56 59" fill="none" stroke="${mouthColor}" stroke-width="2.3" stroke-linecap="round" />`
  }

  return `<path d="M41 60C44 64,52 64,55 60" fill="none" stroke="${mouthColor}" stroke-width="2.3" stroke-linecap="round" />`
}

function buildAccessory(style, accentColor) {
  if (style === 'glasses') {
    return `
      <g fill="none" stroke="#111827" stroke-width="1.8">
        <rect x="31.5" y="40.5" width="15" height="10.5" rx="4.5" />
        <rect x="49.5" y="40.5" width="15" height="10.5" rx="4.5" />
        <path d="M46.5 45.7H49.5" />
      </g>
    `
  }

  if (style === 'star') {
    return `
      <path d="M67 58l1.5 3.5 3.8.3-2.9 2.4.9 3.7-3.3-1.9-3.3 1.9.9-3.7-2.9-2.4 3.8-.3Z" fill="${accentColor}" opacity="0.95" />
    `
  }

  if (style === 'freckles') {
    return `
      <g fill="#b45309" opacity="0.34">
        <circle cx="34" cy="55" r="1" />
        <circle cx="37" cy="56" r="1" />
        <circle cx="62" cy="55" r="1" />
        <circle cx="59" cy="56" r="1" />
      </g>
    `
  }

  return ''
}

export function getUserAvatarDataUri(user, size = 96) {
  const seedSource = user?.id || user?.email || user?.user_metadata?.full_name || 'guest'
  const seed = hashSeed(seedSource)
  const rng = createRng(seed)
  const initials = buildInitials(user)

  const [bgA, bgB, bgC] = pick(BACKGROUNDS, rng)
  const skinTone = pick(SKIN_TONES, rng)
  const hairColor = pick(HAIR_COLORS, rng)
  const shirtColor = pick(SHIRT_COLORS, rng)
  const mouthColor = pick(LIP_COLORS, rng)
  const eyeStyle = pick(['round', 'smile', 'sleepy'], rng)
  const mouthStyle = pick(['smile', 'grin', 'open', 'smirk'], rng)
  const hairStyle = pick(['soft', 'side-swoop', 'curly', 'top-knot', 'buzz'], rng)
  const accessoryStyle = pick(['none', 'glasses', 'freckles', 'star'], rng)
  const faceWidth = 18 + Math.floor(rng() * 4)
  const faceHeight = 22 + Math.floor(rng() * 4)
  const faceTop = 22 + Math.floor(rng() * 4)
  const earY = 48
  const neckWidth = 12 + Math.floor(rng() * 3)
  const irisColor = rng() > 0.55 ? '#1f2937' : bgB
  const cheekOpacity = 0.12 + rng() * 0.08
  const shirtNeck = 70 + Math.floor(rng() * 3)
  const idSuffix = seed.toString(36)

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="Cartoon avatar for ${initials}">
      <defs>
        <linearGradient id="bg-${idSuffix}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgA}" />
          <stop offset="100%" stop-color="${bgB}" />
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="28" fill="url(#bg-${idSuffix})" />
      <circle cx="20" cy="18" r="12" fill="${bgC}" opacity="0.22" />
      <circle cx="76" cy="20" r="9" fill="${bgC}" opacity="0.18" />
      <path d="M12 96C14 79,28 69,48 69S82 79,84 96Z" fill="${shirtColor}" />
      <path d="M31 ${shirtNeck}C35 76,61 76,65 ${shirtNeck}V96H31Z" fill="${shirtColor}" opacity="0.85" />
      <rect x="${48 - neckWidth / 2}" y="58" width="${neckWidth}" height="13" rx="5" fill="${skinTone}" />
      <ellipse cx="${48 - faceWidth - 2}" cy="${earY}" rx="4.2" ry="6" fill="${skinTone}" />
      <ellipse cx="${48 + faceWidth + 2}" cy="${earY}" rx="4.2" ry="6" fill="${skinTone}" />
      <ellipse cx="48" cy="${faceTop + faceHeight}" rx="${faceWidth}" ry="${faceHeight}" fill="${skinTone}" />
      <ellipse cx="35" cy="53" rx="5.2" ry="3.2" fill="#f472b6" opacity="${cheekOpacity}" />
      <ellipse cx="61" cy="53" rx="5.2" ry="3.2" fill="#f472b6" opacity="${cheekOpacity}" />
      ${buildHair(hairStyle, hairColor, faceWidth, faceHeight, faceTop)}
      <path d="M34 38C36 36,40 36,42 37" fill="none" stroke="#3f3f46" stroke-width="1.8" stroke-linecap="round" />
      <path d="M54 37C56 36,60 36,62 38" fill="none" stroke="#3f3f46" stroke-width="1.8" stroke-linecap="round" />
      ${buildEyes(eyeStyle, irisColor)}
      <path d="M48 47C46.5 51,46.5 54.5,48 57C49 57.4,50.2 57.4,51.2 56.7" fill="none" stroke="#9a6b4b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      ${buildMouth(mouthStyle, mouthColor)}
      ${buildAccessory(accessoryStyle, bgC)}
      <path d="M38 73C42 77,54 77,58 73" fill="none" stroke="#ffffff" stroke-opacity="0.28" stroke-width="2.4" stroke-linecap="round" />
    </svg>
  `.trim()

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export function getUserInitials(user) {
  return buildInitials(user)
}
