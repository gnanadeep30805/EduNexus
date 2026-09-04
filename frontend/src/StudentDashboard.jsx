import { useEffect, useMemo, useState } from 'react'
import './student.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const sections = [
  ['dashboard', 'Dashboard', '⌂'], ['profile', 'Profile', '◎'], ['skills', 'Skills', '◆'],
  ['passport', 'Skill Passport', '✦'], ['gaps', 'Skill Gaps', '↗'], ['career', 'Career Path', '◇'],
  ['learning', 'Learning', '◷'], ['assessments', 'Assessments', '✓'],
]

async function request(path, token, options = {}) {
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) } })
  const result = await response.json()
  if (!response.ok || !result.success) throw new Error(result.error?.message || 'Unable to load student data')
  return result.data
}

function label(value) { return String(value || '').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) }

export default function StudentDashboard({ token, profile, onSignOut }) {
  const [section, setSection] = useState('dashboard')
  const [dashboard, setDashboard] = useState(null)
  const [studentProfile, setStudentProfile] = useState(null)
  const [skillsData, setSkillsData] = useState(null)
  const [gaps, setGaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function load() {
    setLoading(true); setError('')
    try {
      const [dashboardResult, profileResult, skillsResult, gapsResult] = await Promise.all([
        request('/students/me/dashboard', token), request('/students/me/profile', token), request('/students/me/skills', token), request('/students/me/skill-gaps', token),
      ])
      setDashboard(dashboardResult); setStudentProfile(profileResult); setSkillsData(skillsResult); setGaps(gapsResult.gaps || [])
    } catch (loadError) { setError(loadError.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [token])

  async function addSkill(event) {
    event.preventDefault(); const form = new FormData(event.currentTarget)
    try { await request('/students/me/skills', token, { method: 'POST', body: JSON.stringify({ name: form.get('name'), level: form.get('level') }) }); event.currentTarget.reset(); setNotice('Skill added to your passport'); await load() } catch (saveError) { setError(saveError.message) }
  }

  async function saveProfile(event) {
    event.preventDefault(); const form = new FormData(event.currentTarget)
    try { await request('/students/me/profile', token, { method: 'PATCH', body: JSON.stringify(Object.fromEntries(form.entries())) }); setNotice('Profile updated'); await load() } catch (saveError) { setError(saveError.message) }
  }

  const activeTitle = sections.find(([key]) => key === section)?.[1] || 'Dashboard'
  const metrics = dashboard?.metrics || {}
  const firstName = studentProfile?.firstName || profile?.user?.fullName?.split(' ')[0] || 'Student'

  if (loading && !dashboard) return <main className="student-state"><div className="student-state-card"><span className="student-spinner" /><p className="student-kicker">STUDENT WORKSPACE</p><h1>Building your career view</h1><p>Loading your live skills, profile, and opportunities.</p></div></main>
  if (error && !dashboard) return <main className="student-state"><div className="student-state-card"><p className="student-kicker">STUDENT WORKSPACE</p><h1>Workspace unavailable</h1><p>{error}</p><button className="student-button" onClick={load}>Try again</button><button className="student-link" onClick={onSignOut}>Sign out</button></div></main>

  return <div className="student-shell">
    <aside className="student-sidebar">
      <div className="student-brand"><span className="student-mark">E</span><span>EduNexus</span></div>
      <div className="student-profile-mini"><span>{firstName.slice(0, 2).toUpperCase()}</span><div><strong>{studentProfile?.first_name} {studentProfile?.last_name}</strong><small>{studentProfile?.course || 'Student workspace'}</small></div></div>
      <nav aria-label="Student navigation"><p className="student-nav-label">MY CAREER SPACE</p>{sections.map(([key, title, icon]) => <button key={key} className={`student-nav-item ${section === key ? 'active' : ''}`} onClick={() => setSection(key)}><span>{icon}</span>{title}</button>)}</nav>
      <div className="student-sidebar-foot"><button className="student-nav-item" onClick={onSignOut}><span>↪</span>Sign out</button><small>Build evidence. Grow with intent.</small></div>
    </aside>
    <main className="student-main">
      <header className="student-topbar"><button className="student-mobile-menu" aria-label="Open navigation">☰</button><div className="student-breadcrumb">Student <span>/</span> {activeTitle}</div><div className="student-top-actions"><button aria-label="Search">⌕</button><button aria-label="Notifications">♧</button><button className="student-user" onClick={onSignOut}><span>{firstName.slice(0, 2).toUpperCase()}</span><b>{firstName}</b>⌄</button></div></header>
      <div className="student-page">
        {notice && <div className="student-notice" role="status">✓ {notice}<button onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
        {error && <div className="student-error" role="alert">{error}<button onClick={() => setError('')}>Dismiss</button></div>}
        {section === 'dashboard' && <DashboardView firstName={firstName} dashboard={dashboard} metrics={metrics} onSelect={setSection} />}
        {section === 'profile' && <ProfileView profile={studentProfile} onSubmit={saveProfile} />}
        {section === 'skills' && <SkillsView data={skillsData} onSubmit={addSkill} />}
        {section === 'passport' && <PassportView skills={skillsData?.skills || []} />}
        {section === 'gaps' && <GapsView gaps={gaps} />}
        {section === 'career' && <CareerView gaps={gaps} />}
        {section === 'learning' && <LearningView gaps={gaps} />}
        {section === 'assessments' && <EmptyView title="Assessments" copy="Assessment attempts will appear here as your skill history grows." action="Explore skill gaps" onAction={() => setSection('gaps')} />}
      </div>
    </main>
  </div>
}

function Header({ kicker, title, copy, action, onAction }) { return <section className="student-heading"><div><p className="student-kicker">{kicker}</p><h1>{title}</h1><p>{copy}</p></div>{action && <button className="student-button" onClick={onAction}>{action} <span>→</span></button>}</section> }

function DashboardView({ firstName, dashboard, metrics, onSelect }) { return <><Header kicker="YOUR CAREER WORKSPACE" title={<>Good morning, {firstName} <i>✦</i></>} copy="A clear view of where you are, what matters next, and how to move forward." action="Complete profile" onAction={() => onSelect('profile')} /><section className="student-metric-grid"><Metric label="Profile completion" value={`${metrics.profileCompletion || 0}%`} note="Keep your story current" tone="violet" /><Metric label="Skill readiness" value={`${metrics.readiness || 0}%`} note={`${metrics.assessedSkills || 0} assessed skills`} tone="teal" /><Metric label="Evidence collected" value={metrics.evidence || 0} note={`${metrics.projects || 0} projects documented`} tone="amber" /><Metric label="Active skill gaps" value={dashboard?.gaps?.length || 0} note="Prioritized for your goal" tone="coral" /></section><div className="student-grid-two"><article className="student-panel readiness-panel"><PanelTitle kicker="SKILL PASSPORT" title="Your progress, with proof" action="Open passport" onAction={() => onSelect('passport')} /><div className="readiness-row"><div className="readiness-ring" style={{ '--progress': `${metrics.readiness || 0}%` }}><strong>{metrics.readiness || 0}<small>%</small></strong></div><div><h3>{metrics.readiness >= 70 ? 'You are gaining momentum' : 'Your next proof point is clear'}</h3><p>{metrics.evidence ? `${metrics.evidence} pieces of evidence support your skills.` : 'Add a project or certification to make your skills more credible.'}</p><button className="student-link" onClick={() => onSelect('skills')}>Strengthen my passport →</button></div></div></article><article className="student-panel action-panel"><PanelTitle kicker="NEXT BEST MOVES" title="Small steps, visible progress" /><div className="action-list">{(dashboard?.nextActions?.length ? dashboard.nextActions : ['Complete your profile', 'Add evidence to a skill', 'Review your skill gaps']).map((action, index) => <button key={action} onClick={() => onSelect(index === 0 ? 'profile' : index === 1 ? 'skills' : 'gaps')}><span>0{index + 1}</span><b>{action}</b><i>↗</i></button>)}</div></article></div><article className="student-panel gap-panel"><PanelTitle kicker="DEMAND SIGNALS" title="Skills employers are asking for" action="View all gaps" onAction={() => onSelect('gaps')} /><div className="gap-list">{(dashboard?.gaps || []).map((gap) => <div className="gap-row" key={`${gap.skill}-${gap.role}`}><div><strong>{gap.skill}</strong><small>{gap.role} · {gap.currentLevel} → {gap.requiredLevel}</small></div><span className={`student-badge ${gap.priority === 'MANDATORY' ? 'priority' : ''}`}>{label(gap.priority)}</span></div>)}{!dashboard?.gaps?.length && <EmptyText copy="Your current skills align with the available demand signals." />}</div></article></> }

function PanelTitle({ kicker, title, action, onAction }) { return <div className="student-panel-title"><div><p className="student-kicker">{kicker}</p><h2>{title}</h2></div>{action && <button className="student-link" onClick={onAction}>{action} →</button>}</div> }
function Metric({ label: metricLabel, value, note, tone }) { return <article className={`student-metric ${tone}`}><span>{metricLabel}</span><strong>{value}</strong><small>{note}</small></article> }

function ProfileView({ profile, onSubmit }) { return <><Header kicker="YOUR FOUNDATION" title="Profile" copy="Keep the details behind your ambition clear and current." /><form className="student-panel profile-form" onSubmit={onSubmit}><PanelTitle kicker="PERSONAL INFORMATION" title="Tell your story" /><div className="student-form-grid"><Field name="first_name" label="First name" value={profile?.first_name} /><Field name="last_name" label="Last name" value={profile?.last_name} /><Field name="institution_name" label="Institution" value={profile?.institution_name} /><Field name="course" label="Course" value={profile?.course} /><Field name="graduation_year" label="Graduation year" value={profile?.graduation_year} type="number" /><Field name="location" label="Location" value={profile?.location} /><label className="wide-field">Bio<textarea name="bio" defaultValue={profile?.bio || ''} rows="4" placeholder="What are you learning, building, or working toward?" /></label><Field name="portfolio_url" label="Portfolio URL" value={profile?.portfolio_url} /></div><button className="student-button">Save profile <span>→</span></button></form></> }
function Field({ name, label: fieldLabel, value, type = 'text' }) { return <label>{fieldLabel}<input name={name} type={type} defaultValue={value || ''} /></label> }
function SkillsView({ data, onSubmit }) { const [search, setSearch] = useState(''); const available = useMemo(() => (data?.available || []).filter((skill) => skill.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8), [data, search]); return <><Header kicker="SKILL INTELLIGENCE" title="Skills" copy="Build a skill set you can explain, evidence, and grow." /><div className="student-grid-two"><form className="student-panel add-skill-form" onSubmit={onSubmit}><PanelTitle kicker="ADD A SKILL" title="What are you practicing?" /><input name="name" list="skill-options" placeholder="Search the shared taxonomy" required onChange={(event) => setSearch(event.target.value)} /><datalist id="skill-options">{available.map((skill) => <option key={skill.id} value={skill.name} />)}</datalist><select name="level" defaultValue="BASIC"><option value="BASIC">Basic</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option><option value="EXPERT">Expert</option></select><button className="student-button">Add to passport <span>＋</span></button></form><article className="student-panel"><PanelTitle kicker="YOUR INVENTORY" title={`${data?.skills?.length || 0} skills in focus`} /><div className="skill-card-list">{(data?.skills || []).map((skill) => <div className="skill-card" key={skill.id}><span className="skill-orb">{skill.name.slice(0, 1)}</span><div><strong>{skill.name}</strong><small>{label(skill.category)} · {label(skill.verified_level || skill.self_level)}</small></div><span className="student-badge">{skill.evidence_count ? `${skill.evidence_count} proof` : 'Needs proof'}</span></div>)}{!data?.skills?.length && <EmptyText copy="Add your first skill to start your passport." />}</div></article></div></> }
function PassportView({ skills }) { return <><Header kicker="PROFESSIONAL IDENTITY" title="Skill Passport" copy="A living record of what you know and how you can prove it." /><article className="passport-hero"><div><p className="student-kicker">EDUNEXUS SKILL PASSPORT</p><h2>Evidence-backed skills<br />open better doors.</h2><p>Self-declared skills become more trusted as you add assessments, projects, and verified evidence.</p></div><div className="passport-seal">E<br /><small>PASSPORT</small></div></article><article className="student-panel passport-list"><PanelTitle kicker="CREDENTIALS" title="Your skills at a glance" />{skills.map((skill) => <div className="passport-row" key={skill.id}><div className="passport-skill"><span className="skill-orb">{skill.name.slice(0, 1)}</span><div><strong>{skill.name}</strong><small>{label(skill.category)}</small></div></div><div><span className="trust-label">{skill.verified_level ? 'Assessed' : 'Self declared'}</span><small>{label(skill.verified_level || skill.self_level)} · {skill.evidence_count} evidence</small></div><div className="passport-bar"><span style={{ width: `${(skill.verified_level ? 75 : 35) + Math.min(skill.evidence_count * 10, 25)}%` }} /></div></div>)}{!skills.length && <EmptyText copy="Your passport will appear here once you add skills." />}</article></> }
function GapsView({ gaps }) { return <><Header kicker="SKILL INTELLIGENCE" title="Skill gaps" copy="Turn career requirements into a focused, actionable learning queue." /><div className="student-gap-hero"><div><p className="student-kicker">TARGET SIGNALS</p><h2>Your next advantage is specific.</h2><p>These gaps are calculated by comparing your verified skills with live published role requirements.</p></div><strong>{gaps.length}<small>priority gaps</small></strong></div><div className="gap-detail-list">{gaps.map((gap) => <article className="student-panel gap-detail" key={`${gap.skill}-${gap.role}`}><div className="gap-detail-head"><div><span className="student-badge priority">{label(gap.priority)}</span><h2>{gap.skill}</h2><p>{gap.role}</p></div><strong>{gap.currentLevel}<span>current</span></strong><b>→</b><strong>{gap.requiredLevel}<span>required</span></strong></div><div className="gap-explanation"><span>Gap of {gap.gap} level{gap.gap === 1 ? '' : 's'}</span><p>{gap.recommendation}</p><button className="student-link">Create learning plan →</button></div></article>)}{!gaps.length && <EmptyView title="No priority gaps" copy="Your current profile aligns with the available role requirements." />}</div></> }
function CareerView({ gaps }) { return <><Header kicker="CAREER DIRECTION" title="Career path" copy="See the sequence between where you are and where you want to go." /><article className="student-panel career-path"><PanelTitle kicker="YOUR JOURNEY" title="From curious to career ready" /><div className="journey">{['Profile', 'Skill gap', 'Learning', 'Assessment', 'Project', 'Career ready'].map((step, index) => <div className={index === 1 && gaps.length ? 'journey-step current' : 'journey-step'} key={step}><span>{String(index + 1).padStart(2, '0')}</span><strong>{step}</strong>{index < 5 && <i>↓</i>}</div>)}</div></article><article className="student-panel career-note"><p className="student-kicker">RECOMMENDED FOCUS</p><h2>{gaps[0] ? `Build confidence in ${gaps[0].skill}` : 'Your path is taking shape'}</h2><p>{gaps[0]?.recommendation || 'Keep adding evidence and assessments to make your direction more visible to future collaborators.'}</p></article></> }
function LearningView({ gaps }) { return <><Header kicker="LEARNING WORKSPACE" title="Learning" copy="Learning recommendations shaped by your current gaps and goals." /><div className="student-grid-two"><article className="student-panel learning-feature"><p className="student-kicker">NEXT RECOMMENDATION</p><h2>{gaps[0] ? `${gaps[0].skill} foundations` : 'Your learning queue is ready'}</h2><p>{gaps[0] ? gaps[0].recommendation : 'Review your skill passport to unlock focused recommendations.'}</p><button className="student-button">Start a plan <span>→</span></button></article><article className="student-panel"><PanelTitle kicker="MY PLANS" title="Progress you can see" /><EmptyText copy="Learning plans will appear here when you choose a skill gap to work on." /></article></div></> }
function EmptyView({ title, copy, action, onAction }) { return <div className="student-empty"><span>✦</span><h2>{title}</h2><p>{copy}</p>{action && <button className="student-button" onClick={onAction}>{action} →</button>}</div> }
function EmptyText({ copy }) { return <p className="student-empty-text">{copy}</p> }