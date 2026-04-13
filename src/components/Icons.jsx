const Icon = ({ children, size = 18, className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`icon ${className}`}
    {...props}
  >
    {children}
  </svg>
)

export const FlameIcon = ({ size, className, ...props }) => (
  <Icon size={size} className={`icon-flame ${className || ''}`} {...props}>
    <path d="M12 2c0 4-4 6-4 10a4 4 0 0 0 8 0c0-4-4-6-4-10Z" fill="currentColor" stroke="currentColor" />
    <path d="M12 18a2 2 0 0 1-2-2c0-2 2-3 2-5c0 2 2 3 2 5a2 2 0 0 1-2 2Z" fill="var(--bg, #1a1a2e)" stroke="none" />
  </Icon>
)

export const BellIcon = ({ size, className, ...props }) => (
  <Icon size={size} className={`icon-bell ${className || ''}`} {...props}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </Icon>
)

export const TargetIcon = ({ size, className, ...props }) => (
  <Icon size={size} className={`icon-target ${className || ''}`} {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </Icon>
)

export const EditIcon = ({ size, className, ...props }) => (
  <Icon size={size} className={`icon-edit ${className || ''}`} {...props}>
    <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </Icon>
)

export const TrashIcon = ({ size, className, ...props }) => (
  <Icon size={size} className={`icon-trash ${className || ''}`} {...props}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </Icon>
)

export const CheckIcon = ({ size, className, ...props }) => (
  <Icon size={size} className={`icon-check ${className || ''}`} {...props}>
    <polyline points="20 6 9 17 4 12" strokeWidth={3} />
  </Icon>
)

export const StarIcon = ({ size, className, ...props }) => (
  <Icon size={size} className={`icon-star ${className || ''}`} {...props}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" />
  </Icon>
)

export const RocketIcon = ({ size, className, ...props }) => (
  <Icon size={size} className={`icon-rocket ${className || ''}`} {...props}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </Icon>
)

export const BoltIcon = ({ size, className, ...props }) => (
  <Icon size={size} className={`icon-bolt ${className || ''}`} {...props}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" stroke="currentColor" />
  </Icon>
)

export const HeartIcon = ({ size, className, ...props }) => (
  <Icon size={size} className={`icon-heart ${className || ''}`} {...props}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" fill="currentColor" />
  </Icon>
)

export const LeafIcon = ({ size, className, ...props }) => (
  <Icon size={size} className={`icon-leaf ${className || ''}`} {...props}>
    <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 20 .5 20 .5s1 4.9-1 10.5A7 7 0 0 1 11 20Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </Icon>
)

export const TrophyIcon = ({ size, className, ...props }) => (
  <Icon size={size} className={`icon-trophy ${className || ''}`} {...props}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </Icon>
)

export const MusicIcon = ({ size, className, ...props }) => (
  <Icon size={size} className={`icon-music ${className || ''}`} {...props}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" fill="currentColor" />
    <circle cx="18" cy="16" r="3" fill="currentColor" />
  </Icon>
)

export const BookIcon = ({ size, className, ...props }) => (
  <Icon size={size} className={`icon-book ${className || ''}`} {...props}>
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
  </Icon>
)

export const SunIcon = ({ size, className, ...props }) => (
  <Icon size={size} className={`icon-sun ${className || ''}`} {...props}>
    <circle cx="12" cy="12" r="4" fill="currentColor" />
    <path d="M12 2v2" /><path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" /><path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
  </Icon>
)

export const MoonIcon = ({ size, className, ...props }) => (
  <Icon size={size} className={`icon-moon ${className || ''}`} {...props}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill="currentColor" />
  </Icon>
)

export const DropletIcon = ({ size, className, ...props }) => (
  <Icon size={size} className={`icon-droplet ${className || ''}`} {...props}>
    <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7Z" fill="currentColor" />
  </Icon>
)

export const SparklesIcon = ({ size, className, ...props }) => (
  <Icon size={size} className={`icon-sparkles ${className || ''}`} {...props}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" fill="currentColor" />
    <path d="M5 3v4" /><path d="M19 17v4" />
    <path d="M3 5h4" /><path d="M17 19h4" />
  </Icon>
)

export const DiamondIcon = ({ size, className, ...props }) => (
  <Icon size={size} className={`icon-diamond ${className || ''}`} {...props}>
    <path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z" />
  </Icon>
)

export const CoffeeIcon = ({ size, className, ...props }) => (
  <Icon size={size} className={`icon-coffee ${className || ''}`} {...props}>
    <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
    <line x1="6" y1="2" x2="6" y2="4" />
    <line x1="10" y1="2" x2="10" y2="4" />
    <line x1="14" y1="2" x2="14" y2="4" />
  </Icon>
)

export const LightbulbIcon = ({ size, className, ...props }) => (
  <Icon size={size} className={`icon-lightbulb ${className || ''}`} {...props}>
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </Icon>
)

export const PaletteIcon = ({ size, className, ...props }) => (
  <Icon size={size} className={`icon-palette ${className || ''}`} {...props}>
    <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2Z" />
  </Icon>
)

export const GlobeIcon = ({ size, className, ...props }) => (
  <Icon size={size} className={`icon-globe ${className || ''}`} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </Icon>
)

export const FlowerIcon = ({ size, className, ...props }) => (
  <Icon size={size} className={`icon-flower ${className || ''}`} {...props}>
    <path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V9m-4.5 3a4.5 4.5 0 1 0 4.5 4.5M7.5 12H9m7.5 0a4.5 4.5 0 1 1-4.5 4.5m4.5-4.5H15m-3 4.5V15" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </Icon>
)

export const DumbbellIcon = ({ size, className, ...props }) => (
  <Icon size={size} className={`icon-dumbbell ${className || ''}`} {...props}>
    <path d="m6.5 6.5 11 11" />
    <path d="m21 21-1-1" /><path d="m3 3 1 1" />
    <path d="m18 22 4-4" /><path d="m2 6 4-4" />
    <path d="m3 10 7-7" /><path d="m14 21 7-7" />
  </Icon>
)

export const GamepadIcon = ({ size, className, ...props }) => (
  <Icon size={size} className={`icon-gamepad ${className || ''}`} {...props}>
    <line x1="6" y1="12" x2="10" y2="12" />
    <line x1="8" y1="10" x2="8" y2="14" />
    <line x1="15" y1="13" x2="15.01" y2="13" />
    <line x1="18" y1="11" x2="18.01" y2="11" />
    <rect x="2" y="6" width="20" height="12" rx="2" />
  </Icon>
)

export const BrainIcon = ({ size, className, ...props }) => (
  <Icon size={size} className={`icon-brain ${className || ''}`} {...props}>
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
    <path d="M12 5v13" />
  </Icon>
)
