import { DiamondIcon, FlameIcon, RocketIcon, SparklesIcon, TrophyIcon } from './Icons'

function formatSignedValue(value) {
  if (value > 0) return `+${value}`
  return String(value)
}

function WeeklySeasonPanel({ summary }) {
  const accent = summary.rank.current.accent
  const duelAccent =
    summary.duel.state === 'ahead' ? '#4ade80' : summary.duel.state === 'behind' ? '#f87171' : '#facc15'

  return (
    <section
      className="season-panel"
      style={{ '--season-accent': accent, '--season-duel-accent': duelAccent }}
    >
      <div className="season-panel-main">
        <div className="season-panel-header">
          <div>
            <p className="section-eyebrow">Weekly ladder</p>
            <h2 className="season-panel-title">{summary.headline}</h2>
          </div>
          <span className="season-rank-pill">
            <DiamondIcon size={14} />
            {summary.rank.current.name} League
          </span>
        </div>

        <p className="season-panel-sub">{summary.subhead}</p>

        <div className="season-xp-band">
          <div className="season-xp-core">
            <span className="season-xp-label">Weekly XP</span>
            <span className="season-xp-value">{summary.current.xp}</span>
          </div>
          <div className="season-xp-track-wrap">
            <div className="season-xp-track">
              <div className="season-xp-fill" style={{ width: `${summary.rank.progress}%` }} />
            </div>
            <span className="season-xp-next">
              {summary.rank.next
                ? `${summary.rank.xpToNext} XP to ${summary.rank.next.name}`
                : 'Top league reached'}
            </span>
          </div>
        </div>

        <div className="season-pulse-row">
          <div className="season-pulse-chip">
            <FlameIcon size={16} />
            <div>
              <span className="season-pulse-value">{summary.current.liveStreak} days</span>
              <span className="season-pulse-label">Live streak</span>
            </div>
          </div>
          <div className="season-pulse-chip">
            <RocketIcon size={16} />
            <div>
              <span className="season-pulse-value">{summary.current.comboMultiplier}x</span>
              <span className="season-pulse-label">Momentum boost</span>
            </div>
          </div>
          <div className="season-pulse-chip">
            <SparklesIcon size={16} />
            <div>
              <span className="season-pulse-value">{summary.current.weeklyConsistency}%</span>
              <span className="season-pulse-label">Consistency</span>
            </div>
          </div>
          <div className="season-pulse-chip">
            <TrophyIcon size={16} />
            <div>
              <span className="season-pulse-value">{summary.quests.filter((quest) => quest.done).length}/{summary.quests.length}</span>
              <span className="season-pulse-label">Quests cleared</span>
            </div>
          </div>
        </div>

        <div className="season-breakdown-grid">
          {summary.current.breakdown.map((item) => (
            <div key={item.label} className="season-breakdown-card">
              <span className="season-breakdown-label">{item.label}</span>
              <strong className="season-breakdown-xp">{item.xp} XP</strong>
              <span className="season-breakdown-stat">{item.stat}</span>
            </div>
          ))}
        </div>
      </div>

      <aside className="season-rival-panel">
        <div className="season-rival-header">
          <div>
            <p className="section-eyebrow">Beat last week</p>
            <h3 className="season-rival-title">
              {summary.duel.state === 'ahead'
                ? 'You have the edge.'
                : summary.duel.state === 'behind'
                  ? 'Last week is still ahead.'
                  : 'You are tied.'}
            </h3>
          </div>
          <span className={`season-rival-badge ${summary.duel.state}`}>
            {formatSignedValue(summary.duel.deltaXp)} XP
          </span>
        </div>

        <div className="season-rival-score">
          <div className="season-rival-score-block">
            <span className="season-rival-score-label">This week</span>
            <strong>{summary.current.xp}</strong>
          </div>
          <div className="season-rival-score-divider">{summary.duel.scoreLabel}</div>
          <div className="season-rival-score-block muted">
            <span className="season-rival-score-label">Last week</span>
            <strong>{summary.previous.xp}</strong>
          </div>
        </div>

        <p className="season-rival-copy">{summary.duel.pressureLine}</p>

        <div className="season-rival-stats">
          {summary.duel.categories.map((entry) => {
            const state =
              entry.current > entry.previous ? 'ahead' : entry.current < entry.previous ? 'behind' : 'tied'
            return (
              <div key={entry.label} className={`season-rival-stat ${state}`}>
                <span>{entry.label}</span>
                <strong>
                  {entry.current}{entry.suffix || ''} <span>/ {entry.previous}{entry.suffix || ''}</span>
                </strong>
              </div>
            )
          })}
        </div>
      </aside>

      <div className="season-quests-panel">
        <div className="season-quests-header">
          <p className="section-eyebrow">Weekly quests</p>
          <span className="season-quests-meta">Randomly rolled for this week</span>
        </div>
        <div className="season-quests-grid">
          {summary.quests.map((quest) => (
            <article key={quest.id} className={`season-quest-card ${quest.done ? 'done' : ''}`}>
              <div className="season-quest-topline">
                <span className="season-quest-reward">+{quest.rewardXp} XP</span>
                <span className="season-quest-progress">{quest.progressLabel}</span>
              </div>
              <h3 className="season-quest-title">{quest.title}</h3>
              <p className="season-quest-desc">{quest.description}</p>
              <div className="season-quest-track">
                <div className="season-quest-fill" style={{ width: `${quest.progressPct}%` }} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default WeeklySeasonPanel
