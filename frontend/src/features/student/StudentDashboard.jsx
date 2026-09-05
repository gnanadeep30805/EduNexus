import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import {
  Card, ProgressRing, Progress, Badge, StatusBadge, SkeletonCard, ErrorState, EmptyState,
  InlineLoading, SkillLevel,
} from '../../components/ui/index.jsx'
import {
  TrendingUp, Target, BookOpen, Briefcase, ArrowRight, CheckCircle,
  AlertTriangle, Zap, Star, Activity, FileText,
} from 'lucide-react'

function useStudentDashboard() {
  return useQuery({
    queryKey: ['student', 'dashboard'],
    queryFn: () => api.get('/students/me/dashboard').then((r) => r.data.data),
  })
}

function MetricCard({ label, value, sub, icon: Icon, iconColor }) {
  return (
    <div className="metric-card">
      <div className="metric-label">
        <Icon size={13} style={{ color: iconColor }} />
        {label}
      </div>
      <div className="metric-value">{value ?? '—'}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  )
}

function ReadinessCard({ readiness, skills, assessedSkills }) {
  return (
    <Card className="card-padded" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
      <ProgressRing value={readiness} size={90} strokeWidth={8} />
      <div>
        <p className="section-eyebrow">Placement Readiness</p>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em', margin: '2px 0' }}>
          {readiness}%
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          {skills} skills · {assessedSkills} assessed
        </p>
        <Link to="/student/skill-gaps" style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          View skill gaps <ArrowRight size={12} />
        </Link>
      </div>
    </Card>
  )
}

function GapList({ gaps }) {
  if (!gaps?.length) return (
    <EmptyState icon={CheckCircle} title="No skill gaps detected" description="You meet the requirements for all published opportunities." />
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      {gaps.slice(0, 5).map((gap) => (
        <div key={gap.skill} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--radius-md)',
            background: gap.priority === 'MANDATORY' ? 'var(--color-error-50)' : 'var(--color-warning-50)',
            color: gap.priority === 'MANDATORY' ? 'var(--color-error-500)' : 'var(--color-warning-500)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Target size={14} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{gap.skill}</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
              Current: {gap.currentLevel} → Required: {gap.requiredLevel}
            </div>
          </div>
          <Badge variant={gap.priority === 'MANDATORY' ? 'error' : 'warning'}>
            {gap.priority === 'MANDATORY' ? 'Required' : 'Preferred'}
          </Badge>
        </div>
      ))}
    </div>
  )
}

function NextActions({ actions }) {
  if (!actions?.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {actions.map((action, i) => (
        <div key={i} className="inline-banner" style={{ padding: '0.625rem 0.875rem' }}>
          <Zap size={14} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.8125rem' }}>{action}</span>
        </div>
      ))}
    </div>
  )
}

export default function StudentDashboard() {
  const { data, isLoading, error, refetch } = useStudentDashboard()

  if (isLoading) return (
    <div>
      <div className="section-header"><div><div className="section-eyebrow">STUDENT WORKSPACE</div><div className="skeleton" style={{ height: 28, width: 260, marginTop: 6 }} /></div></div>
      <div className="metric-grid" style={{ marginBottom: '1.5rem' }}>
        {[0,1,2,3].map((i) => <SkeletonCard key={i} lines={2} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <SkeletonCard lines={5} /> <SkeletonCard lines={5} />
      </div>
    </div>
  )

  if (error) return <ErrorState title="Dashboard unavailable" message={error.message} onRetry={refetch} />

  const metrics = data?.metrics || {}
  const gaps = data?.gaps || []
  const skills = data?.skills || []
  const profile = data?.profile || {}
  const nextActions = data?.nextActions || []
  const firstName = profile?.first_name || 'Student'

  return (
    <div>
      {/* Header */}
      <div className="section-header">
        <div>
          <p className="section-eyebrow">STUDENT WORKSPACE</p>
          <h1 className="section-title">Good {getGreeting()}, {firstName} ✦</h1>
          <p className="section-desc">Live skill signals, gaps and opportunities tailored to you.</p>
        </div>
        <Link to="/student/opportunities">
          <button className="btn btn-primary">
            <Briefcase size={14} /> Browse Opportunities
          </button>
        </Link>
      </div>

      {/* Metrics */}
      <div className="metric-grid" style={{ marginBottom: '1.5rem' }}>
        <MetricCard label="Skills" value={metrics.skills} sub={`${metrics.assessedSkills} assessed`} icon={Star} iconColor="var(--color-warning-500)" />
        <MetricCard label="Evidence Items" value={metrics.evidence} sub="across your skills" icon={CheckCircle} iconColor="var(--color-success-500)" />
        <MetricCard label="Projects" value={metrics.projects} sub={`${metrics.certifications} certifications`} icon={FileText} iconColor="var(--accent-primary)" />
        <MetricCard label="Profile" value={`${metrics.profileCompletion}%`} sub="completion" icon={Activity} iconColor="var(--color-info-500)" />
      </div>

      {/* Main content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {/* Readiness + Gaps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <ReadinessCard
            readiness={metrics.readiness || 0}
            skills={metrics.skills || 0}
            assessedSkills={metrics.assessedSkills || 0}
          />

          <Card className="card-padded">
            <div className="card-header">
              <div>
                <p className="section-eyebrow" style={{ marginBottom: 0 }}>SKILL GAPS</p>
                <h3 className="card-title">Top gaps to close</h3>
              </div>
              <Link to="/student/skill-gaps" style={{ fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <GapList gaps={gaps} />
          </Card>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Next actions */}
          {nextActions.length > 0 && (
            <Card className="card-padded">
              <div className="card-header"><h3 className="card-title">Recommended actions</h3></div>
              <NextActions actions={nextActions} />
            </Card>
          )}

          {/* Recent skills */}
          <Card className="card-padded">
            <div className="card-header">
              <h3 className="card-title">Your skills</h3>
              <Link to="/student/skill-passport" style={{ fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                Passport <ArrowRight size={12} />
              </Link>
            </div>
            {skills.length === 0 ? (
              <EmptyState icon={Star} title="No skills yet" description="Add skills to build your passport." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {skills.slice(0, 6).map((skill) => (
                  <div key={skill.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{skill.name}</div>
                      <SkillLevel level={skill.verified_level || skill.self_level} showLabel={false} />
                    </div>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                      {skill.evidence_count} evidence
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick links */}
          <Card className="card-padded">
            <h3 className="card-title" style={{ marginBottom: '0.875rem' }}>Quick actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { label: 'Take an assessment',     to: '/student/assessments',   icon: CheckCircle },
                { label: 'Browse opportunities',   to: '/student/opportunities', icon: Briefcase },
                { label: 'View learning plan',     to: '/student/learning',      icon: BookOpen },
                { label: 'Update your profile',    to: '/student/profile',       icon: Activity },
              ].map(({ label, to, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '0.5rem 0.5rem', borderRadius: 'var(--radius-md)',
                    fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)',
                    textDecoration: 'none', transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '' }}
                >
                  <Icon size={14} style={{ color: 'var(--accent-primary)' }} />
                  {label}
                  <ArrowRight size={12} style={{ marginLeft: 'auto' }} />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .student-main-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
