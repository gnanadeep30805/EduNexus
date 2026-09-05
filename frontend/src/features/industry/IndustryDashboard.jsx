import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { Card, Badge, Progress, SkeletonCard, ErrorState, EmptyState } from '../../components/ui/index.jsx'
import { Briefcase, Users, Star, MessageSquare, FileText, TrendingUp, Plus, ArrowRight } from 'lucide-react'

function useIndustryDashboard() {
  return useQuery({
    queryKey: ['industry', 'dashboard'],
    queryFn: () => api.get('/industry/dashboard').then(r => r.data.data),
  })
}

function MetricCard({ label, value, sub, icon: Icon, iconColor }) {
  return (
    <div className="metric-card">
      <div className="metric-label"><Icon size={13} style={{ color: iconColor }} />{label}</div>
      <div className="metric-value">{value ?? '—'}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  )
}

function FunnelChart({ stages }) {
  const max = Math.max(...stages.map(s => s.count), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {stages.map(stage => (
        <div key={stage.label} className="funnel-row">
          <span className="funnel-label">{stage.label}</span>
          <div className="funnel-bar-track"><div className="funnel-bar-fill" style={{ width: `${(stage.count / max) * 100}%` }} /></div>
          <span className="funnel-count">{stage.count}</span>
        </div>
      ))}
    </div>
  )
}

export default function IndustryDashboard() {
  const { data, isLoading, error, refetch } = useIndustryDashboard()
  if (isLoading) return <div className="metric-grid">{[0,1,2,3,4].map(i => <SkeletonCard key={i} lines={2} />)}</div>
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const metrics = data?.metrics || {}
  const pipeline = data?.pipeline || []
  const topSkills = data?.topRequiredSkills || []
  const recentApps = data?.recentApplications || []

  const funnelStages = [
    { label: 'Applied',       count: metrics.applications || 0 },
    { label: 'Under Review',  count: metrics.underReview   || 0 },
    { label: 'Shortlisted',   count: metrics.shortlisted   || 0 },
    { label: 'Interview',     count: metrics.interviews    || 0 },
    { label: 'Offers',        count: metrics.offers        || 0 },
    { label: 'Hired',         count: metrics.hired         || 0 },
  ]

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">INDUSTRY WORKSPACE</p>
          <h1 className="section-title">Recruitment Overview</h1>
          <p className="section-desc">{data?.company?.name || 'Your company'} · Talent dashboard</p>
        </div>
        <Link to="/industry/opportunities">
          <button className="btn btn-primary"><Plus size={14} /> Create Opportunity</button>
        </Link>
      </div>

      <div className="metric-grid" style={{ marginBottom: '1.5rem' }}>
        <MetricCard label="Active Opportunities" value={metrics.activeOpportunities} icon={Briefcase} iconColor="var(--accent-primary)" />
        <MetricCard label="Total Applications"   value={metrics.applications}          icon={FileText}  iconColor="var(--color-info-500)" />
        <MetricCard label="Shortlisted"          value={metrics.shortlisted}           icon={Star}      iconColor="var(--color-warning-500)" />
        <MetricCard label="Interviews"           value={metrics.interviews}            icon={MessageSquare} iconColor="var(--color-success-500)" />
        <MetricCard label="Hired"                value={metrics.hired}                 sub="this cycle"  icon={Users} iconColor="var(--color-success-600)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {/* Funnel */}
        <Card className="card-padded">
          <div className="card-header">
            <div><p className="section-eyebrow" style={{ marginBottom: 0 }}>PIPELINE</p><h3 className="card-title">Recruitment funnel</h3></div>
            <Link to="/industry/recruitment" style={{ fontSize: '0.75rem', fontWeight: 600 }}>View pipeline →</Link>
          </div>
          <FunnelChart stages={funnelStages} />
        </Card>

        {/* Top skills */}
        <Card className="card-padded">
          <div className="card-header">
            <div><p className="section-eyebrow" style={{ marginBottom: 0 }}>SKILLS</p><h3 className="card-title">Most required skills</h3></div>
          </div>
          {topSkills.length === 0
            ? <EmptyState title="No data yet" description="Create opportunities with required skills to see demand." />
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topSkills.slice(0, 7).map((skill, i) => (
                  <div key={skill.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', width: 16 }}>{i + 1}</span>
                    <span style={{ flex: 1, fontSize: '0.8125rem', fontWeight: 500 }}>{skill.name}</span>
                    <Progress value={skill.count} max={topSkills[0]?.count || 1} style={{ width: 80 }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', width: 20, textAlign: 'right' }}>{skill.count}</span>
                  </div>
                ))}
              </div>
            )}
        </Card>
      </div>

      {/* Recent applications */}
      {recentApps.length > 0 && (
        <Card className="card-padded">
          <div className="card-header">
            <h3 className="card-title">Recent applications</h3>
            <Link to="/industry/recruitment" style={{ fontSize: '0.75rem', fontWeight: 600 }}>View all →</Link>
          </div>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Candidate</th><th>Opportunity</th><th>Match</th><th>Applied</th><th>Status</th></tr></thead>
              <tbody>
                {recentApps.map(app => (
                  <tr key={app.id}>
                    <td style={{ fontWeight: 600 }}>{app.student_name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{app.opportunity_title}</td>
                    <td>{app.match_score ? <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{Math.round(app.match_score)}%</span> : '—'}</td>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>{new Date(app.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td><Badge variant={app.status === 'APPLIED' ? 'neutral' : app.status === 'SHORTLISTED' ? 'primary' : 'info'}>{app.status.replace(/_/g, ' ')}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
