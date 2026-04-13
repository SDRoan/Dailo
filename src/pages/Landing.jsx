import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import UserAvatar from '../components/UserAvatar'

function Landing() {
  const { user, loading, isConfigured, cloudError, signInWithPassword, signUpWithPassword, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const redirectPath = location.state?.from?.pathname || '/app'

  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Enter both your email and password.')
      setMessage('')
      return
    }

    setSubmitting(true)
    setError('')
    setMessage('')

    const authAction =
      mode === 'signin'
        ? signInWithPassword({ email: email.trim(), password })
        : signUpWithPassword({ email: email.trim(), password, redirectPath })

    const { data, error: authError } = await authAction

    if (authError) {
      setError(authError.message)
      setSubmitting(false)
      return
    }

    if (mode === 'signin' || data?.session) {
      navigate(redirectPath, { replace: true })
    } else {
      setMessage('Check your email for the confirmation link, then come back and sign in.')
      setPassword('')
    }

    setSubmitting(false)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="landing">
      <header className="landing-header">
        <span className="landing-logo">Dailo</span>
        <span className="landing-status-pill">{user ? 'Signed in' : 'Supabase auth live'}</span>
      </header>

      <section className="landing-hero landing-hero-grid">
        <div className="landing-hero-panel">
          <span className="landing-kicker">Habit tracking with identity</span>
          <h1 className="landing-hero-title">Track progress with a real account behind it.</h1>
          <p className="landing-hero-sub">
            Sign in to keep achievements, reminders, and momentum tied to you. Your current tracker data stays browser-local for now, but it&apos;s now isolated by signed-in account on this device.
          </p>

          <div className="landing-feature-stack">
            <div className="landing-feature-card">
              <strong>Auth-first progress</strong>
              <p>Email sign-up and sign-in are now connected to Supabase.</p>
            </div>
            <div className="landing-feature-card">
              <strong>Account-scoped activity</strong>
              <p>Each signed-in user now gets separate local tracker storage in this browser.</p>
            </div>
            <div className="landing-feature-card">
              <strong>Ready for cloud sync</strong>
              <p>The next layer is moving habits, logs, rewards, and achievements into Supabase tables.</p>
            </div>
          </div>
        </div>

        <div className="auth-card">
          {loading ? (
            <>
              <span className="auth-eyebrow">Preparing auth</span>
              <h2 className="auth-title">Restoring your session…</h2>
              <p className="auth-copy">Dailo is checking whether you&apos;re already signed in.</p>
            </>
          ) : user ? (
            <>
              <div className="auth-user-hero">
                <UserAvatar user={user} size={72} className="auth-user-avatar" />
                <div className="auth-user-meta">
                  <span className="auth-eyebrow">Welcome back</span>
                  <h2 className="auth-title">You&apos;re signed in.</h2>
                  <p className="auth-copy">{user.email}</p>
                </div>
              </div>
              <div className="auth-actions">
                <Link to={redirectPath} className="landing-cta auth-cta-full">
                  Continue to tracker
                </Link>
                <button type="button" className="btn auth-secondary-btn" onClick={handleSignOut}>
                  Sign out
                </button>
              </div>
              {cloudError ? (
                <p className="auth-feedback auth-feedback-error">
                  Cloud sync isn&apos;t ready yet: {cloudError}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <div className="auth-mode-switch">
                <button
                  type="button"
                  className={mode === 'signin' ? 'active' : ''}
                  onClick={() => setMode('signin')}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className={mode === 'signup' ? 'active' : ''}
                  onClick={() => setMode('signup')}
                >
                  Create account
                </button>
              </div>

              <span className="auth-eyebrow">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</span>
              <h2 className="auth-title">
                {mode === 'signin' ? 'Pick up where you left off.' : 'Start tracking with your own account.'}
              </h2>
              <p className="auth-copy">
                {mode === 'signin'
                  ? 'Sign in with the email you used for Dailo.'
                  : 'Email confirmation is on, so we&apos;ll send you a verification link after signup.'}
              </p>

              <form className="auth-form" onSubmit={handleSubmit}>
                <label className="auth-field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </label>

                <label className="auth-field">
                  <span>Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  />
                </label>

                {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}
                {message ? <p className="auth-feedback auth-feedback-success">{message}</p> : null}
                {!isConfigured ? (
                  <p className="auth-feedback auth-feedback-error">
                    Supabase isn&apos;t configured yet. Add your project URL and publishable key to the Vite env file first.
                  </p>
                ) : null}
                {cloudError ? <p className="auth-feedback auth-feedback-error">Cloud sync status: {cloudError}</p> : null}

                <button type="submit" className="landing-cta auth-cta-full" disabled={submitting || !isConfigured}>
                  {submitting ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default Landing
