import { REMINDERS_STORAGE_KEY, getReminderStore, replaceReminderStore } from './reminders'
import {
  STORAGE_KEYS,
  getAchievements,
  getCompletionTimes,
  getCompletions,
  getFocusMinutes,
  getFocusSession,
  getHabits,
  getIfThenPlans,
  getLastAchievementCheck,
  getTasks,
  getTimeSpent,
  saveAchievements,
  saveCompletionTimes,
  saveCompletions,
  saveFocusMinutes,
  saveFocusSession,
  saveHabits,
  saveIfThenPlans,
  saveLastAchievementCheck,
  saveTasks,
  saveTimeSpent,
} from './storage'
import { supabase } from './supabase'
import { readScopedStorage, removeScopedStorageWithOptions, writeScopedStorageWithOptions } from './storageScope'

const USER_APP_STATE_TABLE = 'user_app_state'

function parseJSON(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function getLocalAppStateSnapshot() {
  return {
    version: 1,
    habits: getHabits(),
    completions: getCompletions(),
    timeSpent: getTimeSpent(),
    tasks: getTasks(),
    completionTimes: getCompletionTimes(),
    ifThenPlans: getIfThenPlans(),
    focusMinutes: getFocusMinutes(),
    focusSession: getFocusSession(),
    achievements: getAchievements(),
    achievementsLastCheck: getLastAchievementCheck(),
    reminders: getReminderStore(),
  }
}

export function applyLocalAppStateSnapshot(snapshot = {}) {
  saveHabits(snapshot.habits || [])
  saveCompletions(snapshot.completions || {})
  saveTimeSpent(snapshot.timeSpent || {})
  saveTasks(snapshot.tasks || {})
  saveCompletionTimes(snapshot.completionTimes || {})
  saveIfThenPlans(snapshot.ifThenPlans || {})
  saveFocusMinutes(snapshot.focusMinutes || {})
  saveFocusSession(snapshot.focusSession || null)
  saveAchievements(snapshot.achievements || [])
  saveLastAchievementCheck(snapshot.achievementsLastCheck || '')
  replaceReminderStore(snapshot.reminders || {}, { silent: true })
}

export function applyLocalAppStateSnapshotSilently(snapshot = {}) {
  writeScopedStorageWithOptions(STORAGE_KEYS.habits, JSON.stringify(snapshot.habits || []), { silent: true })
  writeScopedStorageWithOptions(STORAGE_KEYS.completions, JSON.stringify(snapshot.completions || {}), { silent: true })
  writeScopedStorageWithOptions(STORAGE_KEYS.timeSpent, JSON.stringify(snapshot.timeSpent || {}), { silent: true })
  writeScopedStorageWithOptions(STORAGE_KEYS.tasks, JSON.stringify(snapshot.tasks || {}), { silent: true })
  writeScopedStorageWithOptions(STORAGE_KEYS.completionTimes, JSON.stringify(snapshot.completionTimes || {}), { silent: true })
  writeScopedStorageWithOptions(STORAGE_KEYS.ifThenPlans, JSON.stringify(snapshot.ifThenPlans || {}), { silent: true })
  writeScopedStorageWithOptions(STORAGE_KEYS.focusMinutes, JSON.stringify(snapshot.focusMinutes || {}), { silent: true })

  if (snapshot.focusSession) {
    writeScopedStorageWithOptions(STORAGE_KEYS.focusSession, JSON.stringify(snapshot.focusSession), { silent: true })
  } else {
    removeScopedStorageWithOptions(STORAGE_KEYS.focusSession, { silent: true })
  }

  writeScopedStorageWithOptions(STORAGE_KEYS.achievements, JSON.stringify(snapshot.achievements || []), { silent: true })

  if (snapshot.achievementsLastCheck) {
    writeScopedStorageWithOptions(STORAGE_KEYS.achievementsCheck, snapshot.achievementsLastCheck, { silent: true })
  } else {
    removeScopedStorageWithOptions(STORAGE_KEYS.achievementsCheck, { silent: true })
  }

  writeScopedStorageWithOptions(
    REMINDERS_STORAGE_KEY,
    JSON.stringify({
      times: snapshot.reminders?.times || {},
      lastNotified: snapshot.reminders?.lastNotified || {},
      lastCheckedAt: Number(snapshot.reminders?.lastCheckedAt) || 0,
    }),
    { silent: true },
  )
}

export async function fetchRemoteAppState(userId) {
  if (!supabase || !userId) return { state: null, error: null }

  const { data, error } = await supabase
    .from(USER_APP_STATE_TABLE)
    .select('state')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) return { state: null, error }
  return { state: data?.state || null, error: null }
}

export async function saveRemoteAppState(userId, state) {
  if (!supabase || !userId) return { error: null }

  const { error } = await supabase
    .from(USER_APP_STATE_TABLE)
    .upsert(
      {
        user_id: userId,
        state,
      },
      { onConflict: 'user_id' },
    )

  return { error }
}

export async function hydrateLocalStateFromCloud(userId) {
  const { state, error } = await fetchRemoteAppState(userId)
  if (error) return { didHydrate: false, didSeed: false, error }

  if (state) {
    applyLocalAppStateSnapshotSilently(state)
    return { didHydrate: true, didSeed: false, error: null }
  }

  const localState = getLocalAppStateSnapshot()
  const hasMeaningfulLocalData = [
    localState.habits.length,
    localState.achievements.length,
    Object.keys(localState.completions).length,
    Object.keys(localState.tasks).length,
    Object.keys(localState.timeSpent).length,
    Object.keys(localState.focusMinutes).length,
  ].some(Boolean)

  if (!hasMeaningfulLocalData) {
    return { didHydrate: false, didSeed: false, error: null }
  }

  const { error: saveError } = await saveRemoteAppState(userId, localState)
  return { didHydrate: false, didSeed: !saveError, error: saveError || null }
}

export function readRawRemoteSeedPreview() {
  return {
    habits: parseJSON(readScopedStorage(STORAGE_KEYS.habits), []),
    completions: parseJSON(readScopedStorage(STORAGE_KEYS.completions), {}),
  }
}
