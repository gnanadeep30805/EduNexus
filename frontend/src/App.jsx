import { useEffect, useState } from 'react'
import './App.css'
import './funnel.css'
import './auth.css'
import AcademiaDashboard from './AcademiaDashboard.jsx'
import StudentDashboard from './StudentDashboard.jsx'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const navItems = [
  ['Overview', '⌂'], ['Opportunities', '↗'], ['Candidates', '◎'],
  ['Recruitment', '◈'], ['Interviews', '◷'], ['Collaboration', '◇'],
]

const MODULES = {
  student: { label: 'Student workspace', title: 'Build your skill passport', copy: 'Track skills, discover opportunities, and grow your placement readiness.', name: 'Institution name', signup: 'Create student account' },
  industry: { label: 'Industry workspace', title: 'Manage your hiring workspace', copy: 'Discover candidates, create opportunities, and move recruitment forward.', name: 'Company name', signup: 'Create industry account' },
  academia: { label: 'Academia workspace', title: 'Turn demand into learning action', copy: 'See industry demand, student readiness, and institutional skill gaps.', name: 'Institution name', signup: 'Create academia account' },
}

function LoginScreen({ onLogin, module }) {
  const moduleConfig = MODULES[module]
  const [registering, setRegistering] = useState(false)
  const [fullName, setFullName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/auth/${registering ? 'register' : 'login'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module, fullName, organizationName, email, password }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error?.message || 'Unable to sign in')
      localStorage.setItem('edunexus_token', result.data.token)
      onLogin(result.data.token)
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setLoading(false)
    }
  }

  return <main className="auth-shell"><form className="auth-card" onSubmit={submit}><div className="brand auth-brand"><span className="brand-mark">E</span><span>EduNexus</span></div><p className="eyebrow">{moduleConfig.label.toUpperCase()}</p><h1>{registering ? 'Create your account' : moduleConfig.title}</h1><p className="auth-copy">{registering ? `Register for the ${moduleConfig.label.toLowerCase()}.` : moduleConfig.copy}</p>{registering && <><label>Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} required autoComplete="name" /></label>{module !== 'student' && <label>{moduleConfig.name}<input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} required autoComplete="organization" /></label>}{module === 'student' && <label>{moduleConfig.name}<input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} autoComplete="organization" /></label>}</>}<label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength="8" autoComplete={registering ? 'new-password' : 'current-password'} /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button auth-submit" disabled={loading}>{loading ? 'Please wait...' : registering ? moduleConfig.signup : 'Sign in'}</button><button type="button" className="text-button auth-toggle" onClick={() => { setRegistering(!registering); setError('') }}>{registering ? 'Already have an account? Sign in' : `New to ${moduleConfig.label}? Create an account`}</button><div className="module-links"><a href="/student/login">Student</a><a href="/industry/login">Industry</a><a href="/academia/login">Academia</a></div></form></main>
}

function App() {
  const module = window.location.pathname.split('/')[1] || 'industry'
  const selectedModule = MODULES[module] ? module : 'industry'
  const [token, setToken] = useState(() => localStorage.getItem('edunexus_token'))
  const [dashboard, setDashboard] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(Boolean(token))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    let cancelled = false
    fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok || !result.success) throw new Error(result.error?.message || 'Unable to load profile')
        setProfile(result.data)
        const endpoint = ['ACADEMIA', 'ADMIN'].includes(result.data.user.role)
          ? 'academia/dashboard'
          : result.data.user.role === 'STUDENT' ? 'students/me/dashboard' : 'industry/dashboard'
        const dashboardResponse = await fetch(`${API_URL}/${endpoint}`, { headers: { Authorization: `Bearer ${token}` } })
        const dashboardResult = await dashboardResponse.json()
        if (!dashboardResponse.ok || !dashboardResult.success) throw new Error(dashboardResult.error?.message || 'Unable to load dashboard')
        return dashboardResult.data
      })
      .then((data) => { if (!cancelled) { setDashboard(data); setError('') } })
      .catch((loadError) => { if (!cancelled) { setError(loadError.message); if (loadError.message.includes('token')) { localStorage.removeItem('edunexus_token'); setToken(null) } } })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [token])

  function signOut() {
    localStorage.removeItem('edunexus_token')
    setToken(null)
    setDashboard(null)
  }

  if (!token) return <LoginScreen module={selectedModule} onLogin={(value) => { setLoading(true); setToken(value) }} />
  if (loading && !dashboard) return <main className="state-shell"><div className="state-card"><span className="state-spinner" /><h1>Loading your workspace</h1><p>Fetching live recruitment data.</p></div></main>
  if (error && !dashboard) return <main className="state-shell"><div className="state-card"><h1>Dashboard unavailable</h1><p>{error}</p><button className="primary-button" onClick={() => setToken(token)}>Try again</button><button className="text-button" onClick={signOut}>Sign out</button></div></main>
  if (profile && ['ACADEMIA', 'ADMIN'].includes(profile.user?.role)) return <AcademiaDashboard token={token} profile={profile} onSignOut={signOut} />
  if (profile?.user?.role === 'STUDENT') return <StudentDashboard token={token} profile={profile} onSignOut={signOut} />

  const metrics = dashboard?.metrics || {}
  const applications = dashboard?.recentApplications || []
  const interviews = dashboard?.upcomingInterviews || []
  const demandSkills = dashboard?.topRequiredSkills || []
  const funnel = dashboard?.funnel || []

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">E</span><span>EduNexus</span></div>
        <div className="workspace-switcher"><span className="company-avatar">TN</span><span><strong>TechNova Solutions</strong><small>Industry workspace</small></span><span className="chevron">⌄</span></div>
        <nav aria-label="Industry navigation">
          <p className="nav-label">Workspace</p>
          {navItems.map(([label, icon], index) => <a className={index === 0 ? 'nav-item active' : 'nav-item'} href={`#${label.toLowerCase()}`} key={label}><span className="nav-icon">{icon}</span>{label}{label === 'Candidates' && <span className="nav-count">24</span>}</a>)}
          <p className="nav-label nav-label-lower">Manage</p>
          <a className="nav-item" href="#company"><span className="nav-icon">□</span>Company profile</a>
          <a className="nav-item" href="#settings"><span className="nav-icon">⚙</span>Settings</a>
        </nav>
        <div className="sidebar-footer"><div className="help-icon">?</div><div><strong>Need a hand?</strong><small>Visit the help center</small></div></div>
      </aside>
      <main className="main-content">
        <header className="topbar"><button className="mobile-menu" aria-label="Open navigation">☰</button><div className="breadcrumb">Industry <span>/</span> Overview</div><div className="top-actions"><button className="icon-button" aria-label="Search">⌕</button><button className="icon-button notification" aria-label="Notifications">♧<i /></button><button className="profile-chip" onClick={signOut}><span className="profile-avatar">EN</span><span className="profile-name">Sign out</span><span>⌄</span></button></div></header>
        <div className="page-wrap">
          <section className="welcome-row"><div><p className="eyebrow">INDUSTRY OVERVIEW</p><h1>Good morning <span>✦</span></h1><p className="intro">Live recruitment signals from your organization.</p></div><button className="primary-button">＋ Create opportunity</button></section>
          <section className="signal-banner"><div className="signal-icon">↗</div><div><strong>{demandSkills[0]?.skill || 'Skill demand intelligence'}</strong><p>{demandSkills.length ? `${demandSkills[0].opportunity_count} active opportunities currently require this skill.` : 'Create an opportunity to start building demand intelligence.'}</p></div><a href="#skills">View skill insights <span>→</span></a></section>
          <section className="metric-grid" aria-label="Recruitment summary">
            <article className="metric-card"><div className="metric-heading"><span>Active opportunities</span><span className="metric-icon blue-icon">↗</span></div><strong>{metrics.activeOpportunities ?? 0}</strong><div className="metric-foot"><span>published now</span></div></article>
            <article className="metric-card"><div className="metric-heading"><span>Applications</span><span className="metric-icon coral-icon">↓</span></div><strong>{metrics.applications ?? 0}</strong><div className="metric-foot"><span>across opportunities</span></div></article>
            <article className="metric-card"><div className="metric-heading"><span>Shortlisted</span><span className="metric-icon green-icon">✓</span></div><strong>{metrics.shortlisted ?? 0}</strong><div className="metric-foot"><span>active candidates</span></div></article>
            <article className="metric-card"><div className="metric-heading"><span>Upcoming interviews</span><span className="metric-icon gold-icon">◷</span></div><strong>{metrics.interviews ?? 0}</strong><div className="metric-foot"><span>{metrics.offers ?? 0} offers · {metrics.hired ?? 0} hired</span></div></article>
          </section>
          <section className="content-grid"><article className="panel pipeline-panel"><div className="panel-header"><div><p className="eyebrow">RECRUITMENT FLOW</p><h2>Pipeline overview</h2></div><button className="text-button">View recruitment <span>→</span></button></div><div className="funnel-bars" aria-label="Recruitment funnel counts">{funnel.map((stage) => { const max = Math.max(...funnel.map((item) => item.count), 1); return <div className="funnel-column" key={stage.stage}><strong>{stage.count}</strong><span style={{ height: `${Math.max(8, (stage.count / max) * 130)}px` }} /><small>{stage.stage.replace('_', ' ')}</small></div> })}</div><div className="legend"><span><i className="dot blue-dot" />Applications by stage</span><span className="legend-note">Live database counts</span></div></article>
            <article className="panel interviews-panel"><div className="panel-header"><div><p className="eyebrow">ON YOUR CALENDAR</p><h2>Upcoming interviews</h2></div><button className="round-button" aria-label="Add interview">＋</button></div><div className="interview-list">{interviews.length ? interviews.map((interview) => <div className="interview-item" key={interview.id}><div className="date-box"><strong>{new Date(interview.scheduled_at).getDate()}</strong><small>{new Date(interview.scheduled_at).toLocaleString('en', { month: 'short' }).toUpperCase()}</small></div><div><strong>{interview.opportunity_title}</strong><p>{interview.first_name} {interview.last_name} · {interview.mode}</p></div><span className="time">{new Date(interview.scheduled_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span></div>) : <p className="empty-copy">No upcoming interviews.</p>}</div><button className="full-text-button">Open calendar <span>→</span></button></article></section>
          <section className="content-grid lower-grid"><article className="panel candidates-panel"><div className="panel-header"><div><p className="eyebrow">RECENT APPLICATIONS</p><h2>Candidate activity</h2></div><button className="text-button">See applications <span>→</span></button></div><div className="candidate-list">{applications.length ? applications.map((application) => <div className="candidate-row" key={application.id}><span className="candidate-avatar peach">{`${application.first_name?.[0] || ''}${application.last_name?.[0] || ''}`}</span><div className="candidate-info"><strong>{application.first_name} {application.last_name}</strong><span>{application.opportunity_title}</span></div><div className="candidate-skills">Applied {new Date(application.applied_at).toLocaleDateString()}</div><span className="match-badge good">{application.status.replace('_', ' ')}</span></div>) : <p className="empty-copy">No applications yet.</p>}</div></article><article className="panel skills-panel" id="skills"><div className="panel-header"><div><p className="eyebrow">DEMAND INTELLIGENCE</p><h2>Skills to watch</h2></div><button className="round-button" aria-label="Skill insights">↗</button></div><div className="skills-list">{demandSkills.length ? demandSkills.map((skill, index) => <div className="skill-row" key={skill.skill}><div className="skill-title"><strong>{skill.skill}</strong><span className={`demand ${['coral', 'blue', 'green', 'gold'][index % 4]}`}>{skill.mandatory_count ? 'Mandatory' : 'Preferred'}</span></div><div className="progress-track"><span className={['coral', 'blue', 'green', 'gold'][index % 4]} style={{ width: `${Math.min(100, skill.opportunity_count * 25)}%` }} /></div><small>{skill.opportunity_count} opportunities require this skill</small></div>) : <p className="empty-copy">No skill demand data yet.</p>}</div></article></section>
          <footer className="footer-note"><span className="status-dot" />Data updated 8 minutes ago <span>·</span> <a href="#activity">View activity log</a></footer>
        </div>
      </main>
    </div>
  )
}

export default App
