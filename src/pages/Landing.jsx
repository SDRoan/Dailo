import { Link } from 'react-router-dom'

function Landing() {
  return (
    <div className="landing">
      <header className="landing-header">
        <span className="landing-logo">Dailo</span>
        <Link to="/app" className="landing-cta-header">Open app</Link>
      </header>

      <section className="landing-hero">
        <h1 className="landing-hero-title">Organize your habits in one place.</h1>
        <p className="landing-hero-sub">Track daily, hit goals, and build consistency. Your habit system, in the browser.</p>
        <Link to="/app" className="landing-cta">Start tracking</Link>
      </section>

      <section className="landing-problem">
        <h2 className="landing-section-title">From scattered…</h2>
        <p className="landing-section-text">No framework, forget what you did, juggling notes and apps.</p>
        <h2 className="landing-section-title">…to clarity.</h2>
        <p className="landing-section-text">One place. Weekly view. Timer, reminders, and progress at a glance.</p>
      </section>

      <section className="landing-features">
        <h2 className="landing-section-title">What you get</h2>
        <ul className="landing-feature-list">
          <li><strong>Daily tracker</strong> — This week or 2 weeks, check off each habit per day.</li>
          <li><strong>Built-in timer</strong> — Log time per activity; the chart goes up and down by minutes.</li>
          <li><strong>Weekly goals</strong> — Set targets (e.g. 3× or every day) and see when you hit them.</li>
          <li><strong>Reminders</strong> — Optional browser notifications so you don’t forget.</li>
          <li><strong>Calendar</strong> — Month view and history; click days to log past completions.</li>
          <li><strong>Progress chart</strong> — Bar chart of time spent per day, not just yes/no.</li>
        </ul>
      </section>

      <section className="landing-trust">
        <div className="landing-trust-grid">
          <span className="landing-trust-item">No sign-up</span>
          <span className="landing-trust-item">Free</span>
          <span className="landing-trust-item">Data stays in your browser</span>
          <span className="landing-trust-item">Works offline</span>
        </div>
      </section>

      <section className="landing-testimonial">
        <blockquote className="landing-quote">
          Over 90% of people report measurable improvements when they track habits daily.
        </blockquote>
      </section>

      <section className="landing-faq">
        <h2 className="landing-section-title">FAQ</h2>
        <div className="landing-faq-list">
          <div className="landing-faq-item">
            <h3>What is Dailo?</h3>
            <p>A habit tracker you use in the browser. Add habits, check them off by day, log time with a timer, and see your progress in a weekly bar chart. No account required; data is stored locally.</p>
          </div>
          <div className="landing-faq-item">
            <h3>Is my data private?</h3>
            <p>Yes. Habits and completions are stored only in your device’s browser (localStorage). Nothing is sent to a server unless you choose to use reminders (browser notifications).</p>
          </div>
          <div className="landing-faq-item">
            <h3>Do I need to create an account?</h3>
            <p>No. Open the app and start adding habits. Your data stays on your device.</p>
          </div>
        </div>
      </section>

      <section className="landing-cta-section">
        <h2 className="landing-section-title">Take back control.</h2>
        <p className="landing-section-text">Track. Visualize. Stay consistent.</p>
        <Link to="/app" className="landing-cta">Open Dailo</Link>
      </section>

      <footer className="landing-footer">
        <Link to="/app" className="landing-footer-link">Open app</Link>
        <span className="landing-footer-copy">© Dailo</span>
      </footer>
    </div>
  )
}

export default Landing
