import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { Card, Badge, SkeletonCard, ErrorState, EmptyState, Avatar } from '../../components/ui/index.jsx'
import { Users, Search, GraduationCap, MapPin, Star } from 'lucide-react'

function useCandidates(params) {
  return useQuery({
    queryKey: ['industry', 'candidates', params],
    queryFn: () => api.get('/industry/candidates', { params }).then(r => r.data.data),
    keepPreviousData: true,
  })
}

function CandidateCard({ candidate }) {
  return (
    <Card className="card-padded" style={{ cursor: 'pointer', transition: 'all var(--transition-fast)' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
        <Avatar name={candidate.full_name || candidate.student_name || 'S'} size="lg" square />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{candidate.full_name || candidate.student_name}</h3>
            {candidate.readiness_score && (
              <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.8125rem' }}>
                {Math.round(candidate.readiness_score)}% ready
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 8, flexWrap: 'wrap' }}>
            {candidate.course && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><GraduationCap size={12} />{candidate.course}</span>}
            {candidate.institution_name && <span>{candidate.institution_name}</span>}
            {candidate.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} />{candidate.location}</span>}
          </div>
          {candidate.skills?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {candidate.skills.slice(0, 6).map((s, i) => (
                <Badge key={i} variant="primary">{typeof s === 'string' ? s : s.name}</Badge>
              ))}
              {candidate.skills.length > 6 && <Badge variant="neutral">+{candidate.skills.length - 6}</Badge>}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export default function CandidateSearch() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const params = { ...(search ? { search } : {}), page, pageSize: 12 }
  const { data, isLoading, error, refetch } = useCandidates(params)

  const candidates = data?.items || data?.candidates || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / 12)

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">CANDIDATES</p>
          <h1 className="section-title">Candidate Search</h1>
          <p className="section-desc">{total > 0 ? `${total} candidates found` : 'Discover student talent'}</p>
        </div>
      </div>

      <Card className="card-padded" style={{ marginBottom: '1.5rem' }}>
        <div className="search-wrap">
          <Search size={15} className="search-icon" />
          <input className="input" style={{ paddingLeft: '2.25rem' }} placeholder="Search by name, skill, course, institution…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
      </Card>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: '0.875rem' }}>
          {[0,1,2,3,4,5].map(i => <SkeletonCard key={i} lines={3} />)}
        </div>
      ) : error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : candidates.length === 0 ? (
        <Card className="card-padded"><EmptyState icon={Users} title="No candidates found" description="Try adjusting your search terms." /></Card>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: '0.875rem', marginBottom: '1.5rem' }}>
            {candidates.map(c => <CandidateCard key={c.id} candidate={c} />)}
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
              <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
