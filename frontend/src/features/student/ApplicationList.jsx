import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import {
  Card, StatusBadge, Badge, SkeletonCard, ErrorState, EmptyState, Tabs, Button, Modal, Alert,
} from '../../components/ui/index.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { FileText, Building2, Calendar, ChevronRight, Briefcase } from 'lucide-react'

const TAB_STATUSES = {
  all:        null,
  active:     ['APPLIED','UNDER_REVIEW','SHORTLISTED','ASSESSMENT','INTERVIEW'],
  selected:   ['SELECTED'],
  closed:     ['REJECTED','WITHDRAWN'],
}

function useApplications() {
  return useQuery({
    queryKey: ['student', 'applications'],
    queryFn: () => api.get('/students/me/applications').then((r) => r.data.data),
  })
}

function AppCard({ app }) {
  const toast = useToast()
  const qc = useQueryClient()
  const [withdrawOpen, setWithdrawOpen] = useState(false)

  const withdrawMut = useMutation({
    mutationFn: () => api.post(`/students/me/applications/${app.id}/withdraw`),
    onSuccess: () => { toast.success('Application withdrawn'); qc.invalidateQueries(['student', 'applications']); setWithdrawOpen(false) },
    onError: (err) => toast.error(err.message),
  })

  const canWithdraw = ['APPLIED', 'UNDER_REVIEW'].includes(app.status)

  return (
    <>
      <Card className="card-padded">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--bg-overlay)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.875rem', color: 'var(--accent-primary)', flexShrink: 0,
          }}>
            {app.company_name?.charAt(0) || 'C'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{app.opportunity_title}</h3>
              <StatusBadge status={app.status} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={12} />{app.company_name}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={12} /> Applied {new Date(app.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
              {app.match_score && (
                <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.8125rem' }}>
                  {Math.round(app.match_score)}% match
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to={`/student/applications/${app.id}`}>
                <button className="btn btn-secondary btn-sm">View details <ChevronRight size={12} /></button>
              </Link>
              {canWithdraw && (
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error-600)' }} onClick={() => setWithdrawOpen(true)}>
                  Withdraw
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Modal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        title="Withdraw application"
        footer={
          <>
            <Button variant="secondary" onClick={() => setWithdrawOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={withdrawMut.isPending} onClick={() => withdrawMut.mutate()}>
              Confirm withdrawal
            </Button>
          </>
        }
      >
        <Alert variant="warning">
          Are you sure you want to withdraw your application to <strong>{app.opportunity_title}</strong>? This action cannot be undone.
        </Alert>
      </Modal>
    </>
  )
}

export default function ApplicationList() {
  const { data, isLoading, error, refetch } = useApplications()
  const [tab, setTab] = useState('all')

  if (isLoading) return (
    <div>
      <div className="section-header"><div className="skeleton" style={{ height: 28, width: 200 }} /></div>
      {[0,1,2].map((i) => <SkeletonCard key={i} lines={3} style={{ marginBottom: 12 }} />)}
    </div>
  )
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const items = data?.items || []
  const counts = data?.counts || []
  const countMap = Object.fromEntries(counts.map((c) => [c.status, c.count]))
  const total = items.length

  const filtered = tab === 'all' ? items : items.filter((a) => (TAB_STATUSES[tab] || []).includes(a.status))

  const tabs = [
    { key: 'all',      label: 'All',       count: total },
    { key: 'active',   label: 'Active',    count: items.filter((a) => ['APPLIED','UNDER_REVIEW','SHORTLISTED','ASSESSMENT','INTERVIEW'].includes(a.status)).length },
    { key: 'selected', label: 'Selected',  count: items.filter((a) => a.status === 'SELECTED').length },
    { key: 'closed',   label: 'Closed',    count: items.filter((a) => ['REJECTED','WITHDRAWN'].includes(a.status)).length },
  ]

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">APPLICATIONS</p>
          <h1 className="section-title">My Applications</h1>
          <p className="section-desc">{total} total applications</p>
        </div>
        <Link to="/student/opportunities">
          <button className="btn btn-primary"><Briefcase size={14} /> Browse Opportunities</button>
        </Link>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {filtered.length === 0 ? (
        <Card className="card-padded">
          <EmptyState
            icon={FileText}
            title="No applications here"
            description="Your applications will appear here once you apply to opportunities."
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {filtered.map((app) => <AppCard key={app.id} app={app} />)}
        </div>
      )}
    </div>
  )
}
