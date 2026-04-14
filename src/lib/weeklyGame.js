import { dateKey } from './storage'

export const LEAGUE_TIERS = [
  { minXp: 0, name: 'Rookie', accent: '#94a3b8' },
  { minXp: 180, name: 'Bronze', accent: '#fb923c' },
  { minXp: 360, name: 'Silver', accent: '#cbd5e1' },
  { minXp: 580, name: 'Gold', accent: '#facc15' },
  { minXp: 840, name: 'Platinum', accent: '#67e8f9' },
  { minXp: 1120, name: 'Diamond', accent: '#60a5fa' },
  { minXp: 1460, name: 'Ascendant', accent: '#c084fc' },
  { minXp: 1840, name: 'Mythic', accent: '#f472b6' },
]

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

function roundToNearestFive(value) {
  return Math.max(5, Math.round(value / 5) * 5)
}

function getWeekSeedKey(anchorDateValue = new Date()) {
  const date = new Date(anchorDateValue)
  const day = date.getDay()
  const daysFromMonday = (day + 6) % 7
  date.setDate(date.getDate() - daysFromMonday)
  return dateKey(date)
}

function hashString(input) {
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createSeededRandom(seedInput) {
  let state = hashString(String(seedInput)) || 1
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

function pick(rng, items) {
  return items[Math.floor(rng() * items.length)]
}

function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min
}

function shuffleWithRandom(items, rng) {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

function buildQuestReward(rng, base) {
  return roundToNearestFive(base + randomInt(rng, 0, 15))
}

function buildQuestId(weekKey, family, slot, target) {
  return `${weekKey}:${family}:${slot}:${target}`
}

export function getRollingDateKeys(days = 7, offsetDays = 0) {
  const end = new Date()
  end.setDate(end.getDate() - offsetDays)
  const out = []
  for (let index = days - 1; index >= 0; index -= 1) {
    const current = new Date(end)
    current.setDate(end.getDate() - index)
    out.push(dateKey(current))
  }
  return out
}

function getWeekDateKeys(spanDays = 7, offsetWeeks = 0, anchorDateValue = new Date()) {
  const date = new Date(anchorDateValue)
  const day = date.getDay()
  const daysFromMonday = (day + 6) % 7
  date.setDate(date.getDate() - daysFromMonday - offsetWeeks * 7)

  return Array.from({ length: spanDays }, (_, index) => {
    const current = new Date(date)
    current.setDate(date.getDate() + index)
    return dateKey(current)
  })
}

function getTaskActivityDates(tasks) {
  return Object.entries(tasks || {}).reduce((dates, [day, list]) => {
    if ((list || []).some((task) => task.completed)) dates.push(day)
    return dates
  }, [])
}

function getFocusActivityDates(focusMinutes) {
  return Object.entries(focusMinutes || {}).reduce((dates, [day, minutes]) => {
    if ((minutes || 0) > 0) dates.push(day)
    return dates
  }, [])
}

function countCompletedTasksForDates(tasks, dates) {
  return dates.reduce((sum, day) => sum + ((tasks?.[day] || []).filter((task) => task.completed).length), 0)
}

function countActiveTaskDays(tasks, dates) {
  return dates.reduce((sum, day) => sum + ((tasks?.[day] || []).some((task) => task.completed) ? 1 : 0), 0)
}

function countPerfectDays(habits, completionDatesByHabit, dates) {
  if (!habits.length) return 0

  return dates.reduce((sum, day) => {
    const allDone = habits.every((habit) => (completionDatesByHabit[habit.id] || []).includes(day))
    return sum + (allDone ? 1 : 0)
  }, 0)
}

function countEarlyCompletions(completionTimes, dates) {
  const dateSet = new Set(dates)
  return Object.values(completionTimes || {}).reduce((sum, byDate) => {
    return (
      sum +
      Object.entries(byDate || {}).reduce((inner, [day, timestamp]) => {
        if (!dateSet.has(day)) return inner
        return inner + (new Date(timestamp).getHours() < 12 ? 1 : 0)
      }, 0)
    )
  }, 0)
}

function countWeekendActivity(days) {
  return days.filter((day) => {
    const [year, month, date] = day.split('-').map(Number)
    const dayOfWeek = new Date(year, month - 1, date).getDay()
    return dayOfWeek === 0 || dayOfWeek === 6
  }).length
}

function getTrailingStreak(activityDates, anchorDateValue = new Date()) {
  const set = new Set(activityDates || [])
  let streak = 0
  const cursor = new Date(anchorDateValue)

  while (set.has(dateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

function getLeagueForXp(xp) {
  const index = LEAGUE_TIERS.findLastIndex((tier) => xp >= tier.minXp)
  const current = LEAGUE_TIERS[Math.max(index, 0)]
  const next = LEAGUE_TIERS[Math.min(LEAGUE_TIERS.length - 1, Math.max(index, 0) + 1)]
  const hasNext = next !== current
  const progressBase = current.minXp
  const progressSpan = hasNext ? next.minXp - current.minXp : 1
  const progress = hasNext ? clamp(Math.round(((xp - progressBase) / progressSpan) * 100)) : 100

  return {
    current,
    next: hasNext ? next : null,
    progress,
    xpToNext: hasNext ? next.minXp - xp : 0,
  }
}

function buildRandomQuestDefinitions({ anchorDateValue = new Date(), seasonSeed = 'local' }) {
  const weekKey = getWeekSeedKey(anchorDateValue)
  const rng = createSeededRandom(`${seasonSeed}:${weekKey}:quest-roll`)

  const questFactories = [
    ({ slot }) => {
      const target = randomInt(rng, 3, 6)
      return {
        id: buildQuestId(weekKey, 'active-days', slot, target),
        family: 'active-days',
        title: `${pick(rng, ['Forge', 'Stack', 'String together', 'Lock in', 'Charge up'])} ${target} ${pick(rng, ['active days', 'days on the board', 'days in motion', 'check-in days'])}`,
        description: `${pick(rng, ['Keep the ladder warm', 'Make the week feel alive', 'Stay visible on the board', 'Build pressure slowly'])} with ${pick(rng, ['separate days of activity', 'steady check-ins that count', 'enough presence to stay in the fight'])}.`,
        rewardXp: buildQuestReward(rng, 52 + target * 13),
        target,
        getProgress: (metrics) => metrics.activeDays,
        formatProgress: (progress, nextTarget) => `${progress}/${nextTarget} days`,
      }
    },
    ({ slot }) => {
      const target = randomInt(rng, 4, 12)
      return {
        id: buildQuestId(weekKey, 'habit-reps', slot, target),
        family: 'habit-reps',
        title: `${pick(rng, ['Land', 'Rack up', 'Bank', 'Stack', 'Push'])} ${target} ${pick(rng, ['habit reps', 'habit hits', 'habit marks', 'habit ticks'])}`,
        description: `${pick(rng, ['Feed the ladder with raw reps', 'Give your week some volume', 'Create a scoreline that keeps moving', 'Turn repetition into pressure'])} by ${pick(rng, ['marking completions whenever you can', 'touching your habits repeatedly', 'letting momentum snowball'])}.`,
        rewardXp: buildQuestReward(rng, 60 + target * 9),
        target,
        getProgress: (metrics) => metrics.completions,
        formatProgress: (progress, nextTarget) => `${progress}/${nextTarget} reps`,
      }
    },
    ({ slot }) => {
      const target = randomInt(rng, 2, 8)
      return {
        id: buildQuestId(weekKey, 'task-clears', slot, target),
        family: 'task-clears',
        title: `${pick(rng, ['Clear', 'Knock out', 'Wipe', 'Cut down', 'Sweep away'])} ${target} ${pick(rng, ['tasks', 'task clears', 'items off the board', 'to-dos'])}`,
        description: `${pick(rng, ['Execution matters this week', 'Make space on the board', 'Turn open loops into points', 'Hit the rival with clean output'])} by ${pick(rng, ['finishing tasks instead of carrying them', 'closing whatever is lingering', 'removing friction one task at a time'])}.`,
        rewardXp: buildQuestReward(rng, 56 + target * 11),
        target,
        getProgress: (metrics) => metrics.tasksDone,
        formatProgress: (progress, nextTarget) => `${progress}/${nextTarget} tasks`,
      }
    },
    ({ slot }) => {
      const target = randomInt(rng, 2, 5)
      return {
        id: buildQuestId(weekKey, 'task-days', slot, target),
        family: 'task-days',
        title: `${pick(rng, ['Own', 'Cover', 'Touch', 'Claim', 'Light up'])} ${target} ${pick(rng, ['task days', 'days with clears', 'days of execution', 'task-active days'])}`,
        description: `${pick(rng, ['Spread your output across the week', 'Keep execution from bunching up', 'Make progress feel constant', 'Stay dangerous on multiple days'])} by ${pick(rng, ['clearing at least one task on different days', 'finding a daily finish line', 'putting a checkmark on the board repeatedly'])}.`,
        rewardXp: buildQuestReward(rng, 58 + target * 12),
        target,
        getProgress: (metrics) => metrics.taskDays,
        formatProgress: (progress, nextTarget) => `${progress}/${nextTarget} days`,
      }
    },
    ({ slot }) => {
      const target = pick(rng, [45, 60, 75, 90, 120, 150, 180])
      return {
        id: buildQuestId(weekKey, 'focus-minutes', slot, target),
        family: 'focus-minutes',
        title: `${pick(rng, ['Bank', 'Collect', 'Store', 'Stack', 'Lock in'])} ${target} ${pick(rng, ['focus min', 'quiet-work minutes', 'deep-focus minutes', 'attention minutes'])}`,
        description: `${pick(rng, ['Deep work scores separately', 'Quiet time is a weapon', 'Attention is worth real points', 'The ladder loves deliberate focus'])} so ${pick(rng, ['the week gets harder to chase', 'your board looks sharper', 'your rival has to answer it', 'your score gains another lane'])}.`,
        rewardXp: buildQuestReward(rng, 48 + Math.round(target * 0.44)),
        target,
        getProgress: (metrics) => metrics.focusMinutes,
        formatProgress: (progress, nextTarget) => `${progress}/${nextTarget} min`,
      }
    },
    ({ slot }) => {
      const target = randomInt(rng, 2, 5)
      return {
        id: buildQuestId(weekKey, 'focus-sessions', slot, target),
        family: 'focus-sessions',
        title: `${pick(rng, ['Trigger', 'Chain', 'Spin up', 'Land', 'Log'])} ${target} ${pick(rng, ['focus sessions', 'focus windows', 'deep-work drops', 'quiet blocks'])}`,
        description: `${pick(rng, ['This is about frequency, not just volume', 'Give your attention a rhythm', 'Build repeatable focus instead of one spike', 'Make concentration a recurring event'])} by ${pick(rng, ['showing up for multiple sessions', 'dropping into focus on separate days', 'collecting repeat focus hits'])}.`,
        rewardXp: buildQuestReward(rng, 60 + target * 11),
        target,
        getProgress: (metrics) => metrics.focusSessions,
        formatProgress: (progress, nextTarget) => `${progress}/${nextTarget} sessions`,
      }
    },
    ({ slot }) => {
      const target = randomInt(rng, 2, 4)
      return {
        id: buildQuestId(weekKey, 'early-bird', slot, target),
        family: 'early-bird',
        title: `${pick(rng, ['Catch', 'Stack', 'Claim', 'Land', 'Open with'])} ${target} ${pick(rng, ['morning marks', 'early hits', 'pre-noon wins', 'early bird completions'])}`,
        description: `${pick(rng, ['Steal the day before it gets noisy', 'Build the scoreline early', 'Front-load the pressure', 'Open strong and let the week chase you'])} by ${pick(rng, ['logging completions before noon', 'putting points up in the morning', 'earning your wins early'])}.`,
        rewardXp: buildQuestReward(rng, 62 + target * 14),
        target,
        getProgress: (metrics) => metrics.earlyBirdHits,
        formatProgress: (progress, nextTarget) => `${progress}/${nextTarget} hits`,
      }
    },
    ({ slot }) => {
      const target = randomInt(rng, 1, 2)
      return {
        id: buildQuestId(weekKey, 'weekend', slot, target),
        family: 'weekend',
        title: `${pick(rng, ['Guard', 'Win', 'Own', 'Hold', 'Cover'])} ${target} ${pick(rng, ['weekend hits', 'weekend check-ins', 'weekend pushes', 'weekend marks'])}`,
        description: `${pick(rng, ['Weekends decide whether momentum is real', 'The board gets softer on weekends', 'This is where streaks either hold or wobble', 'Keep your score alive when routines loosen'])} with ${pick(rng, ['activity on Saturday or Sunday', 'points that land over the weekend', 'visible movement on both chill days'])}.`,
        rewardXp: buildQuestReward(rng, 68 + target * 20),
        target,
        getProgress: (metrics) => metrics.weekendActivity,
        formatProgress: (progress, nextTarget) => `${progress}/${nextTarget} hits`,
      }
    },
    ({ slot }) => {
      const target = randomInt(rng, 3, 6)
      return {
        id: buildQuestId(weekKey, 'live-streak', slot, target),
        family: 'live-streak',
        title: `${pick(rng, ['Push', 'Hold', 'Build', 'Carry', 'Stretch'])} a ${target}-${pick(rng, ['day streak', 'day flame', 'day run', 'day chain'])}`,
        description: `${pick(rng, ['Momentum hits different when it survives overnight', 'A live streak makes every session heavier', 'This is the cleanest pressure you can build', 'A running streak changes the whole tone of the week'])} by ${pick(rng, ['showing up consecutively', 'keeping the chain intact', 'refusing to leave a gap'])}.`,
        rewardXp: buildQuestReward(rng, 72 + target * 15),
        target,
        getProgress: (metrics) => metrics.liveStreak,
        formatProgress: (progress, nextTarget) => `${progress}/${nextTarget} streak`,
      }
    },
    ({ slot }) => {
      const target = randomInt(rng, 1, 3)
      return {
        id: buildQuestId(weekKey, 'perfect-days', slot, target),
        family: 'perfect-days',
        title: `${pick(rng, ['Forge', 'Collect', 'Land', 'String together', 'Hold'])} ${target} ${pick(rng, ['perfect days', 'full clears', 'all-hit days', 'clean sweep days'])}`,
        description: `${pick(rng, ['These are statement days', 'A perfect day bends the whole scoreline', 'Full-board clears are worth chasing', 'This is maximum pressure in one shot'])} when ${pick(rng, ['every habit gets touched', 'nothing on the board is left cold', 'your whole habit lineup lights up'])}.`,
        rewardXp: buildQuestReward(rng, 78 + target * 22),
        target,
        getProgress: (metrics) => metrics.perfectDays,
        formatProgress: (progress, nextTarget) => `${progress}/${nextTarget} days`,
      }
    },
  ]

  return shuffleWithRandom(questFactories, rng)
    .slice(0, 4)
    .map((buildQuest, slot) => buildQuest({ slot }))
}

function evaluateQuest(quest, metrics) {
  const rawProgress = Math.max(0, quest.getProgress(metrics))
  const progress = Math.min(quest.target, rawProgress)
  const done = rawProgress >= quest.target

  return {
    ...quest,
    progress,
    rawProgress,
    done,
    progressPct: clamp(Math.round((progress / quest.target) * 100)),
    progressLabel: quest.formatProgress(progress, quest.target),
  }
}

function buildWindowMetrics({
  dates,
  habits,
  completionDatesByHabit,
  tasks,
  completionTimes,
  focusMinutes,
  allActivityDates,
}) {
  const dateSet = new Set(dates)
  const habitCompletionDates = Object.values(completionDatesByHabit || {}).flat()
  const taskActivityDates = getTaskActivityDates(tasks)
  const focusActivityDates = getFocusActivityDates(focusMinutes)
  const completions = Object.values(completionDatesByHabit || {}).reduce(
    (sum, days) => sum + days.filter((day) => dateSet.has(day)).length,
    0,
  )
  const tasksDone = countCompletedTasksForDates(tasks, dates)
  const taskDays = countActiveTaskDays(tasks, dates)
  const focusTotal = dates.reduce((sum, day) => sum + (focusMinutes?.[day] || 0), 0)
  const focusSessions = focusActivityDates.filter((day) => dateSet.has(day)).length
  const focusBlocks = Math.min(10, Math.floor(focusTotal / 25))
  const perfectDays = countPerfectDays(habits, completionDatesByHabit, dates)
  const activeHabitCount = habits.filter((habit) => {
    const days = completionDatesByHabit[habit.id] || []
    return days.some((day) => dateSet.has(day))
  }).length
  const activeDays = [...new Set([...habitCompletionDates, ...taskActivityDates, ...focusActivityDates])].filter((day) =>
    dateSet.has(day),
  )
  const weekendActivity = countWeekendActivity(activeDays)
  const liveStreak = getTrailingStreak(allActivityDates, dates[dates.length - 1])
  const habitCoverage = habits.length ? Math.round((activeHabitCount / habits.length) * 100) : 0
  const weeklyConsistency = Math.round((activeDays.length / dates.length) * 100)
  const earlyBirdHits = countEarlyCompletions(completionTimes, dates)
  const activityChannels = [completions > 0, tasksDone > 0, focusTotal > 0].filter(Boolean).length
  const comboMultiplier = (1 + Math.min(0.9, activeDays.length * 0.05 + perfectDays * 0.08 + Math.min(liveStreak, 5) * 0.04)).toFixed(2)
  const windowDays = Math.max(1, dates.length)
  const habitCadenceRatio = habits.length ? completions / Math.max(1, habits.length * windowDays) : 0
  const taskPressureRatio = tasksDone / Math.max(2, windowDays * 2)
  const focusPressureRatio = focusTotal / Math.max(30, windowDays * 35)
  const streakPressureRatio = liveStreak / windowDays
  const taskSpreadRatio = taskDays / windowDays
  const consistencyRatio = activeDays.length / windowDays
  const perfectRatio = perfectDays / windowDays
  const perfectWeight = Math.max(6, Math.min(24, habits.length * 3))
  const habitXp = Math.round(clamp(habitCadenceRatio, 0, 1.2) * 36)
  const taskXp = Math.round(clamp(taskPressureRatio, 0, 1.2) * 28)
  const focusXp = Math.round(clamp(focusPressureRatio, 0, 1.2) * 24)
  const streakXp = Math.round(clamp(streakPressureRatio, 0, 1) * 32)
  const pressureXp = Math.round(
    consistencyRatio * 18 +
      taskSpreadRatio * 8 +
      (activityChannels / 3) * 6 +
      perfectRatio * perfectWeight +
      weekendActivity * 4 +
      earlyBirdHits * 3,
  )
  const baseXp = habitXp + taskXp + focusXp + streakXp + pressureXp

  return {
    dates,
    windowDays,
    completions,
    tasksDone,
    taskDays,
    focusMinutes: focusTotal,
    focusSessions,
    focusBlocks,
    perfectDays,
    activeHabitCount,
    activeDays: activeDays.length,
    weekendActivity,
    liveStreak,
    habitCoverage,
    weeklyConsistency,
    earlyBirdHits,
    activityChannels,
    comboMultiplier,
    baseXp,
    habitXp,
    taskXp,
    focusXp,
    streakXp,
    pressureXp,
  }
}

function finalizeMetrics(metrics, quests) {
  const questBonusXp = quests.reduce((sum, quest) => sum + (quest.done ? quest.rewardXp : 0), 0)
  const xp = metrics.baseXp + questBonusXp

  return {
    ...metrics,
    questsCompleted: quests.filter((quest) => quest.done).length,
    questBonusXp,
    xp,
    breakdown: [
      { label: 'Habit reps', xp: metrics.habitXp, stat: `${metrics.completions} reps` },
      { label: 'Tasks', xp: metrics.taskXp, stat: `${metrics.tasksDone} clears` },
      { label: 'Focus', xp: metrics.focusXp, stat: `${metrics.focusMinutes} min` },
      { label: 'Quest bonus', xp: questBonusXp, stat: `${quests.filter((quest) => quest.done).length}/${quests.length} done` },
    ],
  }
}

export function buildWeeklySeasonSummary({
  habits,
  completionDatesByHabit,
  tasks,
  completionTimes,
  focusMinutes,
  seasonSeed = 'local',
}) {
  const today = new Date()
  const elapsedWeekDays = ((today.getDay() + 6) % 7) + 1
  const currentDates = getWeekDateKeys(elapsedWeekDays, 0, today)
  const previousDates = getWeekDateKeys(elapsedWeekDays, 1, today)
  const taskActivityDates = getTaskActivityDates(tasks)
  const focusActivityDates = getFocusActivityDates(focusMinutes)
  const habitCompletionDates = Object.values(completionDatesByHabit || {}).flat()
  const allActivityDates = [...new Set([...habitCompletionDates, ...taskActivityDates, ...focusActivityDates])]
  const currentQuestDefinitions = buildRandomQuestDefinitions({
    anchorDateValue: new Date(),
    seasonSeed,
  })
  const previousAnchorDate = new Date()
  previousAnchorDate.setDate(previousAnchorDate.getDate() - 7)
  const previousQuestDefinitions = buildRandomQuestDefinitions({
    anchorDateValue: previousAnchorDate,
    seasonSeed,
  })

  const currentBase = buildWindowMetrics({
    dates: currentDates,
    habits,
    completionDatesByHabit,
    tasks,
    completionTimes,
    focusMinutes,
    allActivityDates,
  })
  const previousBase = buildWindowMetrics({
    dates: previousDates,
    habits,
    completionDatesByHabit,
    tasks,
    completionTimes,
    focusMinutes,
    allActivityDates,
  })

  const currentQuests = currentQuestDefinitions.map((quest) => evaluateQuest(quest, currentBase))
  const previousQuests = previousQuestDefinitions.map((quest) => evaluateQuest(quest, previousBase))
  const current = finalizeMetrics(currentBase, currentQuests)
  const previous = finalizeMetrics(previousBase, previousQuests)
  const rank = getLeagueForXp(current.xp)

  const duelCategories = [
    { label: 'XP', current: current.xp, previous: previous.xp },
    { label: 'Consistency', current: current.weeklyConsistency, previous: previous.weeklyConsistency, suffix: '%' },
    { label: 'Tasks', current: current.tasksDone, previous: previous.tasksDone },
    { label: 'Focus min', current: current.focusMinutes, previous: previous.focusMinutes },
  ]
  const currentWins = duelCategories.filter((entry) => entry.current > entry.previous).length
  const previousWins = duelCategories.filter((entry) => entry.current < entry.previous).length
  const duelState =
    current.xp > previous.xp ? 'ahead' : current.xp < previous.xp ? 'behind' : 'tied'
  const deltaXp = current.xp - previous.xp
  const pressureLine =
    duelState === 'ahead'
      ? `${deltaXp} XP ahead of last week. Keep the cushion.`
      : duelState === 'behind'
        ? `${Math.abs(deltaXp)} XP behind last week. One strong day can flip it.`
        : 'Dead even with last week. The next session decides it.'

  const headline =
    current.xp === 0
      ? 'The ladder is waiting for your first move.'
      : duelState === 'ahead'
        ? `${rank.current.name} League and pulling away.`
        : duelState === 'behind'
          ? `${rank.current.name} League, but last week still has the belt.`
          : `${rank.current.name} League in a dead heat.`

  const subhead =
    current.xp === 0
      ? 'Habit reps, cleared tasks, and focus blocks all convert into weekly XP.'
      : `${pressureLine} ${current.questsCompleted}/${currentQuests.length} quests are already cleared.`

  return {
    currentDates,
    previousDates,
    current,
    previous,
    quests: currentQuests,
    rank,
    duel: {
      state: duelState,
      deltaXp,
      currentWins,
      previousWins,
      categories: duelCategories,
      pressureLine,
      scoreLabel: `${currentWins}-${previousWins}`,
    },
    headline,
    subhead,
  }
}
