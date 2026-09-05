import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { Card, Progress, StatusBadge, Badge, SkeletonCard, ErrorState, EmptyState } from '../../components/ui/index.jsx'
import { Briefcase, Building2, User, Calendar, AlertTriangle } from 'lucide-react'

function useInternships(params) {
  return useQuery({
    queryKey: ['academia', 'internships', params],
    queryFn: () => api.get('/academia/internships', { params }).then(r => r.data.data),
  })
}

const STATUS_OPTIONS = ['ALL','ACTIVE','UPCOMING','COMPLETED','AT_RISK']

function InternshipRow({ internship }) {
  const progress = internship.progress || 0
  const isAtRisk = internship.status === 'AT_RISK' || progress < 20

  return (
    <Card className="card-padded" style={{ borderLeft: `3px solid ${isAtRisk ? 'var(--color-error-500)' : internship.status === 'COMPLETED' ? 'var(--color-success-500)' : 'var(--accent-primary)'}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 700 }}>{internship.student_name}</span>
            <StatusBadge status={internship.status} />
            {isAtRisk && internship.status !== 'AT_RISK' && <Badge variant="warning"><AlertTriangle size={9} style={{ display: 'inline', marginRight: 3 }} />Low progress</Badge>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={12} />{internship.company_name}</span>
            <span>{internship.role_title || internship.title}</span>
            {internship.mentor_name && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={12} />{internship.mentor_name}</span>}
            {internship.start_date && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} />{new Date(internship.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {internship.end_date ? new Date(internship.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Ongoing'}</span>}
          </div>
          {internship.status === 'ACTIVE' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Progress value={progress} style={{ flex: 1 }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>{progress}%</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export default function InternshipMonitoring() {
  const [statusFilter, setStatusFilter] = useState('ALL')
  const params = statusFilter !== 'ALL' ? { status: statusFilter } : {}
  const { data, isLoading, error, refetch } = useInternships(params)

  if (isLoading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[0,1,2,3].map(i => <SkeletonCard key={i} lines={3} />)}</div>
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const internships = data?.internships || data?.items || []
  const metrics = data?.metrics || {}

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">INTERNSHIPS</p>
          <h1 className="section-title">Internship Monitoring</h1>
          <p className="section-desc">{internships.length} internships</p>
        </div>
      </div>

      <div className="metric-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="metric-card"><div className="metric-label">Active</div><div className="metric-value" style={{ color: 'var(--color-success-600)' }}>{metrics.active || internships.filter(i => i.status === 'ACTIVE').length}</div></div>
        <div className="metric-card"><div className="metric-label">Upcoming</div><div className="metric-value">{metrics.upcoming || internships.filter(i => i.status === 'UPCOMING').length}</div></div>
        <div className="metric-card"><div className="metric-label">Completed</div><div className="metric-value">{metrics.completed || internships.filter(i => i.status === 'COMPLETED').length}</div></div>
        <div className="metric-card"><div className="metric-label">At Risk</div><div className="metric-value" style={{ color: 'var(--color-error-500)' }}>{metrics.atRisk || internships.filter(i => i.status === 'AT_RISK').length}</div></div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {STATUS_OPTIONS.map(s => (
          <button key={s} className={`chip ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
            {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {internships.length === 0 ? (
        <Card className="card-padded"><EmptyState icon={Briefcase} title="No internships found" description="Students' internships will appear here once they are enrolled." /></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {internships.map(i => <InternshipRow key={i.id} internship={i} />)}
        </div>
      )}
    </div>
  )
}
