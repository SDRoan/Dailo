import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children }) {
  const { loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="auth-shell auth-shell-centered">
        <div className="auth-card auth-card-compact">
          <span className="auth-eyebrow">Checking session</span>
          <h1 className="auth-title">Loading your workspace…</h1>
          <p className="auth-copy">We&apos;re restoring your Dailo session and preparing your habits.</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />
  }

  return children
}

export default ProtectedRoute
