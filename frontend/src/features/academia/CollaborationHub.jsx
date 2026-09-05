import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { Card, Badge, StatusBadge, SkeletonCard, ErrorState, EmptyState } from '../../components/ui/index.jsx'
import { Handshake, Calendar, Filter } from 'lucide-react'

function useCollaborations() {
  return useQuery({
    queryKey: ['academia', 'collaborations'],
    queryFn: () => api.get('/academia/collaborations').then(r => r.data.data),
  })
}

const COLLAB_TYPES = ['ALL','CURRICULUM_DESIGN','GUEST_LECTURE','LIVE_PROJECT','HACKATHON','INTERNSHIP_PROGRAM','PLACEMENT_DRIVE','WORKSHOP']

function CollabCard({ collab }) {
  return (
    <Card className="card-padded">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: 8 }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{collab.title}</h3>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <Badge variant="info">{(collab.type || '').replace(/_/g, ' ')}</Badge>
          <StatusBadge status={collab.status} />
        </div>
      </div>
      {collab.company_name && (
        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: 4 }}>
          {collab.company_name}
        </p>
      )}
      {collab.description && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>
          {collab.description.slice(0, 200)}{collab.description.length > 200 ? '…' : ''}
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
        {collab.target_audience && <span>For: {collab.target_audience}</span>}
        {collab.mode && <Badge variant="neutral">{collab.mode}</Badge>}
        {collab.proposed_date && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={11} />{new Date(collab.proposed_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>
    </Card>
  )
}

export default function CollaborationHub() {
  const { data, isLoading, error, refetch } = useCollaborations()
  const [typeFilter, setTypeFilter] = useState('ALL')

  if (isLoading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[0,1,2].map(i => <SkeletonCard key={i} lines={3} />)}</div>
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const collabs  = data?.collaborations || data?.items || []
  const filtered = typeFilter === 'ALL' ? collabs : collabs.filter(c => c.type === typeFilter)

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">COLLABORATIONS</p>
          <h1 className="section-title">Industry Collaboration Hub</h1>
          <p className="section-desc">{collabs.length} collaboration proposals</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {COLLAB_TYPES.map(t => (
          <button key={t} className={`chip ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>
            {t === 'ALL' ? 'All' : t.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="card-padded">
          <EmptyState icon={Handshake} title="No collaborations" description="Industry collaborations proposed to your institution will appear here." />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {filtered.map(c => <CollabCard key={c.id} collab={c} />)}
        </div>
      )}
    </div>
  )
}
