import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { Card, Button, Input, Textarea, Select, Modal, StatusBadge, Badge, SkeletonCard, ErrorState, EmptyState } from '../../components/ui/index.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { Plus, MessageSquare, Calendar, Clock } from 'lucide-react'

function useInterviews() {
  return useQuery({
    queryKey: ['industry', 'interviews'],
    queryFn: () => api.get('/industry/interviews').then(r => r.data.data),
  })
}
function useShortlisted() {
  return useQuery({
    queryKey: ['industry', 'recruitment'],
    queryFn: () => api.get('/industry/recruitment').then(r => r.data.data),
  })
}

function InterviewCard({ interview }) {
  const dt = interview.scheduled_at ? new Date(interview.scheduled_at) : null
  const isPast = dt && dt < new Date()
  return (
    <Card className="card-padded" style={{ borderLeft: `3px solid ${isPast ? 'var(--border-base)' : 'var(--accent-primary)'}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{interview.student_name}</h3>
            <Badge variant="neutral">Round {interview.round_number}</Badge>
            <StatusBadge status={interview.status} />
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
            {interview.round_name || 'Interview'} · {interview.opportunity_title}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
            {dt && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} />{dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} at {dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
            {interview.duration_minutes && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} />{interview.duration_minutes} min</span>}
            {interview.mode && <Badge variant="info">{interview.mode}</Badge>}
          </div>
          {interview.meeting_link && (
            <a href={interview.meeting_link} target="_blank" rel="noreferrer" style={{ fontSize: '0.8125rem', fontWeight: 600, marginTop: 6, display: 'inline-block' }}>
              Join meeting →
            </a>
          )}
        </div>
      </div>
    </Card>
  )
}

export default function InterviewManager() {
  const toast = useToast()
  const qc = useQueryClient()
  const { data, isLoading, error, refetch } = useInterviews()
  const { data: recruitData } = useShortlisted()
  const [createOpen, setCreateOpen] = useState(false)

  const createMut = useMutation({
    mutationFn: body => api.post('/industry/interviews', body),
    onSuccess: () => { toast.success('Interview scheduled'); qc.invalidateQueries(['industry', 'interviews']); setCreateOpen(false) },
    onError: err => toast.error(err.message),
  })

  if (isLoading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[0,1,2].map(i => <SkeletonCard key={i} lines={3} />)}</div>
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const interviews = data?.interviews || []
  const shortlisted = (recruitData?.applications || []).filter(a => a.status === 'SHORTLISTED')
  const now = new Date()
  const upcoming = interviews.filter(i => i.scheduled_at && new Date(i.scheduled_at) >= now)
  const past     = interviews.filter(i => i.scheduled_at && new Date(i.scheduled_at) < now)

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">INTERVIEWS</p>
          <h1 className="section-title">Interview Management</h1>
          <p className="section-desc">{upcoming.length} upcoming · {past.length} past</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}><Plus size={14} /> Schedule Interview</button>
      </div>

      {interviews.length === 0 ? (
        <Card className="card-padded">
          <EmptyState icon={MessageSquare} title="No interviews yet" description="Shortlist candidates and schedule interviews to see them here." action={<button className="btn btn-primary btn-sm" onClick={() => setCreateOpen(true)}><Plus size={12} /> Schedule Interview</button>} />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {upcoming.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>📅 Upcoming</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {upcoming.map(i => <InterviewCard key={i.id} interview={i} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)' }}>Past interviews</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {past.map(i => <InterviewCard key={i.id} interview={i} />)}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Schedule Interview"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button form="int-form" type="submit" loading={createMut.isPending}>Schedule</Button></>}>
        <form id="int-form" onSubmit={e => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          createMut.mutate({
            applicationId: fd.get('application_id'), roundNumber: Number(fd.get('round_number')),
            roundName: fd.get('round_name'), scheduledAt: fd.get('scheduled_at'),
            durationMinutes: Number(fd.get('duration_minutes')), mode: fd.get('mode'),
            meetingLink: fd.get('meeting_link') || undefined, notes: fd.get('notes') || undefined,
          })
        }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {shortlisted.length > 0 && (
            <Select id="int-app" label="Candidate (from shortlisted)" name="application_id" required>
              <option value="">Select candidate…</option>
              {shortlisted.map(a => <option key={a.id} value={a.id}>{a.student_name} — {a.opportunity_title}</option>)}
            </Select>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input id="int-round-num" label="Round #" name="round_number" type="number" min="1" defaultValue="1" required />
            <Input id="int-round-name" label="Round name" name="round_name" placeholder="Technical Round" />
          </div>
          <Input id="int-sched" label="Scheduled at" name="scheduled_at" type="datetime-local" required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input id="int-dur" label="Duration (minutes)" name="duration_minutes" type="number" min="15" defaultValue="60" />
            <Select id="int-mode" label="Mode" name="mode">
              <option value="ONLINE">Online</option>
              <option value="ONSITE">Onsite</option>
              <option value="PHONE">Phone</option>
            </Select>
          </div>
          <Input id="int-link" label="Meeting link" name="meeting_link" type="url" placeholder="https://meet.google.com/…" />
          <Textarea id="int-notes" label="Notes (optional)" name="notes" placeholder="Interview focus areas, topics to cover…" />
        </form>
      </Modal>
    </div>
  )
}
