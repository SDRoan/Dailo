import UserAvatar from './UserAvatar'
import {
  BoltIcon,
  FlameIcon,
  LeafIcon,
  LightbulbIcon,
  SparklesIcon,
  TrophyIcon,
} from './Icons'
import { getStreak } from '../lib/streaks'

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

function countCompletedTasksForDates(tasks, dates) {
  return dates.reduce((sum, date) => sum + ((tasks?.[date] || []).filter((task) => task.completed).length), 0)
}

function countActiveTaskDays(tasks, dates) {
  return dates.reduce((sum, date) => {
    return sum + ((tasks?.[date] || []).some((task) => task.completed) ? 1 : 0)
  }, 0)
}

function countPerfectDays(habits, completionDatesByHabit, dates) {
  if (!habits.length) return 0

  return dates.reduce((sum, date) => {
    const allDone = habits.every((habit) => (completionDatesByHabit[habit.id] || []).includes(date))
    return sum + (allDone ? 1 : 0)
  }, 0)
}

function countEarlyCompletions(completionTimes, dates) {
  const dateSet = new Set(dates)
  return Object.values(completionTimes || {}).reduce((sum, byDate) => {
    return (
      sum +
      Object.entries(byDate || {}).reduce((inner, [date, timestamp]) => {
        if (!dateSet.has(date)) return inner
        return inner + (new Date(timestamp).getHours() < 12 ? 1 : 0)
      }, 0)
    )
  }, 0)
}

function countWeekendActivity(days) {
  return days.filter((date) => {
    const [year, month, day] = date.split('-').map(Number)
    const dayOfWeek = new Date(year, month - 1, day).getDay()
    return dayOfWeek === 0 || dayOfWeek === 6
  }).length
}

function getTaskActivityDates(tasks) {
  return Object.entries(tasks || {}).reduce((dates, [date, list]) => {
    if ((list || []).some((task) => task.completed)) dates.push(date)
    return dates
  }, [])
}

function getFocusActivityDates(focusMinutes) {
  return Object.entries(focusMinutes || {}).reduce((dates, [date, minutes]) => {
    if ((minutes || 0) > 0) dates.push(date)
    return dates
  }, [])
}

function getDatesBack(count) {
  const dates = []
  const today = new Date()
  for (let index = count - 1; index >= 0; index -= 1) {
    const next = new Date(today)
    next.setDate(today.getDate() - index)
    const y = next.getFullYear()
    const m = String(next.getMonth() + 1).padStart(2, '0')
    const d = String(next.getDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${d}`)
  }
  return dates
}

function getDisplayName(user) {
  const fullName = user?.user_metadata?.full_name?.trim()
  if (fullName) return fullName
  return user?.email?.split('@')[0] || 'Daily Trainer'
}

const TYPE_META = {
  discipline: {
    label: 'Steel Type',
    title: 'Discipline Core',
    accent: '#cbd5e1',
    icon: TrophyIcon,
    aura: 'linear-gradient(145deg, rgba(203, 213, 225, 0.18), rgba(15, 23, 42, 0.9))',
    move: 'Lock-In Guard',
  },
  focus: {
    label: 'Psychic Type',
    title: 'Focus Mind',
    accent: '#c084fc',
    icon: LightbulbIcon,
    aura: 'linear-gradient(145deg, rgba(192, 132, 252, 0.18), rgba(46, 16, 101, 0.9))',
    move: 'Deep Focus Beam',
  },
  execution: {
    label: 'Electric Type',
    title: 'Execution Spark',
    accent: '#fde047',
    icon: BoltIcon,
    aura: 'linear-gradient(145deg, rgba(253, 224, 71, 0.2), rgba(66, 32, 6, 0.9))',
    move: 'Task Surge',
  },
  momentum: {
    label: 'Fire Type',
    title: 'Momentum Flame',
    accent: '#fb923c',
    icon: FlameIcon,
    aura: 'linear-gradient(145deg, rgba(251, 146, 60, 0.18), rgba(67, 20, 7, 0.9))',
    move: 'Streak Blaze',
  },
  balance: {
    label: 'Grass Type',
    title: 'Balance Bloom',
    accent: '#86efac',
    icon: LeafIcon,
    aura: 'linear-gradient(145deg, rgba(134, 239, 172, 0.18), rgba(6, 78, 59, 0.9))',
    move: 'Harmony Bloom',
  },
}

const RARITY_LABELS = [
  { min: 65, label: 'Legendary' },
  { min: 48, label: 'Epic' },
  { min: 30, label: 'Rare' },
  { min: 0, label: 'Common' },
]

const STRENGTH_ROWS = [
  { key: 'discipline', label: 'Discipline', icon: TrophyIcon },
  { key: 'focus', label: 'Focus', icon: LightbulbIcon },
  { key: 'execution', label: 'Execution', icon: BoltIcon },
  { key: 'momentum', label: 'Momentum', icon: FlameIcon },
  { key: 'balance', label: 'Balance', icon: LeafIcon },
]

function ProfilePowerCard({
  user,
  habits,
  completionDatesByHabit,
  tasks,
  completionTimes,
  focusMinutes,
  seasonSummary,
}) {
  const last7 = getDatesBack(7)
  const last7Set = new Set(last7)

  // Rolling 7-day signals — these should visibly rise and fall with recent activity.
  const habitCompletionDates = Object.values(completionDatesByHabit || {}).flat()
  const taskActivityDates = getTaskActivityDates(tasks)
  const focusActivityDates = getFocusActivityDates(focusMinutes)
  const completions7 = Object.values(completionDatesByHabit || {}).reduce(
    (sum, dates) => sum + dates.filter((date) => last7Set.has(date)).length,
    0,
  )
  const focusLast7 = last7.reduce((sum, date) => sum + (focusMinutes?.[date] || 0), 0)
  const tasksDone7 = countCompletedTasksForDates(tasks, last7)
  const taskDays7 = countActiveTaskDays(tasks, last7)
  const perfectDays7 = countPerfectDays(habits, completionDatesByHabit, last7)
  const earlyBirdHits7 = countEarlyCompletions(completionTimes, last7)
  const activeHabitCount7 = habits.filter((habit) => {
    const dates = completionDatesByHabit[habit.id] || []
    return dates.some((date) => last7Set.has(date))
  }).length
  const activeDays7 = [...new Set([...habitCompletionDates, ...taskActivityDates, ...focusActivityDates])].filter((date) =>
    last7Set.has(date),
  )
  const distinctActiveDays7 = activeDays7.length
  const weekendActivity7 = countWeekendActivity(activeDays7)
  const habitCount = Math.max(1, habits.length)
  const liveStreak = getStreak([...new Set([...habitCompletionDates, ...taskActivityDates, ...focusActivityDates])])
  const habitCoverage7 = Math.round((activeHabitCount7 / habitCount) * 100)
  const weeklyConsistency = Math.round((distinctActiveDays7 / 7) * 100)
  const focusSessions7 = focusActivityDates.filter((date) => last7Set.has(date)).length
  const focusBlocks7 = Math.min(8, Math.round(focusLast7 / 25))
  const activityChannels7 = [completions7 > 0, tasksDone7 > 0, focusLast7 > 0].filter(Boolean).length
  const weeklyOutput7 = completions7 + tasksDone7 + focusBlocks7

  // Weekly momentum score 0–100. A quiet week should cool the card down quickly.
  const weekEngagement = clamp(
    Math.round(
      weeklyConsistency * 0.28 +
        habitCoverage7 * 0.16 +
        Math.min(liveStreak, 7) * 5 +
        tasksDone7 * 3 +
        focusBlocks7 * 5 +
        perfectDays7 * 6 +
        completions7 * 1.5,
    ),
  )

  const strengthScores = {
    discipline: clamp(
      Math.round(
        weeklyConsistency * 0.4 +
          habitCoverage7 * 0.12 +
          perfectDays7 * 9 +
          Math.min(liveStreak, 7) * 6,
      ),
    ),
    focus: clamp(
      Math.round(
        Math.min(focusLast7, 240) * 0.3 +
          focusSessions7 * 8 +
          earlyBirdHits7 * 5 +
          distinctActiveDays7 * 3,
      ),
    ),
    execution: clamp(
      Math.round(tasksDone7 * 10 + taskDays7 * 6 + completions7 * 3 + activeHabitCount7 * 5),
    ),
    momentum: clamp(
      Math.round(
        Math.min(liveStreak, 10) * 9 +
          distinctActiveDays7 * 6 +
          completions7 * 2 +
          focusBlocks7 * 3,
      ),
    ),
    balance: clamp(
      Math.round(
        habitCoverage7 * 0.42 +
          activityChannels7 * 12 +
          weekendActivity7 * 7 +
          perfectDays7 * 6 +
          focusSessions7 * 4,
      ),
    ),
  }

  const sortedStrengths = Object.entries(strengthScores).sort((a, b) => b[1] - a[1])
  const primaryKey = sortedStrengths[0]?.[0] || 'discipline'
  const secondaryKey = sortedStrengths[1]?.[0] || 'focus'
  const primaryMeta = TYPE_META[primaryKey]
  const secondaryMeta = TYPE_META[secondaryKey]
  const PrimaryIcon = primaryMeta.icon

  // Weekly level: 1 on a quiet week, up to 99 on a peak week. Goes up AND down.
  const level = Math.max(1, Math.min(99, Math.round(weekEngagement * 0.99)))
  const hp = Math.min(
    180,
    60 + Math.round((sortedStrengths.reduce((sum, [, score]) => sum + score, 0) / 5) * 1.2),
  )
  const rarity = RARITY_LABELS.find((tier) => weekEngagement >= tier.min)?.label || 'Common'
  const weekSerial = last7[0]?.replace(/-/g, '').slice(-3) || '000'
  const serial = String((Number(weekSerial) + liveStreak * 29 + weeklyOutput7 * 9) % 999).padStart(3, '0')
  const signatureMoves = [
    { name: primaryMeta.move, score: sortedStrengths[0]?.[1] || 0 },
    { name: secondaryMeta.move, score: sortedStrengths[1]?.[1] || 0 },
  ]
  const weeklyTotals = [
    { label: 'Weekly XP', value: seasonSummary?.current?.xp ?? weeklyOutput7 * 18 },
    { label: 'Live streak', value: seasonSummary?.current?.liveStreak ?? liveStreak },
    { label: 'Active days', value: distinctActiveDays7 },
    { label: 'Focus min', value: focusLast7 },
  ]

  const flavorText =
    primaryKey === 'focus'
      ? 'When the world gets noisy, this trainer sharpens attention until the important things glow.'
      : primaryKey === 'execution'
        ? 'Known for converting plans into motion before hesitation has time to strike.'
        : primaryKey === 'momentum'
          ? 'A streak-fed engine that becomes harder to stop the longer it keeps moving.'
          : primaryKey === 'balance'
            ? 'Builds a stable life ecosystem by spreading effort across multiple fronts.'
            : 'Wins through repetition, structure, and an almost unfair level of self-discipline.'

  return (
    <section
      className="profile-grid"
      style={{ '--profile-accent': primaryMeta.accent, '--profile-aura': primaryMeta.aura }}
    >
      <aside className="profile-identity">
        <div className="profile-identity-topline">
          <span className="profile-identity-rarity">{rarity}</span>
          <span className="profile-identity-serial">#{serial}</span>
        </div>

        <div className="profile-identity-header">
          <div className="profile-identity-name-wrap">
            <h2 className="profile-identity-name">{getDisplayName(user)}</h2>
            <div className="profile-identity-meta">
              <span className="profile-identity-type-badge">
                <PrimaryIcon size={14} />
                {primaryMeta.label}
              </span>
              <span className="profile-identity-subtype">{primaryMeta.title}</span>
            </div>
          </div>
          <div className="profile-identity-level">
            <span className="profile-identity-level-label">Level</span>
            <span className="profile-identity-level-value">{level}</span>
          </div>
        </div>

        <div className="profile-identity-art">
          <div className="profile-identity-art-bg" />
          <div className="profile-identity-aura-ring" />
          <UserAvatar user={user} size={148} className="profile-identity-avatar" />
          <div className="profile-identity-art-badge">
            <SparklesIcon size={16} />
            Best in {primaryMeta.title}
          </div>
          <div className="profile-identity-hp">
            <span className="profile-identity-hp-label">HP</span>
            <span className="profile-identity-hp-value">{hp}</span>
          </div>
        </div>

        <p className="profile-identity-flavor">&ldquo;{flavorText}&rdquo;</p>
      </aside>

      <div className="profile-panel">
        <div className="profile-panel-block">
          <p className="section-eyebrow">Signature moves</p>
          <div className="profile-moves">
            {signatureMoves.map((move) => (
              <div key={move.name} className="profile-move">
                <span className="profile-move-name">{move.name}</span>
                <span className="profile-move-damage">{move.score}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="profile-panel-block">
          <p className="section-eyebrow">Strengths</p>
          <div className="profile-strengths">
            {STRENGTH_ROWS.map(({ key, label, icon: StrengthIcon }) => (
              <div key={key} className="profile-strength-row">
                <div className="profile-strength-label">
                  <StrengthIcon size={14} />
                  <span>{label}</span>
                </div>
                <div className="profile-strength-bar">
                  <div className="profile-strength-fill" style={{ width: `${strengthScores[key]}%` }} />
                </div>
                <span className="profile-strength-value">{strengthScores[key]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="profile-panel-block">
          <p className="section-eyebrow">7-day pulse</p>
          <div className="profile-totals">
            {weeklyTotals.map((item) => (
              <div key={item.label} className="profile-total">
                <span className="profile-total-value">{item.value}</span>
                <span className="profile-total-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProfilePowerCard
