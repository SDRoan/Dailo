import { dateKey, todayKey } from './storage'

const AI_COACH_SNAPSHOT_KEY = 'habitloop_ai_coach_snapshot'
const WEEKDAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const WEEKDAY_FROM_JS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function safeParseJson(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function getCoachSnapshot() {
  if (typeof window === 'undefined') return null
  return safeParseJson(localStorage.getItem(AI_COACH_SNAPSHOT_KEY), null)
}

export function saveCoachSnapshot(snapshot) {
  if (typeof window === 'undefined') return
  if (!snapshot) {
    localStorage.removeItem(AI_COACH_SNAPSHOT_KEY)
    return
  }
  localStorage.setItem(AI_COACH_SNAPSHOT_KEY, JSON.stringify(snapshot))
}

export function clearCoachSnapshot() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AI_COACH_SNAPSHOT_KEY)
}

export function getRecentDateKeys(days = 21, endDateKey = todayKey()) {
  const [y, m, d] = endDateKey.split('-').map(Number)
  const end = new Date(y, m - 1, d)
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(end)
    day.setDate(end.getDate() - i)
    out.push(dateKey(day))
  }
  return out
}

function toDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function percent(done, total) {
  if (!total) return 0
  return Math.round((done / total) * 100)
}

function average(values) {
  if (!values.length) return 0
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
}

function getStreakStats(daily) {
  let currentStreak = 0
  for (let i = daily.length - 1; i >= 0; i--) {
    if (daily[i].done) currentStreak += 1
    else break
  }

  let longestStreak = 0
  let streak = 0
  let longestMissRun = 0
  let missRun = 0
  daily.forEach((entry) => {
    if (entry.done) {
      streak += 1
      missRun = 0
    } else {
      missRun += 1
      streak = 0
    }
    if (streak > longestStreak) longestStreak = streak
    if (missRun > longestMissRun) longestMissRun = missRun
  })

  const last7 = daily.slice(-7)
  const prev7 = daily.slice(-14, -7)
  const doneLast7 = last7.filter((d) => d.done).length
  const donePrev7 = prev7.filter((d) => d.done).length
  const rateLast7Pct = percent(doneLast7, last7.length)
  const ratePrev7Pct = percent(donePrev7, prev7.length)
  const trendPctPoints = prev7.length > 0 ? rateLast7Pct - ratePrev7Pct : null

  const weekdayStatsMap = {
    Mon: { done: 0, total: 0 },
    Tue: { done: 0, total: 0 },
    Wed: { done: 0, total: 0 },
    Thu: { done: 0, total: 0 },
    Fri: { done: 0, total: 0 },
    Sat: { done: 0, total: 0 },
    Sun: { done: 0, total: 0 },
  }
  daily.forEach((entry) => {
    const weekday = WEEKDAY_FROM_JS[toDate(entry.date).getDay()]
    const bucket = weekdayStatsMap[weekday]
    bucket.total += 1
    if (entry.done) bucket.done += 1
  })
  const weekdayStats = WEEKDAY_ORDER.map((weekday) => {
    const row = weekdayStatsMap[weekday]
    return {
      weekday,
      done: row.done,
      total: row.total,
      ratePct: percent(row.done, row.total),
    }
  })
  const weekdayCandidates = weekdayStats.filter((w) => w.total > 0)
  const strongestWeekday = weekdayCandidates.length
    ? weekdayCandidates.reduce((best, row) => (row.ratePct > best.ratePct ? row : best), weekdayCandidates[0])
    : null
  const weakestWeekday = weekdayCandidates.length
    ? weekdayCandidates.reduce((worst, row) => (row.ratePct < worst.ratePct ? row : worst), weekdayCandidates[0])
    : null

  return {
    currentStreak,
    longestStreak,
    longestMissRun,
    doneLast7,
    donePrev7,
    rateLast7Pct,
    ratePrev7Pct,
    trendPctPoints,
    weekdayStats,
    strongestWeekday,
    weakestWeekday,
  }
}

export function buildCoachPayload({
  habits,
  completions,
  timeSpent,
  tasks,
  ifThenPlans,
  today,
  windowDays = 21,
}) {
  const dates = getRecentDateKeys(windowDays, today)
  const habitsPayload = habits.map((habit) => {
    const byCompletion = completions[habit.id] || {}
    const byTime = timeSpent[habit.id] || {}
    const daily = dates.map((date) => {
      const minutes = byTime[date] || 0
      const done = !!byCompletion[date] || minutes > 0
      return { date, done, minutes }
    })
    const doneDays = daily.filter((d) => d.done).length
    const lastDone = [...daily].reverse().find((d) => d.done)?.date || null
    const stats = getStreakStats(daily)
    return {
      habitId: habit.id,
      name: habit.name,
      goalPerWeek: habit.goal ?? null,
      ifThenPlan: ifThenPlans[habit.id] || null,
      doneDays,
      completionRatePct: dates.length ? Math.round((doneDays / dates.length) * 100) : 0,
      lastDoneDate: lastDone,
      stats,
      daily,
    }
  })

  const tasksSummary = dates.map((date) => {
    const list = tasks[date] || []
    return {
      date,
      total: list.length,
      completed: list.filter((task) => task.completed).length,
    }
  })

  const taskLast7 = tasksSummary.slice(-7)
  const taskTotalLast7 = taskLast7.reduce((sum, d) => sum + d.total, 0)
  const taskCompletedLast7 = taskLast7.reduce((sum, d) => sum + d.completed, 0)
  const habitRates = habitsPayload.map((h) => h.completionRatePct)
  const trendPoints = habitsPayload
    .map((h) => h.stats?.trendPctPoints)
    .filter((v) => Number.isFinite(v))

  return {
    today,
    windowDays,
    dates,
    habits: habitsPayload,
    tasks: tasksSummary,
    overall: {
      habitCount: habits.length,
      averageCompletionRatePct: average(habitRates),
      averageTrendPctPoints: trendPoints.length ? average(trendPoints) : null,
      taskCompletionRateLast7Pct: percent(taskCompletedLast7, taskTotalLast7),
      taskLoadLast7: taskTotalLast7,
      generatedAt: new Date().toISOString(),
    },
  }
}

function normalizeString(v, fallback = '') {
  return typeof v === 'string' ? v.trim() : fallback
}

function normalizeNumber(v, fallback = null) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function normalizeDiagnosisRow(row) {
  return {
    pattern: normalizeString(row?.pattern),
    evidence: normalizeString(row?.evidence),
    impact: normalizeString(row?.impact),
  }
}

function normalizeIfThenRow(row) {
  return {
    habit: normalizeString(row?.habit),
    cue: normalizeString(row?.cue),
    action: normalizeString(row?.action),
    why: normalizeString(row?.why),
  }
}

function normalizeFallbackRow(row) {
  return {
    habit: normalizeString(row?.habit),
    minimumAction: normalizeString(row?.minimumAction || row?.minimum_action),
    resetRule: normalizeString(row?.resetRule || row?.reset_rule),
  }
}

function normalizeTopHabitRow(row) {
  return {
    habit: normalizeString(row?.habit),
    reason: normalizeString(row?.reason),
    focusScore: normalizeNumber(row?.focusScore || row?.focus_score),
  }
}

function normalizeTodayPlanRow(row) {
  return {
    timeWindow: normalizeString(row?.timeWindow || row?.time_window),
    step: normalizeString(row?.step),
    purpose: normalizeString(row?.purpose),
  }
}

function normalizeWeeklyExperiment(raw) {
  if (typeof raw === 'string') {
    const hypothesis = normalizeString(raw)
    if (!hypothesis) return null
    return {
      name: 'Weekly experiment',
      hypothesis,
      execution: '',
      successMetric: '',
    }
  }
  if (!raw || typeof raw !== 'object') return null
  const name = normalizeString(raw.name || raw.title, 'Weekly experiment')
  const hypothesis = normalizeString(raw.hypothesis)
  const execution = normalizeString(raw.execution || raw.steps)
  const successMetric = normalizeString(raw.successMetric || raw.success_metric)
  if (!hypothesis && !execution && !successMetric) return null
  return { name, hypothesis, execution, successMetric }
}

function ensureDiagnosticDepth(rows) {
  if (rows.length > 0) return rows
  return [
    {
      pattern: 'Not enough consistent history yet',
      evidence: 'Track at least 10-14 days for stronger pattern detection.',
      impact: 'Early-stage coaching can still focus on consistency scaffolding.',
    },
  ]
}

function ensureSummaryDepth(summary, diagnosis) {
  if (summary && summary.length >= 80) return summary
  const first = diagnosis[0]
  if (!first) return 'Build one repeatable daily cue, then protect it for 7 days before increasing intensity.'
  return `${first.pattern}. ${first.evidence}. ${first.impact}`
}

function ensureTodayPlanRows(rows) {
  if (rows.length > 0) return rows
  return [
    {
      timeWindow: 'Morning',
      step: 'Complete one minimum viable version of your top habit within 30 minutes of your first cue.',
      purpose: 'Build momentum before decision fatigue appears.',
    },
  ]
}

function ensureWeeklyExperiment(exp) {
  if (exp) return exp
  return {
    name: 'Consistency lock-in',
    hypothesis: 'Reducing start friction will increase completion rate this week.',
    execution: 'Prepare your habit environment the night before for 7 days.',
    successMetric: 'Increase 7-day completion by at least 10 percentage points.',
  }
}

export function normalizeCoachInsight(raw) {
  const diagnosis = Array.isArray(raw?.diagnosis)
    ? raw.diagnosis.map(normalizeDiagnosisRow).filter((x) => x.pattern && x.evidence && x.impact)
    : []
  const topHabits = Array.isArray(raw?.topHabits)
    ? raw.topHabits.map(normalizeTopHabitRow).filter((x) => x.habit)
    : []
  const ifThenSuggestions = Array.isArray(raw?.ifThenSuggestions)
    ? raw.ifThenSuggestions.map(normalizeIfThenRow).filter((x) => x.habit && x.cue && x.action)
    : []
  const fallbackPlans = Array.isArray(raw?.fallbackPlans)
    ? raw.fallbackPlans.map(normalizeFallbackRow).filter((x) => x.habit && x.minimumAction)
    : []
  const todayPlan = Array.isArray(raw?.todayPlan)
    ? raw.todayPlan.map(normalizeTodayPlanRow).filter((x) => x.timeWindow && x.step)
    : []

  const safeDiagnosis = ensureDiagnosticDepth(diagnosis)
  const weeklyExperiment = normalizeWeeklyExperiment(raw?.weeklyExperiment || raw?.weekly_experiment)
  return {
    summary: ensureSummaryDepth(normalizeString(raw?.summary), safeDiagnosis),
    diagnosis: safeDiagnosis,
    topHabits,
    ifThenSuggestions,
    fallbackPlans,
    todayPlan: ensureTodayPlanRows(todayPlan),
    weeklyExperiment: ensureWeeklyExperiment(weeklyExperiment),
  }
}

export async function requestCoachAdvice(payload) {
  const response = await fetch('/api/coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  let body = {}
  try {
    body = await response.json()
  } catch {
    body = {}
  }

  if (!response.ok) {
    const message = body?.error || `AI request failed (${response.status})`
    throw new Error(message)
  }

  const insight = normalizeCoachInsight(body?.insight || {})
  return insight
}
