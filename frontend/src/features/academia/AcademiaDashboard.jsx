import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { Card, Progress, SkeletonCard, ErrorState } from '../../components/ui/index.jsx'
import { Users, Briefcase, BarChart3, GraduationCap, TrendingUp, ArrowRight } from 'lucide-react'

function useAcademiaDashboard() {
  return useQuery({
    queryKey: ['academia', 'dashboard'],
    queryFn: () => api.get('/academia/dashboard').then(r => r.data.data),
  })
}

function MetricCard({ label, value, sub, icon: Icon, iconColor, to }) {
  const inner = (
    <div className="metric-card" style={{ cursor: to ? 'pointer' : 'default', transition: 'all var(--transition-fast)' }}>
      <div className="metric-label"><Icon size={13} style={{ color: iconColor }} />{label}</div>
      <div className="metric-value">{value ?? '—'}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  )
  return to ? <Link to={to} style={{ textDecoration: 'none' }}>{inner}</Link> : inner
}

function SkillDemandChart({ skills }) {
  if (!skills?.length) return <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>No skill data yet.</p>
  const max = Math.max(...skills.map(s => s.industry_demand || s.studentCount || 1), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {skills.slice(0, 8).map(s => (
        <div key={s.name || s.skill_name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8125rem', width: 130, color: 'var(--text-secondary)', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name || s.skill_name}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 3 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.5rem', color: 'var(--text-tertiary)', marginBottom: 2 }}>STUDENTS</div>
                <Progress value={s.student_count || s.studentCount || 0} max={max} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.5rem', color: 'var(--color-warning-600)', marginBottom: 2 }}>DEMAND</div>
                <Progress value={s.industry_demand || s.industryDemand || 0} max={max} variant="warning" />
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', width: 20, textAlign: 'right' }}>{s.student_count || s.studentCount || 0}</span>
        </div>
      ))}
    </div>
  )
}

export default function AcademiaDashboard() {
  const { data, isLoading, error, refetch } = useAcademiaDashboard()
  if (isLoading) return <div className="metric-grid">{[0,1,2,3,4].map(i => <SkeletonCard key={i} lines={2} />)}</div>
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const metrics   = data?.metrics || {}
  const skills    = data?.topSkills || data?.skills || []
  const gaps      = data?.gaps || []
  const institution = data?.institution || {}

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">ACADEMIA WORKSPACE</p>
          <h1 className="section-title">{institution.name || 'Institution Dashboard'}</h1>
          <p className="section-desc">Skill intelligence and placement analytics for your institution</p>
        </div>
      </div>

      <div className="metric-grid" style={{ marginBottom: '1.5rem' }}>
        <MetricCard label="Students" value={metrics.students}        to="/academia/students"   icon={Users}        iconColor="var(--accent-primary)"     sub="enrolled" />
        <MetricCard label="Departments" value={metrics.departments}                             icon={GraduationCap} iconColor="var(--color-info-500)"   sub="active" />
        <MetricCard label="Active Internships" value={metrics.activeInternships} to="/academia/internships" icon={Briefcase} iconColor="var(--color-success-500)" />
        <MetricCard label="Placements" value={metrics.placements}    to="/academia/placements" icon={TrendingUp}   iconColor="var(--color-warning-500)"   sub="this year" />
        <MetricCard label="Skills Mapped" value={metrics.verifiedSkills}                       icon={BarChart3}   iconColor="var(--color-success-600)"   sub="verified by industry" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Skills demand chart */}
        <Card className="card-padded">
          <div className="card-header">
            <div><p className="section-eyebrow" style={{ marginBottom: 0 }}>ANALYTICS</p><h3 className="card-title">Skill demand vs. supply</h3></div>
            <Link to="/academia/skills" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Full analysis →</Link>
          </div>
          <SkillDemandChart skills={skills} />
        </Card>

        {/* Skill gaps */}
        <Card className="card-padded">
          <div className="card-header">
            <div><p className="section-eyebrow" style={{ marginBottom: 0 }}>GAPS</p><h3 className="card-title">Institution skill gaps</h3></div>
            <Link to="/academia/curriculum" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Curriculum →</Link>
          </div>
          {gaps.length === 0 ? (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>No significant gaps detected.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {gaps.slice(0, 6).map(gap => (
                <div key={gap.skill} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-error-500)', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '0.8125rem' }}>{gap.skill}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{gap.studentCoverage}% coverage</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick navigation */}
      <Card className="card-padded" style={{ marginTop: '1rem' }}>
        <h3 className="card-title" style={{ marginBottom: '1rem' }}>Quick navigation</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: '0.75rem' }}>
          {[
            { label: 'Students',      to: '/academia/students',      desc: 'View student directory' },
            { label: 'Internships',   to: '/academia/internships',   desc: 'Monitor active internships' },
            { label: 'Placements',    to: '/academia/placements',    desc: 'Track placement stats' },
            { label: 'Collaborations',to: '/academia/collaborations',desc: 'Industry partnerships' },
            { label: 'Curriculum',    to: '/academia/curriculum',    desc: 'Alignment analysis' },
          ].map(({ label, to, desc }) => (
            <Link key={to} to={to} style={{ textDecoration: 'none' }}>
              <div style={{ padding: '0.875rem', background: 'var(--bg-overlay)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all var(--transition-fast)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-light)'; e.currentTarget.style.color = 'var(--accent-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '' }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
