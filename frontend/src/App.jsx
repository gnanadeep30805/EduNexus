import './App.css'

const navItems = [
  ['Overview', '⌂'], ['Opportunities', '↗'], ['Candidates', '◎'],
  ['Recruitment', '◈'], ['Interviews', '◷'], ['Collaboration', '◇'],
]

const skills = [
  { name: 'Cloud architecture', demand: 'High', supply: 42, color: 'coral' },
  { name: 'Spring Boot', demand: 'High', supply: 68, color: 'blue' },
  { name: 'Data engineering', demand: 'Rising', supply: 31, color: 'green' },
  { name: 'Product analytics', demand: 'Rising', supply: 54, color: 'gold' },
]

const candidates = [
  { initials: 'AK', name: 'Aarav Kulkarni', role: 'Backend Developer', score: 'Strong match', skills: 'Java · Spring Boot · SQL', tone: 'peach' },
  { initials: 'MS', name: 'Meera Shah', role: 'Data Engineer', score: 'Strong match', skills: 'Python · Spark · AWS', tone: 'mint' },
  { initials: 'RN', name: 'Rohan Nair', role: 'Platform Intern', score: 'Good match', skills: 'Docker · Node.js · Git', tone: 'lavender' },
]

function App() {
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
        <header className="topbar"><button className="mobile-menu" aria-label="Open navigation">☰</button><div className="breadcrumb">Industry <span>/</span> Overview</div><div className="top-actions"><button className="icon-button" aria-label="Search">⌕</button><button className="icon-button notification" aria-label="Notifications">♧<i /></button><div className="profile-chip"><span className="profile-avatar">PS</span><span className="profile-name">Priya Sharma</span><span>⌄</span></div></div></header>
        <div className="page-wrap">
          <section className="welcome-row"><div><p className="eyebrow">THURSDAY, 04 SEPTEMBER 2026</p><h1>Good morning, Priya <span>✦</span></h1><p className="intro">Here is what is happening across your hiring workspace.</p></div><button className="primary-button">＋ Create opportunity</button></section>
          <section className="signal-banner"><div className="signal-icon">↗</div><div><strong>Cloud skills are in demand</strong><p>Demand is up 18% this month, while only 42% of your active candidates show cloud architecture experience.</p></div><a href="#skills">View skill insights <span>→</span></a></section>
          <section className="metric-grid" aria-label="Recruitment summary">
            <article className="metric-card"><div className="metric-heading"><span>Active opportunities</span><span className="metric-icon blue-icon">↗</span></div><strong>08</strong><div className="metric-foot"><span className="trend positive">↑ 2</span> <span>this month</span></div></article>
            <article className="metric-card"><div className="metric-heading"><span>New applications</span><span className="metric-icon coral-icon">↓</span></div><strong>126</strong><div className="metric-foot"><span className="trend positive">↑ 14%</span> <span>vs last month</span></div></article>
            <article className="metric-card"><div className="metric-heading"><span>Shortlisted</span><span className="metric-icon green-icon">✓</span></div><strong>24</strong><div className="metric-foot"><span className="trend positive">↑ 8%</span> <span>conversion rate</span></div></article>
            <article className="metric-card"><div className="metric-heading"><span>Upcoming interviews</span><span className="metric-icon gold-icon">◷</span></div><strong>06</strong><div className="metric-foot"><span className="trend neutral">Next: today</span></div></article>
          </section>
          <section className="content-grid"><article className="panel pipeline-panel"><div className="panel-header"><div><p className="eyebrow">RECRUITMENT FLOW</p><h2>Pipeline overview</h2></div><button className="text-button">View recruitment <span>→</span></button></div><div className="pipeline-chart"><div className="chart-y"><span>80</span><span>60</span><span>40</span><span>20</span><span>0</span></div><div className="chart-area"><div className="grid-lines"><i /><i /><i /><i /><i /></div><svg viewBox="0 0 600 190" preserveAspectRatio="none" role="img" aria-label="Applications rise through the recruitment pipeline"><path className="area-fill" d="M0,150 C70,132 82,110 145,126 S208,88 260,103 S330,60 380,83 S450,42 500,54 S555,22 600,28 L600,190 L0,190Z" /><path className="line-fill" d="M0,150 C70,132 82,110 145,126 S208,88 260,103 S330,60 380,83 S450,42 500,54 S555,22 600,28" /></svg><div className="chart-x"><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span></div></div></div><div className="legend"><span><i className="dot blue-dot" />Applications</span><span><i className="dot coral-dot" />Shortlisted</span></div></article>
            <article className="panel interviews-panel"><div className="panel-header"><div><p className="eyebrow">ON YOUR CALENDAR</p><h2>Upcoming interviews</h2></div><button className="round-button" aria-label="Add interview">＋</button></div><div className="interview-list"><div className="interview-item"><div className="date-box"><strong>04</strong><small>SEP</small></div><div><strong>Technical round</strong><p>Aarav Kulkarni · Backend Developer</p></div><span className="time">10:30 AM</span></div><div className="interview-item"><div className="date-box mint-date"><strong>05</strong><small>SEP</small></div><div><strong>Culture fit</strong><p>Meera Shah · Data Engineer</p></div><span className="time">02:00 PM</span></div><div className="interview-item"><div className="date-box peach-date"><strong>06</strong><small>SEP</small></div><div><strong>Portfolio review</strong><p>Rohan Nair · Platform Intern</p></div><span className="time">11:00 AM</span></div></div><button className="full-text-button">Open calendar <span>→</span></button></article></section>
          <section className="content-grid lower-grid"><article className="panel candidates-panel"><div className="panel-header"><div><p className="eyebrow">RECOMMENDED BY SKILL INTELLIGENCE</p><h2>Candidate matches</h2></div><button className="text-button">See all matches <span>→</span></button></div><div className="candidate-list">{candidates.map((candidate) => <div className="candidate-row" key={candidate.name}><span className={`candidate-avatar ${candidate.tone}`}>{candidate.initials}</span><div className="candidate-info"><strong>{candidate.name}</strong><span>{candidate.role}</span></div><div className="candidate-skills">{candidate.skills}</div><span className={`match-badge ${candidate.score === 'Good match' ? 'good' : ''}`}><i />{candidate.score}</span><button className="more-button" aria-label={`More actions for ${candidate.name}`}>•••</button></div>)}</div></article><article className="panel skills-panel" id="skills"><div className="panel-header"><div><p className="eyebrow">DEMAND INTELLIGENCE</p><h2>Skills to watch</h2></div><button className="round-button" aria-label="Skill insights">↗</button></div><div className="skills-list">{skills.map((skill) => <div className="skill-row" key={skill.name}><div className="skill-title"><strong>{skill.name}</strong><span className={`demand ${skill.color}`}>{skill.demand}</span></div><div className="progress-track"><span className={skill.color} style={{ width: `${skill.supply}%` }} /></div><small>{skill.supply}% candidate supply</small></div>)}</div></article></section>
          <footer className="footer-note"><span className="status-dot" />Data updated 8 minutes ago <span>·</span> <a href="#activity">View activity log</a></footer>
        </div>
      </main>
    </div>
  )
}

export default App
