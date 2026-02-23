import { useState } from 'react'

function DailyTasksList({ dateKey, tasks, onToggle, onRemove, onAdd }) {
  const [input, setInput] = useState('')

  const handleAdd = () => {
    const label = input.trim()
    if (!label) return
    onAdd(dateKey, label)
    setInput('')
  }

  return (
    <div className="daily-tasks-list">
      <div className="daily-tasks-add">
        <input
          type="text"
          placeholder="Add task..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="daily-tasks-input"
        />
        <button type="button" onClick={handleAdd} className="btn-sm daily-tasks-add-btn">
          Add
        </button>
      </div>
      <ul className="daily-tasks-ul">
        {tasks.map((t) => (
          <li key={t.id} className={`daily-tasks-li ${t.completed ? 'completed' : ''}`}>
            <button
              type="button"
              className="daily-tasks-check"
              onClick={() => onToggle(dateKey, t.id)}
              aria-label={t.completed ? 'Uncomplete' : 'Complete'}
            >
              {t.completed ? '✓' : ''}
            </button>
            <span className="daily-tasks-label">{t.label}</span>
            <button
              type="button"
              className="daily-tasks-remove"
              onClick={() => onRemove(dateKey, t.id)}
              aria-label="Remove task"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default DailyTasksList
