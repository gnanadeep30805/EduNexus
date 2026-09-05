// Shared notifications component for industry users
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { Card, SkeletonCard, ErrorState, EmptyState } from '../../components/ui/index.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { Bell, CheckCheck, Briefcase, MessageSquare, Award, AlertCircle } from 'lucide-react'

function useNotifications() {
  return useQuery({
    queryKey: ['industry', 'notifications'],
    queryFn: () => api.get('/industry/notifications').then(r => r.data.data),
  })
}

const TYPE_ICONS = { APPLICATION: Briefcase, INTERVIEW: MessageSquare, OFFER: Award, SYSTEM: AlertCircle }

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr)
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function IndustryNotifications() {
  const toast = useToast()
  const qc = useQueryClient()
  const { data, isLoading, error, refetch } = useNotifications()

  const readAllMut = useMutation({
    mutationFn: () => api.patch('/industry/notifications/read-all'),
    onSuccess: () => { toast.success('All marked as read'); qc.invalidateQueries(['industry', 'notifications']) },
    onError: err => toast.error(err.message),
  })
  const readOneMut = useMutation({
    mutationFn: id => api.patch(`/industry/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries(['industry', 'notifications']),
  })

  if (isLoading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[0,1,2,3].map(i => <SkeletonCard key={i} lines={2} />)}</div>
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const notifications = data?.notifications || []
  const unread = notifications.filter(n => !n.is_read).length

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">NOTIFICATIONS</p>
          <h1 className="section-title">Notifications {unread > 0 && <span style={{ fontSize: '1rem', background: 'var(--accent-primary)', color: 'white', padding: '2px 8px', borderRadius: 999, marginLeft: 8 }}>{unread}</span>}</h1>
        </div>
        {unread > 0 && <button className="btn btn-secondary btn-sm" onClick={() => readAllMut.mutate()}><CheckCheck size={13} /> Mark all read</button>}
      </div>
      {notifications.length === 0 ? (
        <Card className="card-padded"><EmptyState icon={Bell} title="No notifications" description="You're all caught up! Notifications about applications will appear here." /></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {notifications.map(n => {
            const Icon = TYPE_ICONS[n.type] || Bell
            return (
              <div key={n.id} onClick={() => !n.is_read && readOneMut.mutate(n.id)} style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.875rem', padding: '0.875rem 1rem',
                borderRadius: 'var(--radius-lg)', background: n.is_read ? 'var(--bg-surface)' : 'var(--accent-light)',
                border: `1px solid ${n.is_read ? 'var(--border-base)' : 'hsl(221 83% 53% / 0.2)'}`,
                cursor: n.is_read ? 'default' : 'pointer',
              }}>
                <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', flexShrink: 0, background: n.is_read ? 'var(--bg-overlay)' : 'var(--accent-primary)', color: n.is_read ? 'var(--text-tertiary)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: n.is_read ? 400 : 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 2 }}>{n.title}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{n.body || n.message}</div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: 4 }}>{timeAgo(n.created_at)}</div>
                </div>
                {!n.is_read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-primary)', flexShrink: 0, marginTop: 6 }} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
