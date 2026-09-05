import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { Card, Badge, Button, Input, Textarea, Select, Modal, StatusBadge, SkeletonCard, ErrorState, EmptyState } from '../../components/ui/index.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { Plus, Briefcase, Users, Calendar, Play, Pause, X, Eye } from 'lucide-react'

function useOpportunities() {
  return useQuery({
    queryKey: ['industry', 'opportunities'],
    queryFn: () => api.get('/industry/opportunities').then(r => r.data.data),
  })
}

const TYPE_OPTIONS = ['INTERNSHIP','JOB','LIVE_PROJECT','APPRENTICESHIP','TRAINING','WORKSHOP']
const MODE_OPTIONS = ['REMOTE','ONSITE','HYBRID']

export default function OpportunityManager() {
  const toast = useToast()
  const qc = useQueryClient()
  const { data, isLoading, error, refetch } = useOpportunities()
  const [createOpen, setCreateOpen] = useState(false)

  const createMut = useMutation({
    mutationFn: body => api.post('/industry/opportunities', body),
    onSuccess: () => { toast.success('Opportunity created'); qc.invalidateQueries(['industry', 'opportunities']); setCreateOpen(false) },
    onError: err => toast.error(err.message),
  })

  const actionMut = useMutation({
    mutationFn: ({ id, action }) => api.post(`/industry/opportunities/${id}/${action}`),
    onSuccess: (_, { action }) => { toast.success(`Opportunity ${action}ed`); qc.invalidateQueries(['industry', 'opportunities']) },
    onError: err => toast.error(err.message),
  })

  if (isLoading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[0,1,2].map(i => <SkeletonCard key={i} lines={3} />)}</div>
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const opportunities = data?.items || data?.opportunities || []

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">OPPORTUNITIES</p>
          <h1 className="section-title">Manage Opportunities</h1>
          <p className="section-desc">{opportunities.length} total opportunities</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}><Plus size={14} /> Create Opportunity</button>
      </div>

      {opportunities.length === 0 ? (
        <Card className="card-padded">
          <EmptyState icon={Briefcase} title="No opportunities yet" description="Create your first opportunity to start receiving applications from students." action={<button className="btn btn-primary btn-sm" onClick={() => setCreateOpen(true)}><Plus size={12} /> Create Opportunity</button>} />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {opportunities.map(opp => (
            <Card key={opp.id} className="card-padded">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{opp.title}</h3>
                    <Badge variant={opp.type === 'JOB' ? 'primary' : 'success'}>{opp.type?.replace(/_/g, ' ')}</Badge>
                    <StatusBadge status={opp.status} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={12} />{opp.application_count || 0} applications</span>
                    {opp.application_deadline && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} />Deadline: {new Date(opp.application_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                    {opp.work_mode && <Badge variant="neutral">{opp.work_mode}</Badge>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {opp.status === 'DRAFT' && <button className="btn btn-success btn-sm" onClick={() => actionMut.mutate({ id: opp.id, action: 'publish' })}><Play size={12} /> Publish</button>}
                  {opp.status === 'PUBLISHED' && <button className="btn btn-secondary btn-sm" onClick={() => actionMut.mutate({ id: opp.id, action: 'pause' })}><Pause size={12} /> Pause</button>}
                  {['PUBLISHED', 'PAUSED'].includes(opp.status) && <button className="btn btn-danger btn-sm" onClick={() => actionMut.mutate({ id: opp.id, action: 'close' })}><X size={12} /> Close</button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Opportunity" size="lg"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button form="opp-form" type="submit" loading={createMut.isPending}>Create Opportunity</Button></>}>
        <form id="opp-form" onSubmit={e => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          createMut.mutate({
            title: fd.get('title'), roleTitle: fd.get('role_title'), type: fd.get('type'),
            description: fd.get('description'), location: fd.get('location'), workMode: fd.get('work_mode'),
            duration: fd.get('duration'), stipend: fd.get('stipend'), eligibility: fd.get('eligibility'),
            applicationDeadline: fd.get('application_deadline') || undefined,
          })
        }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input id="opp-title" label="Title" name="title" required placeholder="Software Development Intern" style={{ gridColumn: '1/-1' }} />
          <Input id="opp-role" label="Role title" name="role_title" placeholder="Software Engineer Intern" />
          <Select id="opp-type" label="Type" name="type" required>
            {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </Select>
          <Select id="opp-mode" label="Work mode" name="work_mode">
            {MODE_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
          </Select>
          <Input id="opp-location" label="Location" name="location" placeholder="Mumbai, India" />
          <Input id="opp-duration" label="Duration" name="duration" placeholder="3 months" />
          <Input id="opp-stipend" label="Stipend" name="stipend" placeholder="₹20,000/month" />
          <Input id="opp-deadline" label="Application deadline" name="application_deadline" type="date" />
          <Textarea id="opp-desc" label="Description" name="description" placeholder="Describe the role, responsibilities, and requirements…" style={{ gridColumn: '1/-1' }} />
          <Textarea id="opp-eligibility" label="Eligibility" name="eligibility" placeholder="B.Tech/M.Tech in CS or related field. 3rd or 4th year preferred." style={{ gridColumn: '1/-1' }} />
        </form>
      </Modal>
    </div>
  )
}
