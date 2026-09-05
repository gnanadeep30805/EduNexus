import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { Card, Badge, StatusBadge, SkeletonCard, ErrorState, EmptyState } from '../../components/ui/index.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { PieChart, ChevronRight } from 'lucide-react'

const COLUMNS = [
  { key: 'APPLIED',      label: 'Applied',       color: 'var(--text-tertiary)' },
  { key: 'UNDER_REVIEW', label: 'Under Review',  color: 'var(--color-info-500)' },
  { key: 'SHORTLISTED',  label: 'Shortlisted',   color: 'var(--accent-primary)' },
  { key: 'INTERVIEW',    label: 'Interview',      color: 'var(--color-warning-500)' },
  { key: 'SELECTED',     label: 'Selected',       color: 'var(--color-success-500)' },
  { key: 'REJECTED',     label: 'Rejected',       color: 'var(--color-error-500)' },
]

function useRecruitment() {
  return useQuery({
    queryKey: ['industry', 'recruitment'],
    queryFn: () => api.get('/industry/recruitment').then(r => r.data.data),
  })
}

function AppCard({ app, onMove }) {
  const moveable = ['APPLIED','UNDER_REVIEW','SHORTLISTED','INTERVIEW']
  const nextMap = { APPLIED: 'UNDER_REVIEW', UNDER_REVIEW: 'SHORTLISTED', SHORTLISTED: 'INTERVIEW', INTERVIEW: 'SELECTED' }

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-base)', borderRadius: 'var(--radius-md)',
      padding: '0.75rem', marginBottom: 8, boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: 2, color: 'var(--text-primary)' }}>
        {app.student_name}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
        {app.opportunity_title}
      </div>
      {app.match_score && (
        <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 6 }}>
          {Math.round(app.match_score)}% match
        </div>
      )}
      <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginBottom: 6 }}>
        {new Date(app.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
      </div>
      {moveable.includes(app.status) && nextMap[app.status] && (
        <button
          className="btn btn-primary btn-sm"
          style={{ fontSize: '0.625rem', padding: '3px 8px', width: '100%', justifyContent: 'center' }}
          onClick={() => onMove(app.id, nextMap[app.status])}
        >
          Move to {nextMap[app.status].replace(/_/g, ' ')} →
        </button>
      )}
    </div>
  )
}

export default function RecruitmentPipeline() {
  const toast = useToast()
  const qc = useQueryClient()
  const { data, isLoading, error, refetch } = useRecruitment()

  const moveMut = useMutation({
    mutationFn: ({ id, status }) => api.post(`/industry/recruitment/${id}/move`, { status }),
    onSuccess: () => { toast.success('Candidate moved'); qc.invalidateQueries(['industry', 'recruitment']) },
    onError: err => toast.error(err.message),
  })

  if (isLoading) return <div className="metric-grid">{[0,1,2,3,4,5].map(i => <SkeletonCard key={i} lines={4} />)}</div>
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const applications = data?.applications || []

  const grouped = {}
  COLUMNS.forEach(c => { grouped[c.key] = [] })
  applications.forEach(app => {
    if (grouped[app.status]) grouped[app.status].push(app)
    else grouped['APPLIED']?.push(app)
  })

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">RECRUITMENT</p>
          <h1 className="section-title">Recruitment Pipeline</h1>
          <p className="section-desc">{applications.length} total candidates · Move cards to advance them</p>
        </div>
      </div>

      {applications.length === 0 ? (
        <Card className="card-padded">
          <EmptyState icon={PieChart} title="No applications yet" description="Applications will appear here once students apply to your opportunities." />
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLUMNS.length}, minmax(180px, 1fr))`, gap: '0.75rem', overflowX: 'auto', paddingBottom: '1rem' }}>
          {COLUMNS.map(col => (
            <div key={col.key} style={{ minWidth: 180 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-overlay)', marginBottom: '0.75rem',
                borderTop: `3px solid ${col.color}`,
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{col.label}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: col.color }}>{grouped[col.key]?.length || 0}</span>
              </div>
              <div style={{ minHeight: 120 }}>
                {(grouped[col.key] || []).map(app => (
                  <AppCard key={app.id} app={app} onMove={(id, status) => moveMut.mutate({ id, status })} />
                ))}
                {(grouped[col.key] || []).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-tertiary)', border: '1px dashed var(--border-base)', borderRadius: 'var(--radius-md)' }}>
                    Empty
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
