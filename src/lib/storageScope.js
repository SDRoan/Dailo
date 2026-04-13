const STORAGE_SCOPE_META_KEY = 'habitloop_storage_scope'
const LEGACY_STORAGE_OWNER_KEY = 'habitloop_legacy_storage_owner'
const DEFAULT_STORAGE_SCOPE = 'guest'
export const STORAGE_SYNC_EVENT = 'habitloop:storage-sync'

export function getActiveStorageScope() {
  try {
    return localStorage.getItem(STORAGE_SCOPE_META_KEY) || DEFAULT_STORAGE_SCOPE
  } catch {
    return DEFAULT_STORAGE_SCOPE
  }
}

export function setActiveStorageScope(scope) {
  try {
    localStorage.setItem(STORAGE_SCOPE_META_KEY, scope || DEFAULT_STORAGE_SCOPE)
  } catch {}
}

export function buildScopedStorageKey(baseKey, scope = getActiveStorageScope()) {
  return `${baseKey}::${scope || DEFAULT_STORAGE_SCOPE}`
}

function emitScopedStorageChange(baseKey, scope) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(STORAGE_SYNC_EVENT, {
      detail: {
        baseKey,
        scope: scope || getActiveStorageScope(),
      },
    }),
  )
}

export function readScopedStorage(baseKey) {
  try {
    const scoped = localStorage.getItem(buildScopedStorageKey(baseKey))
    if (scoped != null) return scoped
    if (getActiveStorageScope() === DEFAULT_STORAGE_SCOPE) return localStorage.getItem(baseKey)
    return null
  } catch {
    return null
  }
}

export function writeScopedStorage(baseKey, value) {
  writeScopedStorageWithOptions(baseKey, value)
}

export function removeScopedStorage(baseKey) {
  removeScopedStorageWithOptions(baseKey)
}

export function writeScopedStorageWithOptions(baseKey, value, options = {}) {
  const scope = options.scope || getActiveStorageScope()
  localStorage.setItem(buildScopedStorageKey(baseKey, scope), value)
  if (!options.silent) emitScopedStorageChange(baseKey, scope)
}

export function removeScopedStorageWithOptions(baseKey, options = {}) {
  const scope = options.scope || getActiveStorageScope()
  localStorage.removeItem(buildScopedStorageKey(baseKey, scope))
  if (!options.silent) emitScopedStorageChange(baseKey, scope)
}

export function migrateLegacyKeyToScope(baseKey, scope = getActiveStorageScope()) {
  if (!scope || scope === DEFAULT_STORAGE_SCOPE) return false

  try {
    const owner = localStorage.getItem(LEGACY_STORAGE_OWNER_KEY)
    if (owner && owner !== scope) return false

    const scopedKey = buildScopedStorageKey(baseKey, scope)
    if (localStorage.getItem(scopedKey) != null) return false

    const legacyValue = localStorage.getItem(baseKey)
    if (legacyValue == null) return false

    localStorage.setItem(scopedKey, legacyValue)
    localStorage.setItem(LEGACY_STORAGE_OWNER_KEY, scope)
    emitScopedStorageChange(baseKey, scope)
    return true
  } catch {
    return false
  }
}

export { DEFAULT_STORAGE_SCOPE }
