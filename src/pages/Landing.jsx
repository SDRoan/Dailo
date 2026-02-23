import { Link } from 'react-router-dom'

function Landing() {
  return (
    <div className="landing">
      <header className="landing-header">
        <span className="landing-logo">Dailo</span>
      </header>

      <section className="landing-hero">
        <h1 className="landing-hero-title">Organize your habits in one place.</h1>
        <p className="landing-hero-sub">Track daily, hit goals, and build consistency. Your habit system, in the browser.</p>
        <Link to="/app" className="landing-cta">Start tracking</Link>
      </section>
    </div>
  )
}

export default Landing
