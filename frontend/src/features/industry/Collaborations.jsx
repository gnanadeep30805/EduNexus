import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { Card, Button, Input, Textarea, Select, Modal, StatusBadge, Badge, SkeletonCard, ErrorState, EmptyState } from '../../components/ui/index.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { Handshake, Plus, Calendar } from 'lucide-react'

const COLLAB_TYPES = ['CURRICULUM_DESIGN','GUEST_LECTURE','LIVE_PROJECT','HACKATHON','INTERNSHIP_PROGRAM','PLACEMENT_DRIVE','WORKSHOP','RESEARCH','OTHER']

function useCollaborations() {
  return useQuery({
    queryKey: ['industry', 'collaborations'],
    queryFn: () => api.get('/industry/collaborations').then(r => r.data.data),
  })
}

function CollabCard({ collab }) {
  return (
    <Card className="card-padded">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: 8 }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{collab.title}</h3>
        <div style={{ display: 'flex', gap: 4 }}>
          <Badge variant="info">{collab.type?.replace(/_/g, ' ')}</Badge>
          <StatusBadge status={collab.status} />
        </div>
      </div>
      {collab.description && <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>{collab.description.slice(0, 160)}{collab.description.length > 160 ? '…' : ''}</p>}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
        {collab.target_audience && <span>For: {collab.target_audience}</span>}
        {collab.proposed_date && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} />{new Date(collab.proposed_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
        {collab.mode && <Badge variant="neutral">{collab.mode}</Badge>}
      </div>
    </Card>
  )
}

export default function Collaborations() {
  const toast = useToast()
  const qc = useQueryClient()
  const { data, isLoading, error, refetch } = useCollaborations()
  const [createOpen, setCreateOpen] = useState(false)

  const createMut = useMutation({
    mutationFn: body => api.post('/industry/collaborations', body),
    onSuccess: () => { toast.success('Collaboration proposed'); qc.invalidateQueries(['industry', 'collaborations']); setCreateOpen(false) },
    onError: err => toast.error(err.message),
  })

  if (isLoading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[0,1,2].map(i => <SkeletonCard key={i} lines={3} />)}</div>
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const collaborations = data?.collaborations || data?.items || []

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">COLLABORATIONS</p>
          <h1 className="section-title">Academia Collaborations</h1>
          <p className="section-desc">Partner with institutions for projects, lectures & more</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}><Plus size={14} /> Propose Collaboration</button>
      </div>

      {collaborations.length === 0 ? (
        <Card className="card-padded">
          <EmptyState icon={Handshake} title="No collaborations yet" description="Propose collaborations with academic institutions." action={<button className="btn btn-primary btn-sm" onClick={() => setCreateOpen(true)}><Plus size={12} /> Propose Collaboration</button>} />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {collaborations.map(c => <CollabCard key={c.id} collab={c} />)}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Propose Collaboration"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button form="collab-form" type="submit" loading={createMut.isPending}>Submit Proposal</Button></>}>
        <form id="collab-form" onSubmit={e => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          createMut.mutate({
            title: fd.get('title'), type: fd.get('type'), description: fd.get('description'),
            targetAudience: fd.get('target_audience'), mode: fd.get('mode'),
            proposedDate: fd.get('proposed_date') || undefined, contact: fd.get('contact') || undefined,
          })
        }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input id="col-title" label="Title" name="title" required placeholder="Guest Lecture Series on Cloud Computing" />
          <Select id="col-type" label="Type" name="type" required>
            {COLLAB_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </Select>
          <Textarea id="col-desc" label="Description" name="description" placeholder="Describe the collaboration, expected outcomes, and what you offer…" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input id="col-audience" label="Target audience" name="target_audience" placeholder="3rd & 4th year B.Tech" />
            <Select id="col-mode" label="Mode" name="mode">
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Offline</option>
              <option value="HYBRID">Hybrid</option>
            </Select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input id="col-date" label="Proposed date" name="proposed_date" type="date" />
            <Input id="col-contact" label="Contact email" name="contact" type="email" placeholder="hr@company.com" />
          </div>
        </form>
      </Modal>
    </div>
  )
}
