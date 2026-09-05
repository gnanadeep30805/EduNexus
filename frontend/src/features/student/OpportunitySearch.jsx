import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import {
  Card, Badge, StatusBadge, SkeletonCard, ErrorState, EmptyState, MatchScore,
} from '../../components/ui/index.jsx'
import {
  Search, MapPin, Clock, Building2, Briefcase, Filter, ChevronRight,
  Wifi, Globe, Calendar,
} from 'lucide-react'

const TYPES = ['All', 'INTERNSHIP', 'JOB', 'LIVE_PROJECT', 'APPRENTICESHIP', 'TRAINING', 'WORKSHOP']
const MODES = ['All', 'REMOTE', 'ONSITE', 'HYBRID']

function useOpportunities(params) {
  return useQuery({
    queryKey: ['student', 'opportunities', params],
    queryFn: () => api.get('/students/me/opportunities', { params }).then((r) => r.data.data),
    keepPreviousData: true,
  })
}

function OpportunityCard({ opp }) {
  const days = opp.application_deadline
    ? Math.max(0, Math.ceil((new Date(opp.application_deadline) - new Date()) / 86400000))
    : null

  return (
    <Link to={`/student/opportunities/${opp.id}`} style={{ textDecoration: 'none' }}>
      <Card className="card-padded" style={{
        cursor: 'pointer', transition: 'all var(--transition-fast)',
        borderColor: 'var(--border-base)',
      }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = '' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--radius-md)',
            background: 'var(--bg-overlay)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            fontWeight: 700, fontSize: '0.875rem', color: 'var(--accent-primary)',
          }}>
            {opp.company?.name?.charAt(0) || 'C'}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{opp.title}</h3>
              <Badge variant={opp.type === 'JOB' ? 'primary' : opp.type === 'INTERNSHIP' ? 'success' : 'info'}>
                {opp.type?.replace(/_/g, ' ')}
              </Badge>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Building2 size={12} /> {opp.company?.name}
              </span>
              {opp.location && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={12} /> {opp.location}
                </span>
              )}
              {opp.work_mode && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {opp.work_mode === 'REMOTE' ? <Wifi size={12} /> : <Globe size={12} />}
                  {opp.work_mode.toLowerCase()}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {opp.stipend && (
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-success-600)' }}>
                  {opp.stipend}
                </span>
              )}
              {days !== null && (
                <span style={{
                  fontSize: '0.75rem', color: days <= 3 ? 'var(--color-error-500)' : 'var(--text-tertiary)',
                  display: 'flex', alignItems: 'center', gap: 3, fontWeight: days <= 3 ? 600 : 400,
                }}>
                  <Clock size={11} /> {days === 0 ? 'Closes today' : `${days}d left`}
                </span>
              )}
              <span style={{ marginLeft: 'auto', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.8125rem' }}>
                View details <ChevronRight size={14} />
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}

export default function OpportunitySearch() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [type, setType]     = useState(searchParams.get('type') || '')
  const [mode, setMode]     = useState(searchParams.get('workMode') || '')
  const [page, setPage]     = useState(1)

  const params = {
    ...(search ? { search } : {}),
    ...(type && type !== 'All' ? { type } : {}),
    ...(mode && mode !== 'All' ? { workMode: mode } : {}),
    page,
    pageSize: 12,
  }

  const { data, isLoading, error, refetch } = useOpportunities(params)

  function applySearch(e) {
    e.preventDefault()
    setPage(1)
  }

  const items = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / 12)

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">OPPORTUNITIES</p>
          <h1 className="section-title">Browse Opportunities</h1>
          <p className="section-desc">{total > 0 ? `${total} active opportunities` : 'Find your next role'}</p>
        </div>
      </div>

      {/* Search + Filters */}
      <Card className="card-padded" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={applySearch} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="search-wrap" style={{ flex: '1 1 300px' }}>
            <Search size={15} className="search-icon" />
            <input
              className="input"
              placeholder="Search roles, companies, skills…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
          <select className="input select" value={type} onChange={(e) => { setType(e.target.value); setPage(1) }} style={{ width: 160 }}>
            {TYPES.map((t) => (
              <option key={t} value={t === 'All' ? '' : t}>{t === 'All' ? 'All types' : t.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <select className="input select" value={mode} onChange={(e) => { setMode(e.target.value); setPage(1) }} style={{ width: 140 }}>
            {MODES.map((m) => (
              <option key={m} value={m === 'All' ? '' : m}>{m === 'All' ? 'All modes' : m}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary">
            <Search size={14} /> Search
          </button>
        </form>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {[0,1,2,3,4].map((i) => <SkeletonCard key={i} lines={3} />)}
        </div>
      ) : error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : items.length === 0 ? (
        <Card className="card-padded">
          <EmptyState
            icon={Briefcase}
            title="No opportunities found"
            description="Try adjusting your search filters or check back later for new opportunities."
          />
        </Card>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {items.map((opp) => <OpportunityCard key={opp.id} opp={opp} />)}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Page {page} of {totalPages}
              </span>
              <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
