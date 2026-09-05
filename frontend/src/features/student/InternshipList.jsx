import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { Card, Progress, StatusBadge, Badge, SkeletonCard, ErrorState, EmptyState } from '../../components/ui/index.jsx'
import { Briefcase, Calendar, Building2, User, CheckCircle } from 'lucide-react'

function useInternships() {
  return useQuery({
    queryKey: ['student', 'internships'],
    queryFn: () => api.get('/students/me/internships').then(r => r.data.data),
  })
}

function InternshipCard({ internship }) {
  const start = internship.start_date ? new Date(internship.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null
  const end   = internship.end_date   ? new Date(internship.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null
  const progress = internship.progress || 0

  return (
    <Card className="card-padded">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--accent-light)',
          color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          fontWeight: 800, fontSize: '0.875rem',
        }}>
          {internship.company_name?.charAt(0) || 'C'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{internship.role_title || internship.title}</h3>
            <StatusBadge status={internship.status} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={12} />{internship.company_name}</span>
            {internship.mentor_name && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={12} />Mentor: {internship.mentor_name}</span>}
            {start && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} />{start} – {end || 'Ongoing'}</span>}
          </div>
          {internship.status === 'ACTIVE' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>
                <span>Progress</span><span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
          {internship.status === 'COMPLETED' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--color-success-600)', fontWeight: 600 }}>
              <CheckCircle size={13} /> Completed successfully
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export default function InternshipList() {
  const { data, isLoading, error, refetch } = useInternships()
  if (isLoading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[0,1,2].map(i => <SkeletonCard key={i} lines={3} />)}</div>
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const internships = data?.internships || []
  const active = internships.filter(i => i.status === 'ACTIVE')
  const completed = internships.filter(i => i.status === 'COMPLETED')
  const upcoming  = internships.filter(i => i.status === 'UPCOMING')

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">INTERNSHIPS</p>
          <h1 className="section-title">My Internships</h1>
          <p className="section-desc">{internships.length} total internships</p>
        </div>
      </div>

      <div className="metric-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="metric-card">
          <div className="metric-label"><Briefcase size={12} style={{ color: 'var(--color-success-500)' }} />Active</div>
          <div className="metric-value">{active.length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label"><CheckCircle size={12} style={{ color: 'var(--accent-primary)' }} />Completed</div>
          <div className="metric-value">{completed.length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label"><Calendar size={12} style={{ color: 'var(--color-warning-500)' }} />Upcoming</div>
          <div className="metric-value">{upcoming.length}</div>
        </div>
      </div>

      {internships.length === 0 ? (
        <Card className="card-padded">
          <EmptyState icon={Briefcase} title="No internships yet" description="Apply to internship opportunities to see them here once accepted." />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {internships.map(i => <InternshipCard key={i.id} internship={i} />)}
        </div>
      )}
    </div>
  )
}
