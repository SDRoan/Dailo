import { dateKey, todayKey, getAchievements, saveAchievements, getLastAchievementCheck, saveLastAchievementCheck } from './storage'
import { getStreak, getCompletionRate, getWeeklyCount } from './streaks'

/**
 * Dynamic Achievement Engine
 *
 * No pre-written achievements. Every achievement is generated from the user's
 * actual tracking data using randomized templates. There's no upper limit —
 * achievements scale infinitely with progress.
 */

// Seed-based pseudo-random so the same achievement always gets the same presentation
function seededRandom(seed) {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0
  }
  return () => {
    h = (h * 16807 + 0) % 2147483647
    return (h & 0x7fffffff) / 0x7fffffff
  }
}

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)]
}

// --- Achievement title/description generators by category ---

const STREAK_TITLES = [
  (n, habit) => `${n}-Day Flame on ${habit}`,
  (n, habit) => `Unstoppable: ${n} Days of ${habit}`,
  (n, habit) => `${habit} Machine — ${n} Days Running`,
  (n, habit) => `${n} Days Deep into ${habit}`,
  (n, habit) => `The ${habit} Chain: ${n} Links Strong`,
  (n, habit) => `${n} Days, Zero Excuses — ${habit}`,
  (n, habit) => `${habit} Streak Hit ${n}`,
  (n, habit) => `Locked In: ${n} Straight Days of ${habit}`,
  (n, habit) => `${habit} Veteran — ${n} Day Streak`,
  (n, habit) => `Day ${n} of Not Giving Up on ${habit}`,
]

const STREAK_DESCS = [
  (n, habit) => `You showed up for ${habit} ${n} days in a row. That's not luck, that's discipline.`,
  (n, habit) => `${n} consecutive days of ${habit}. Most people quit at day 3 — you didn't.`,
  (n, habit) => `A ${n}-day streak on ${habit}. You're building something real here.`,
  (n, habit) => `${n} days of consistent ${habit}. The compound effect is kicking in.`,
  (n, habit) => `You didn't miss ${habit} for ${n} days straight. That takes serious commitment.`,
]

const STREAK_EMOJIS = ['🔥', '⚡', '💪', '🏔️', '🎯', '🔗', '💎', '🌟', '🚀', '👑']

const CONSISTENCY_TITLES = [
  (rate, period) => `${rate}% ${period} Consistency`,
  (rate, period) => `${period} Powerhouse — ${rate}% Rate`,
  (rate, period) => `Almost Perfect ${period}: ${rate}%`,
  (rate, period) => `${rate}% Locked In This ${period}`,
  (rate, period) => `${period} Domination: ${rate}%`,
  (rate, period) => `${rate}% — The ${period} Was Yours`,
  (rate, period) => `Consistency King: ${rate}% ${period}`,
  (rate, period) => `${period} Report Card: ${rate}%`,
]

const CONSISTENCY_DESCS = [
  (rate, period) => `${rate}% completion rate this ${period.toLowerCase()}. You're showing what discipline looks like.`,
  (rate, period) => `This ${period.toLowerCase()} you hit ${rate}% of your goals. That's elite territory.`,
  (rate, period) => `A ${rate}% ${period.toLowerCase()} rate means you barely missed anything. Respect.`,
  (rate, period) => `${rate}% this ${period.toLowerCase()} — you're outperforming your past self.`,
]

const CONSISTENCY_EMOJIS = ['📊', '🎯', '💯', '📈', '🏆', '✨', '🌊', '🔋']

const VOLUME_TITLES = [
  (n) => `${n} Total Completions`,
  (n) => `${n} Check-Ins and Counting`,
  (n) => `The ${n} Club`,
  (n) => `${n} Times You Chose Discipline`,
  (n) => `Milestone: ${n} Completions`,
  (n) => `${n} Steps Toward Your Best Self`,
  (n) => `${n} Habits Crushed`,
  (n) => `You've Done This ${n} Times Now`,
]

const VOLUME_DESCS = [
  (n) => `${n} total habit completions. Each one is proof you're becoming who you want to be.`,
  (n) => `You've checked in ${n} times. That's ${n} decisions to show up.`,
  (n) => `${n} completions — most people don't even track once. You did it ${n} times.`,
  (n) => `Every single one of those ${n} completions rewired your brain a little more.`,
]

const VOLUME_EMOJIS = ['🏅', '🎖️', '⭐', '🌟', '💫', '🏋️', '📝', '✅']

const IMPROVEMENT_TITLES = [
  (pct) => `${pct}% Week-Over-Week Glow Up`,
  (pct) => `Leveled Up: +${pct}% This Week`,
  (pct) => `The Comeback: ${pct}% Improvement`,
  (pct) => `Rising Tide — ${pct}% Better Than Last Week`,
  (pct) => `+${pct}% Growth Arc Unlocked`,
  (pct) => `On the Rise: ${pct}% Jump`,
  (pct) => `This Week Hit Different — +${pct}%`,
]

const IMPROVEMENT_DESCS = [
  (pct, thisWeek, lastWeek) => `You went from ${lastWeek}% last week to ${thisWeek}% this week. That's a ${pct}% improvement — real growth.`,
  (pct) => `${pct}% better than last week. Small improvements compound into massive change.`,
  (pct) => `A ${pct}% jump this week. You're trending in the right direction.`,
  (pct, thisWeek) => `This week's ${thisWeek}% crushes last week. You're building momentum.`,
]

const IMPROVEMENT_EMOJIS = ['📈', '🆙', '🚀', '⬆️', '🌱', '💹', '🔝', '🌅']

const PERFECT_DAY_TITLES = [
  (n) => `${n} Perfect Days`,
  (n) => `Flawless ${n} — Every Habit, Every Day`,
  (n) => `${n} Days of 100% Completion`,
  (n) => `The ${n}-Day Clean Sweep`,
  (n) => `${n} Golden Days Earned`,
  (n) => `${n}× Everything Done`,
]

const PERFECT_DAY_DESCS = [
  (n) => `You completed every single habit on ${n} different days. That's what going all-in looks like.`,
  (n) => `${n} days where you didn't skip a single thing. That's next level.`,
  (n) => `Not ${n} average days — ${n} perfect days. There's a difference.`,
]

const PERFECT_DAY_EMOJIS = ['💯', '👑', '🏆', '✨', '🌟', '💎', '🎯']

const VARIETY_TITLES = [
  (n) => `Tracking ${n} Habits Strong`,
  (n) => `The ${n}-Habit Juggler`,
  (n) => `${n} Plates Spinning`,
  (n) => `Renaissance Mode: ${n} Habits`,
  (n) => `Life on ${n} Fronts`,
]

const VARIETY_DESCS = [
  (n) => `You're actively tracking ${n} habits. Most people struggle with 1. You're managing ${n}.`,
  (n) => `${n} habits in play at once. You're not just improving — you're transforming.`,
  (n) => `Balancing ${n} habits takes serious self-management. You're doing it.`,
]

const VARIETY_EMOJIS = ['🎨', '🧩', '🎪', '🌈', '🎭', '🔮']

const FOCUS_TITLES = [
  (mins) => `${mins} Minutes of Deep Focus`,
  (mins) => `${mins}-Minute Focus Beast`,
  (mins) => `Locked In for ${mins} Minutes`,
  (mins) => `${mins} Minutes in the Zone`,
  (mins) => `Focus Milestone: ${mins} Minutes`,
  (mins) => `The ${mins}-Minute Marathon`,
]

const FOCUS_DESCS = [
  (mins) => `${mins} total minutes of focused work. Your attention span is a superpower.`,
  (mins) => `You've spent ${mins} minutes in deep focus. That's ${Math.round(mins / 60)} hours of pure work.`,
  (mins) => `${mins} minutes of distraction-free focus. Your future self thanks you.`,
]

const FOCUS_EMOJIS = ['🧠', '⏱️', '🎯', '🔬', '💡', '⚡', '🌀']

const TASK_TITLES = [
  (n) => `${n} Tasks Conquered`,
  (n) => `Task Slayer: ${n} Done`,
  (n) => `${n} Tasks Checked Off`,
  (n) => `${n} Things That Got Done`,
  (n) => `Productivity Score: ${n} Tasks`,
]

const TASK_DESCS = [
  (n) => `${n} daily tasks completed. You don't just track habits — you get things done.`,
  (n) => `${n} tasks done. That's ${n} fewer things on your plate, handled by you.`,
]

const TASK_EMOJIS = ['📋', '✅', '📌', '🗂️', '⚡', '🎯']

const WEEKEND_TITLES = [
  () => `Weekend Warrior`,
  () => `No Days Off — Even Weekends`,
  () => `Saturday & Sunday? Still Locked In`,
  () => `Weekend Grinder`,
  () => `The Weekend Doesn't Stop You`,
]

const WEEKEND_DESCS = [
  (n) => `You completed habits on ${n} weekend days recently. Most people slack on weekends. Not you.`,
  (n) => `${n} weekend days with habit completions. The grind doesn't take breaks.`,
]

const WEEKEND_EMOJIS = ['🌅', '💪', '🏖️', '⚡', '🔥']

const EARLY_BIRD_TITLES = [
  () => `Early Bird Gets It Done`,
  () => `Morning Person Verified`,
  () => `Dawn Crusher`,
  () => `Habits Before Most People Wake Up`,
]

const EARLY_BIRD_DESCS = [
  (n) => `${n} habits completed before noon recently. You don't procrastinate — you attack the day.`,
  (n) => `${n} morning completions. Getting it done early means the rest of the day is a bonus.`,
]

const EARLY_BIRD_EMOJIS = ['🌅', '☀️', '🐦', '⏰', '🌄']

// --- Data analysis functions ---

function getDateNDaysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return dateKey(d)
}

function getDatesInRange(startKey, endKey) {
  const dates = []
  const [sy, sm, sd] = startKey.split('-').map(Number)
  const [ey, em, ed] = endKey.split('-').map(Number)
  const start = new Date(sy, sm - 1, sd)
  const end = new Date(ey, em - 1, ed)
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(dateKey(d))
  }
  return dates
}

function countTotalCompletions(completions) {
  let total = 0
  for (const habitId of Object.keys(completions)) {
    for (const dk of Object.keys(completions[habitId])) {
      if (completions[habitId][dk]) total++
    }
  }
  return total
}

function countPerfectDays(habits, completions, timeSpent, days) {
  if (habits.length === 0) return 0
  let count = 0
  for (const d of days) {
    const allDone = habits.every(
      h => !!(completions[h.id] || {})[d] || ((timeSpent[h.id] || {})[d] || 0) > 0
    )
    if (allDone) count++
  }
  return count
}

function countWeekendCompletions(completions, days) {
  let count = 0
  for (const d of days) {
    const [y, m, day] = d.split('-').map(Number)
    const dow = new Date(y, m - 1, day).getDay()
    if (dow === 0 || dow === 6) {
      for (const habitId of Object.keys(completions)) {
        if ((completions[habitId] || {})[d]) count++
      }
    }
  }
  return count
}

function countEarlyCompletions(completionTimes, days) {
  let count = 0
  for (const habitId of Object.keys(completionTimes)) {
    for (const d of days) {
      const ts = (completionTimes[habitId] || {})[d]
      if (ts) {
        const hour = new Date(ts).getHours()
        if (hour < 12) count++
      }
    }
  }
  return count
}

function countTotalTasks(tasks) {
  let total = 0
  for (const dk of Object.keys(tasks)) {
    total += (tasks[dk] || []).filter(t => t.completed).length
  }
  return total
}

function getTotalFocusMinutes(focusMinutes) {
  let total = 0
  for (const dk of Object.keys(focusMinutes)) {
    total += focusMinutes[dk] || 0
  }
  return total
}

// --- Achievement generation ---

function generateAchievementId(category, key) {
  return `${category}::${key}`
}

function buildAchievement(id, category, titleTemplates, descTemplates, emojis, titleArgs, descArgs) {
  const rng = seededRandom(id)
  const title = pick(titleTemplates, rng)(...titleArgs)
  const desc = pick(descTemplates, rng)(...descArgs)
  const emoji = pick(emojis, rng)
  return { id, title, description: desc, emoji, category, earnedAt: new Date().toISOString() }
}

// Streak milestones: 3, 5, 7, 10, 14, 21, 30, 50, 75, 100, then every 50
function getStreakMilestones(streak) {
  const fixed = [3, 5, 7, 10, 14, 21, 30, 50, 75, 100]
  const milestones = fixed.filter(m => streak >= m)
  if (streak > 100) {
    for (let m = 150; m <= streak; m += 50) {
      milestones.push(m)
    }
  }
  return milestones
}

// Volume milestones: 10, 25, 50, 100, 200, 300, 500, 750, 1000, then every 500
function getVolumeMilestones(count) {
  const fixed = [10, 25, 50, 100, 200, 300, 500, 750, 1000]
  const milestones = fixed.filter(m => count >= m)
  if (count > 1000) {
    for (let m = 1500; m <= count; m += 500) {
      milestones.push(m)
    }
  }
  return milestones
}

// Focus milestones: 30, 60, 120, 300, 600, 1000, then every 500
function getFocusMilestones(mins) {
  const fixed = [30, 60, 120, 300, 600, 1000]
  const milestones = fixed.filter(m => mins >= m)
  if (mins > 1000) {
    for (let m = 1500; m <= mins; m += 500) {
      milestones.push(m)
    }
  }
  return milestones
}

// Task milestones: 5, 10, 25, 50, 100, 200, then every 100
function getTaskMilestones(count) {
  const fixed = [5, 10, 25, 50, 100, 200]
  const milestones = fixed.filter(m => count >= m)
  if (count > 200) {
    for (let m = 300; m <= count; m += 100) {
      milestones.push(m)
    }
  }
  return milestones
}

// Perfect day milestones: 1, 3, 5, 7, 10, 15, 20, 30, then every 10
function getPerfectDayMilestones(count) {
  const fixed = [1, 3, 5, 7, 10, 15, 20, 30]
  const milestones = fixed.filter(m => count >= m)
  if (count > 30) {
    for (let m = 40; m <= count; m += 10) {
      milestones.push(m)
    }
  }
  return milestones
}

/**
 * Main function: analyze all tracking data and generate new achievements.
 * Returns { newAchievements: [], allAchievements: [] }
 */
export function checkForNewAchievements({ habits, completions, timeSpent, tasks, completionTimes, focusMinutes }) {
  const existing = getAchievements()
  const existingIds = new Set(existing.map(a => a.id))
  const newAchievements = []

  const today = todayKey()
  const last30 = getDatesInRange(getDateNDaysAgo(29), today)
  const last7 = getDatesInRange(getDateNDaysAgo(6), today)
  const prev7 = getDatesInRange(getDateNDaysAgo(13), getDateNDaysAgo(7))

  // Build completion dates per habit
  const completionDatesByHabit = {}
  for (const h of habits) {
    const byComp = completions[h.id] || {}
    const fromComp = Object.keys(byComp).filter(d => byComp[d])
    const byTime = timeSpent[h.id] || {}
    const fromTime = Object.keys(byTime).filter(d => (byTime[d] || 0) > 0)
    completionDatesByHabit[h.id] = [...new Set([...fromComp, ...fromTime])]
  }

  function tryAdd(achievement) {
    if (!existingIds.has(achievement.id)) {
      newAchievements.push(achievement)
      existingIds.add(achievement.id)
    }
  }

  // 1. STREAK ACHIEVEMENTS (per habit, no limit)
  for (const h of habits) {
    const streak = getStreak(completionDatesByHabit[h.id] || [])
    const milestones = getStreakMilestones(streak)
    for (const m of milestones) {
      const id = generateAchievementId('streak', `${h.id}::${m}`)
      tryAdd(buildAchievement(id, 'streak', STREAK_TITLES, STREAK_DESCS, STREAK_EMOJIS, [m, h.name], [m, h.name]))
    }
  }

  // 2. CONSISTENCY ACHIEVEMENTS (weekly & monthly rates)
  if (habits.length > 0) {
    const weeklyRate = Math.round(
      habits.reduce((sum, h) => sum + getCompletionRate(completionDatesByHabit[h.id] || [], 7), 0) / habits.length
    )
    const monthlyRate = Math.round(
      habits.reduce((sum, h) => sum + getCompletionRate(completionDatesByHabit[h.id] || [], 30), 0) / habits.length
    )

    // Weekly consistency at thresholds: 50, 70, 80, 90, 100
    for (const threshold of [50, 70, 80, 90, 100]) {
      if (weeklyRate >= threshold) {
        const id = generateAchievementId('consistency', `weekly::${threshold}::${todayKey()}`)
        // Only one weekly consistency per week (use week start as part of ID)
        const weekStart = getDateNDaysAgo(6)
        const weekId = generateAchievementId('consistency', `weekly::${threshold}::${weekStart}`)
        tryAdd(buildAchievement(weekId, 'consistency', CONSISTENCY_TITLES, CONSISTENCY_DESCS, CONSISTENCY_EMOJIS, [threshold, 'Week'], [threshold, 'Week']))
      }
    }

    // Monthly consistency at thresholds
    for (const threshold of [50, 70, 80, 90, 100]) {
      if (monthlyRate >= threshold) {
        const monthKey = todayKey().slice(0, 7) // YYYY-MM
        const monthId = generateAchievementId('consistency', `monthly::${threshold}::${monthKey}`)
        tryAdd(buildAchievement(monthId, 'consistency', CONSISTENCY_TITLES, CONSISTENCY_DESCS, CONSISTENCY_EMOJIS, [threshold, 'Month'], [threshold, 'Month']))
      }
    }
  }

  // 3. VOLUME ACHIEVEMENTS (total completions, no limit)
  const totalCompletions = countTotalCompletions(completions)
  for (const m of getVolumeMilestones(totalCompletions)) {
    const id = generateAchievementId('volume', `${m}`)
    tryAdd(buildAchievement(id, 'volume', VOLUME_TITLES, VOLUME_DESCS, VOLUME_EMOJIS, [m], [m]))
  }

  // 4. IMPROVEMENT ACHIEVEMENTS (week-over-week growth)
  if (habits.length > 0) {
    const thisWeekRate = Math.round(
      habits.reduce((sum, h) => sum + getCompletionRate(completionDatesByHabit[h.id] || [], 7), 0) / habits.length
    )
    // Calculate last week's rate manually
    const prevWeekCompletions = {}
    for (const h of habits) {
      let count = 0
      const dates = completionDatesByHabit[h.id] || []
      const dateSet = new Set(dates)
      for (const d of prev7) {
        if (dateSet.has(d)) count++
      }
      prevWeekCompletions[h.id] = Math.round((count / 7) * 100)
    }
    const lastWeekRate = Math.round(
      habits.reduce((sum, h) => sum + (prevWeekCompletions[h.id] || 0), 0) / habits.length
    )

    const improvement = thisWeekRate - lastWeekRate
    if (improvement >= 10 && lastWeekRate > 0) {
      const weekStart = getDateNDaysAgo(6)
      for (const threshold of [10, 20, 30, 40, 50]) {
        if (improvement >= threshold) {
          const id = generateAchievementId('improvement', `${threshold}::${weekStart}`)
          tryAdd(buildAchievement(id, 'improvement', IMPROVEMENT_TITLES, IMPROVEMENT_DESCS, IMPROVEMENT_EMOJIS,
            [threshold], [threshold, thisWeekRate, lastWeekRate]))
        }
      }
    }
  }

  // 5. PERFECT DAY ACHIEVEMENTS
  const perfectDays = countPerfectDays(habits, completions, timeSpent, last30)
  for (const m of getPerfectDayMilestones(perfectDays)) {
    const id = generateAchievementId('perfect', `${m}`)
    tryAdd(buildAchievement(id, 'perfect', PERFECT_DAY_TITLES, PERFECT_DAY_DESCS, PERFECT_DAY_EMOJIS, [m], [m]))
  }

  // 6. VARIETY ACHIEVEMENTS (number of active habits)
  const activeHabits = habits.filter(h => {
    const dates = completionDatesByHabit[h.id] || []
    return dates.some(d => last7.includes(d))
  }).length
  for (const threshold of [3, 5, 7, 10, 15]) {
    if (activeHabits >= threshold) {
      const id = generateAchievementId('variety', `${threshold}`)
      tryAdd(buildAchievement(id, 'variety', VARIETY_TITLES, VARIETY_DESCS, VARIETY_EMOJIS, [threshold], [threshold]))
    }
  }

  // 7. FOCUS ACHIEVEMENTS (total focus minutes, no limit)
  const totalFocus = getTotalFocusMinutes(focusMinutes || {})
  for (const m of getFocusMilestones(totalFocus)) {
    const id = generateAchievementId('focus', `${m}`)
    tryAdd(buildAchievement(id, 'focus', FOCUS_TITLES, FOCUS_DESCS, FOCUS_EMOJIS, [m], [m]))
  }

  // 8. TASK ACHIEVEMENTS (completed tasks, no limit)
  const totalTasksDone = countTotalTasks(tasks || {})
  for (const m of getTaskMilestones(totalTasksDone)) {
    const id = generateAchievementId('tasks', `${m}`)
    tryAdd(buildAchievement(id, 'tasks', TASK_TITLES, TASK_DESCS, TASK_EMOJIS, [m], [m]))
  }

  // 9. WEEKEND WARRIOR ACHIEVEMENTS
  const weekendCount = countWeekendCompletions(completions, last30)
  for (const threshold of [5, 10, 20, 30, 50]) {
    if (weekendCount >= threshold) {
      const monthKey = todayKey().slice(0, 7)
      const id = generateAchievementId('weekend', `${threshold}::${monthKey}`)
      tryAdd(buildAchievement(id, 'weekend', WEEKEND_TITLES, WEEKEND_DESCS, WEEKEND_EMOJIS, [], [threshold]))
    }
  }

  // 10. EARLY BIRD ACHIEVEMENTS
  const earlyCount = countEarlyCompletions(completionTimes || {}, last7)
  for (const threshold of [3, 5, 7, 10]) {
    if (earlyCount >= threshold) {
      const weekStart = getDateNDaysAgo(6)
      const id = generateAchievementId('earlybird', `${threshold}::${weekStart}`)
      tryAdd(buildAchievement(id, 'earlybird', EARLY_BIRD_TITLES, EARLY_BIRD_DESCS, EARLY_BIRD_EMOJIS, [], [threshold]))
    }
  }

  // Save all achievements
  if (newAchievements.length > 0) {
    const all = [...existing, ...newAchievements]
    saveAchievements(all)
    saveLastAchievementCheck(today)
    return { newAchievements, allAchievements: all }
  }

  saveLastAchievementCheck(today)
  return { newAchievements: [], allAchievements: existing }
}

/** Get achievement stats for display */
export function getAchievementStats() {
  const achievements = getAchievements()
  const categories = {}
  for (const a of achievements) {
    categories[a.category] = (categories[a.category] || 0) + 1
  }
  return {
    total: achievements.length,
    categories,
    latest: achievements.slice(-5).reverse(),
  }
}
