import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { Card, Badge, SkeletonCard, ErrorState, EmptyState } from '../../components/ui/index.jsx'
import { TrendingUp, Building2, GraduationCap, Calendar } from 'lucide-react'

function usePlacements() {
  return useQuery({
    queryKey: ['academia', 'placements'],
    queryFn: () => api.get('/academia/placements').then(r => r.data.data),
  })
}

export default function PlacementTracker() {
  const { data, isLoading, error, refetch } = usePlacements()
  if (isLoading) return <SkeletonCard lines={8} />
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const placements = data?.placements || data?.items || []
  const metrics    = data?.metrics || {}
  const byCompany  = {}
  placements.forEach(p => {
    const key = p.company_name || 'Unknown'
    if (!byCompany[key]) byCompany[key] = []
    byCompany[key].push(p)
  })

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">PLACEMENTS</p>
          <h1 className="section-title">Placement Tracker</h1>
          <p className="section-desc">{placements.length} total placements</p>
        </div>
      </div>

      <div className="metric-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="metric-card">
          <div className="metric-label"><TrendingUp size={12} style={{ color: 'var(--color-success-600)' }} />Total Placed</div>
          <div className="metric-value">{placements.length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label"><Building2 size={12} style={{ color: 'var(--accent-primary)' }} />Companies</div>
          <div className="metric-value">{Object.keys(byCompany).length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Avg. Compensation</div>
          <div className="metric-value">{metrics.avgCompensation || '—'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Highest Package</div>
          <div className="metric-value">{metrics.highestPackage || '—'}</div>
        </div>
      </div>

      {/* By company */}
      {Object.keys(byCompany).length > 1 && (
        <Card className="card-padded" style={{ marginBottom: '1.25rem' }}>
          <h3 className="card-title" style={{ marginBottom: '1rem' }}>Placements by company</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(byCompany).sort((a, b) => b[1].length - a[1].length).slice(0, 8).map(([company, list]) => (
              <div key={company} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '0.8125rem', flex: 1 }}>{company}</span>
                <div style={{ width: 100, height: 6, background: 'var(--bg-overlay)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(list.length / placements.length) * 100}%`, background: 'var(--accent-primary)', borderRadius: 99 }} />
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, width: 24, textAlign: 'right' }}>{list.length}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Placement table */}
      {placements.length === 0 ? (
        <Card className="card-padded"><EmptyState icon={TrendingUp} title="No placements yet" description="Placement records will appear here as students join companies." /></Card>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Student</th><th>Course</th><th>Company</th><th>Role</th><th>Compensation</th><th>Joined</th></tr></thead>
            <tbody>
              {placements.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.student_name}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{p.course || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Building2 size={12} style={{ color: 'var(--text-tertiary)' }} />
                      {p.company_name}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{p.role_title || '—'}</td>
                  <td>
                    {p.compensation
                      ? <span style={{ fontWeight: 700, color: 'var(--color-success-600)' }}>{p.compensation}</span>
                      : '—'}
                  </td>
                  <td style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
                    {p.joined_at ? new Date(p.joined_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
