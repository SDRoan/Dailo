import { getCalendarGrid } from '../lib/storage'

function CalendarView({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onGoToToday,
  habits,
  completions,
  selectedHabitId,
  onSelectHabit,
  selectedDateKey,
  onSelectDate,
  taskCounts = {},
  today,
  onToggleDay,
}) {
  const grid = getCalendarGrid(year, month)
  const monthTitle = new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  const getCompletedCount = (dateKey) => {
    if (!habits.length) return 0
    return habits.filter((h) => completions[h.id]?.[dateKey]).length
  }

  const isDayCompleted = (dateKey) => {
    if (selectedHabitId) return !!completions[selectedHabitId]?.[dateKey]
    return getCompletedCount(dateKey) > 0
  }

  const canToggle = (dateKey) => {
    if (!selectedHabitId) return false
    const [y, m, d] = dateKey.split('-').map(Number)
    const cellDate = new Date(y, m - 1, d)
    const now = new Date()
    return cellDate <= new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }

  return (
    <div className="calendar-view">
      <div className="calendar-nav">
        <button type="button" className="calendar-nav-btn" onClick={onPrevMonth} aria-label="Previous month">
          ‹
        </button>
        <button type="button" className="calendar-month-title" onClick={onGoToToday}>
          {monthTitle}
        </button>
        <button type="button" className="calendar-nav-btn" onClick={onNextMonth} aria-label="Next month">
          ›
        </button>
      </div>

      <div className="calendar-habit-filter">
        <label htmlFor="calendar-habit">Show:</label>
        <select
          id="calendar-habit"
          className="calendar-habit-select"
          value={selectedHabitId ?? ''}
          onChange={(e) => onSelectHabit(e.target.value || null)}
        >
          <option value="">All habits</option>
          {habits.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </div>

      <div className="calendar-weekdays">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((wd) => (
          <div key={wd} className="calendar-weekday">
            {wd}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {grid.map((cell) => {
          const completed = isDayCompleted(cell.dateKey)
          const isToday = cell.dateKey === today
          const isSelected = cell.dateKey === selectedDateKey
          const toggleable = canToggle(cell.dateKey)
          const habitCompleted = selectedHabitId ? !!completions[selectedHabitId]?.[cell.dateKey] : false
          const taskCount = taskCounts[cell.dateKey] || 0
          return (
            <div
              key={cell.dateKey}
              className={`calendar-cell ${!cell.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${completed ? 'completed' : ''} clickable`}
              onClick={() => onSelectDate?.(cell.dateKey)}
              title={cell.dateKey}
            >
              <span className="calendar-cell-day">{cell.day}</span>
              {completed && (
                <span className="calendar-cell-dot">
                  {!selectedHabitId && habits.length > 1 ? getCompletedCount(cell.dateKey) : '✓'}
                </span>
              )}
              {taskCount > 0 && (
                <span className="calendar-cell-task-count" title={`${taskCount} task${taskCount > 1 ? 's' : ''}`}>
                  {taskCount}
                </span>
              )}
              {selectedHabitId && toggleable && (
                <button
                  type="button"
                  className={`calendar-cell-toggle ${habitCompleted ? 'checked' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleDay(selectedHabitId, cell.dateKey)
                  }}
                  aria-label={`${habitCompleted ? 'Unmark' : 'Mark'} completion for ${cell.dateKey}`}
                  title={habitCompleted ? 'Unmark completion' : 'Mark completion'}
                >
                  {habitCompleted ? '✓' : '○'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {selectedHabitId && (
        <p className="calendar-hint">Click a day to open tasks for that date. Use ○/✓ inside past days to toggle the selected habit.</p>
      )}
      {!selectedHabitId && (
        <p className="calendar-hint">Click a day to create tasks for that date.</p>
      )}
    </div>
  )
}

export default CalendarView
