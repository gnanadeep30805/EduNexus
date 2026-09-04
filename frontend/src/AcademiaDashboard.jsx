import { useCallback, useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const sections = [
  ['overview', 'Overview'], ['skills', 'Skill intelligence'], ['students', 'Students'],
  ['internships', 'Internships'], ['placements', 'Placements'], ['collaborations', 'Collaboration'],
]

function formatStatus(value) {
  return String(value || '').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function AcademiaDashboard({ token, profile, onSignOut }) {
  const [section, setSection] = useState('overview')
  const [data, setData] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback(async (path) => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/academia/${path}`, { headers: { Authorization: `Bearer ${token}` } })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error?.message || 'Unable to load academia data')
      if (path === 'dashboard') setData(result.data)
      else setItems(result.data.items || [])
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load('dashboard') }, [load])
  useEffect(() => {
    if (section !== 'overview') load(section === 'collaborations' ? 'collaborations' : section)
  }, [load, section])

  function signOut() {
    localStorage.removeItem('edunexus_token')
    onSignOut()
  }

  const metrics = data?.metrics || {}
  const institution = data?.institution || profile?.institution

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">E</span><span>EduNexus</span></div>
      <div className="workspace-switcher"><span className="company-avatar">AC</span><span><strong>{institution?.name || 'Academic workspace'}</strong><small>Academia workspace</small></span><span className="chevron">⌄</span></div>
      <nav aria-label="Academia navigation"><p className="nav-label">Workspace</p>{sections.map(([key, label], index) => <button className={`nav-item ${section === key ? 'active' : ''}`} key={key} onClick={() => setSection(key)}><span className="nav-icon">{['⌂', '◈', '◎', '◷', '↗', '◇'][index]}</span>{label}</button>)}<p className="nav-label nav-label-lower">Manage</p><button className="nav-item" onClick={() => setSection('institution')}><span className="nav-icon">□</span>Institution profile</button><button className="nav-item" onClick={signOut}><span className="nav-icon">↪</span>Sign out</button></nav>
      <div className="sidebar-footer"><div className="help-icon">?</div><div><strong>Need a hand?</strong><small>Visit the help center</small></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><button className="mobile-menu" aria-label="Open navigation">☰</button><div className="breadcrumb">Academia <span>/</span> {sections.find(([key]) => key === section)?.[1] || 'Institution profile'}</div><div className="top-actions"><button className="icon-button" aria-label="Search">⌕</button><button className="icon-button notification" aria-label="Notifications">♧<i /></button><button className="profile-chip" onClick={signOut}><span className="profile-avatar">{profile?.user?.fullName?.slice(0, 2).toUpperCase() || 'AC'}</span><span className="profile-name">{profile?.user?.fullName || 'Academic admin'}</span><span>⌄</span></button></div></header>
      <div className="page-wrap">
        <section className="welcome-row"><div><p className="eyebrow">ACADEMIA INTELLIGENCE</p><h1>{section === 'overview' ? 'Institution readiness' : sections.find(([key]) => key === section)?.[1] || 'Institution profile'} <span>✦</span></h1><p className="intro">Industry demand, student supply, and outcomes in one view.</p></div>{section === 'overview' && <button className="primary-button" onClick={() => setSection('skills')}>View skill gaps →</button>}</section>
        {error && <div className="form-error" role="alert">{error} <button className="text-button" onClick={() => load(section === 'overview' ? 'dashboard' : section)}>Retry</button></div>}
        {loading && !data && <div className="panel"><p className="empty-copy">Loading live institutional data...</p></div>}
        {!loading && section === 'overview' && <Overview data={data} metrics={metrics} onSelect={setSection} />}
        {!loading && section !== 'overview' && section !== 'institution' && <DataSection section={section} items={items} search={search} setSearch={setSearch} />}
        {section === 'institution' && <Institution data={institution} />}
      </div>
    </main>
  </div>
}

function Overview({ data, metrics, onSelect }) {
  return <>
    <div className="signal-banner"><div className="signal-icon">↗</div><div><strong>{data?.gaps?.[0]?.skill || 'Skill demand intelligence'}</strong><p>{data?.gaps?.length ? `${data.gaps[0].priority} priority gap: student supply trails published industry demand.` : 'Your institution is ready for live skill analysis.'}</p></div><button className="text-button" onClick={() => onSelect('skills')}>Open analysis <span>→</span></button></div>
    <section className="metric-grid" aria-label="Institution summary"><Metric label="Students" value={metrics.students} icon="◎" tone="blue" /><Metric label="Departments" value={metrics.departments} icon="□" tone="coral" /><Metric label="Verified skills" value={metrics.verifiedSkills} icon="✓" tone="green" /><Metric label="Active internships" value={metrics.activeInternships} icon="◷" tone="gold" /><Metric label="Upcoming internships" value={metrics.upcomingInternships} icon="→" tone="blue" /><Metric label="At-risk internships" value={metrics.atRiskInternships} icon="!" tone="coral" /><Metric label="Completed internships" value={metrics.completedInternships} icon="✓" tone="green" /><Metric label="Joined placements" value={metrics.placements} icon="↗" tone="gold" /></section>
    <section className="content-grid"><article className="panel"><div className="panel-header"><div><p className="eyebrow">DEMAND VS SUPPLY</p><h2>Top industry signals</h2></div><button className="text-button" onClick={() => onSelect('skills')}>See all <span>→</span></button></div><div className="candidate-list">{(data?.demand || []).slice(0, 6).map((row) => <div className="candidate-row" key={row.skill}><span className="candidate-avatar mint">{row.skill.slice(0, 2).toUpperCase()}</span><div className="candidate-info"><strong>{row.skill}</strong><span>{row.demand} published demand records</span></div><div className="candidate-skills">{row.supply} students</div><span className={`match-badge ${row.demand > row.supply ? 'good' : ''}`}>{row.demand > row.supply ? 'Gap' : 'Aligned'}</span></div>)}</div></article><article className="panel"><div className="panel-header"><div><p className="eyebrow">PRIORITY GAPS</p><h2>Where to focus</h2></div><button className="round-button" onClick={() => onSelect('skills')} aria-label="Open skill intelligence">↗</button></div><div className="skills-list">{(data?.gaps || []).map((gap, index) => <div className="skill-row" key={gap.skill}><div className="skill-title"><strong>{gap.skill}</strong><span className={`demand ${['coral', 'gold', 'blue'][index % 3]}`}>{gap.priority}</span></div><div className="progress-track"><span className="coral" style={{ width: `${Math.min(100, gap.demand * 18)}%` }} /></div><small>{gap.supply} student supply · {gap.demand} demand</small></div>)}</div></article></section>
  </>
}

function Metric({ label, value, icon, tone }) { return <article className="metric-card"><div className="metric-heading"><span>{label}</span><span className={`metric-icon ${tone}-icon`}>{icon}</span></div><strong>{value ?? 0}</strong><div className="metric-foot"><span>live database count</span></div></article> }

function DataSection({ section, items, search, setSearch }) {
  const filtered = items.filter((item) => JSON.stringify(item).toLowerCase().includes(search.toLowerCase()))
  const columns = section === 'skills' ? ['name', 'category', 'student_count', 'verified_count', 'industry_demand'] : section === 'students' ? ['first_name', 'last_name', 'department', 'course', 'verified_skill_count'] : section === 'internships' ? ['first_name', 'last_name', 'company', 'role', 'status', 'progress'] : section === 'placements' ? ['first_name', 'last_name', 'company', 'role_title', 'joined'] : ['title', 'type', 'target_audience', 'status', 'proposed_date']
  return <article className="panel data-panel"><div className="panel-header"><div><p className="eyebrow">LIVE DATABASE</p><h2>{section === 'skills' ? 'Institutional skill intelligence' : formatStatus(section)}</h2></div><input className="table-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" aria-label="Search records" /></div><div className="table-wrap"><table><thead><tr>{columns.map((column) => <th key={column}>{formatStatus(column)}</th>)}</tr></thead><tbody>{filtered.map((item, index) => <tr key={item.id || index}>{columns.map((column) => <td key={column}>{column === 'status' ? <span className="match-badge good">{formatStatus(item[column])}</span> : column === 'progress' ? `${item[column] || 0}%` : String(item[column] ?? '—')}</td>)}</tr>)}</tbody></table>{!filtered.length && <p className="empty-copy">No records match this view.</p>}</div></article>
}

function Institution({ data }) { return <article className="panel institution-panel"><p className="eyebrow">INSTITUTION PROFILE</p><h2>{data?.name || 'Institution profile'}</h2><p className="intro">{data?.description || 'Institution details are managed by authorized academic administrators.'}</p><div className="metric-grid"><Metric label="Verification" value={formatStatus(data?.verification_status || 'PENDING')} icon="✓" tone="green" /><Metric label="Type" value={data?.institution_type || '—'} icon="□" tone="blue" /><Metric label="Location" value={data?.location || '—'} icon="⌖" tone="gold" /></div></article> }
