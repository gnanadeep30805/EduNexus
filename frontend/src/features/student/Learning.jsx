import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { Card, Badge, SkeletonCard, ErrorState, EmptyState } from '../../components/ui/index.jsx'
import { BookOpen, ExternalLink, CheckCircle, Target, Award, Code, ArrowRight } from 'lucide-react'

function useGaps() {
  return useQuery({
    queryKey: ['student', 'skill-gaps'],
    queryFn: () => api.get('/students/me/skill-gaps').then(r => r.data.data),
  })
}

const RESOURCE_MAP = {
  BASIC:        { type: 'Course', duration: '4–8 hours', label: 'Fundamentals course' },
  INTERMEDIATE: { type: 'Project', duration: '1–2 weeks', label: 'Hands-on project' },
  ADVANCED:     { type: 'Course + Project', duration: '2–4 weeks', label: 'Advanced course + build' },
  EXPERT:       { type: 'Deep dive', duration: '4–8 weeks', label: 'Expert-level specialization' },
}

const PLATFORMS = ['Coursera', 'edX', 'Udemy', 'YouTube', 'official docs', 'FreeCodeCamp']

function ResourceCard({ gap, index }) {
  const resource = RESOURCE_MAP[gap.requiredLevel?.toUpperCase()] || RESOURCE_MAP.INTERMEDIATE
  const platform = PLATFORMS[index % PLATFORMS.length]
  return (
    <Card className="card-padded" style={{ borderLeft: `3px solid ${gap.priority === 'MANDATORY' ? 'var(--color-error-500)' : 'var(--color-warning-500)'}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius-md)',
          background: 'var(--accent-light)', color: 'var(--accent-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <BookOpen size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Learn {gap.skill}</h3>
            <Badge variant={gap.priority === 'MANDATORY' ? 'error' : 'warning'}>
              {gap.priority === 'MANDATORY' ? 'Required' : 'Preferred'}
            </Badge>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
            {gap.recommendation || `Study ${gap.skill} to meet the ${gap.requiredLevel.toLowerCase()} level required for ${gap.role}.`}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Badge variant="neutral">{resource.type}</Badge>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>~{resource.duration}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>via {platform}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function Learning() {
  const { data, isLoading, error, refetch } = useGaps()

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[0,1,2,3].map(i => <SkeletonCard key={i} lines={3} />)}
    </div>
  )
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const gaps = data?.gaps || []
  const mandatory = gaps.filter(g => g.priority === 'MANDATORY')
  const preferred  = gaps.filter(g => g.priority !== 'MANDATORY')
  const totalHours = gaps.length * 10

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">LEARNING</p>
          <h1 className="section-title">Your Learning Plan</h1>
          <p className="section-desc">Personalized recommendations based on your skill gaps</p>
        </div>
        <Link to="/student/assessments">
          <button className="btn btn-primary"><CheckCircle size={14} /> Take Assessments</button>
        </Link>
      </div>

      {gaps.length === 0 ? (
        <Card className="card-padded">
          <EmptyState
            icon={CheckCircle}
            title="No learning needed right now"
            description="You meet the skill requirements for all active opportunities. Keep building evidence and add more skills."
          />
        </Card>
      ) : (
        <>
          {/* Summary */}
          <div className="metric-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="metric-card">
              <div className="metric-label"><Target size={12} style={{ color: 'var(--color-error-500)' }} />Priority skills</div>
              <div className="metric-value">{mandatory.length}</div>
              <div className="metric-sub">required by employers</div>
            </div>
            <div className="metric-card">
              <div className="metric-label"><BookOpen size={12} style={{ color: 'var(--accent-primary)' }} />Total resources</div>
              <div className="metric-value">{gaps.length}</div>
              <div className="metric-sub">learning paths</div>
            </div>
            <div className="metric-card">
              <div className="metric-label"><Award size={12} style={{ color: 'var(--color-success-500)' }} />Estimated time</div>
              <div className="metric-value">~{totalHours}h</div>
              <div className="metric-sub">to close all gaps</div>
            </div>
          </div>

          {mandatory.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>📌 Priority learning (required skills)</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {mandatory.map((g, i) => <ResourceCard key={g.skill} gap={g} index={i} />)}
              </div>
            </div>
          )}

          {preferred.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>💡 Recommended (preferred skills)</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {preferred.map((g, i) => <ResourceCard key={g.skill} gap={g} index={mandatory.length + i} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
