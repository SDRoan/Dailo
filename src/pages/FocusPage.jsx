import { useEffect } from 'react'
import FocusTimer from '../components/FocusTimer'
import { getFocusSession } from '../lib/storage'
import '../App.css'

function FocusPage() {
  useEffect(() => {
    document.title = 'Dailo – Focus'
  }, [])

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const session = getFocusSession()
      if (session && (session.phase === 'work' || session.phase === 'break')) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  const handleClose = () => {
    if (window.opener) window.close()
  }

  return (
    <div className="focus-page">
      <FocusTimer open standalone onClose={handleClose} />
    </div>
  )
}

export default FocusPage
