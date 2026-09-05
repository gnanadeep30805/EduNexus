import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import {
  Card, Badge, Progress, SkeletonCard, ErrorState, EmptyState,
} from '../../components/ui/index.jsx'
import { Target, BookOpen, ArrowRight, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

function useGaps() {
  return useQuery({
    queryKey: ['student', 'skill-gaps'],
    queryFn: () => api.get('/students/me/skill-gaps').then((r) => r.data.data),
  })
}

const GAP_LEVEL = { 0: 'none', 1: 'low', 2: 'moderate', 3: 'high', 4: 'critical' }
const LEVEL_NUM = { BASIC: 1, INTERMEDIATE: 2, ADVANCED: 3, EXPERT: 4 }

function GapCard({ gap }) {
  const gapLevel = GAP_LEVEL[gap.gap] || 'moderate'
  const borderColor = gap.priority === 'MANDATORY'
    ? 'var(--color-error-500)'
    : 'var(--color-warning-500)'

  return (
    <Card className="card-padded" style={{ borderLeft: `3px solid ${borderColor}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: 2 }}>{gap.skill}</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            Required by: {gap.role}
          </p>
        </div>
        <Badge variant={gap.priority === 'MANDATORY' ? 'error' : 'warning'}>
          {gap.priority === 'MANDATORY' ? 'Required' : 'Preferred'}
        </Badge>
      </div>

      {/* Level comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.875rem' }}>
        <div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Your Level</div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: gap.currentLevel === 'Not started' ? 'var(--color-error-500)' : 'var(--text-primary)' }}>
            {gap.currentLevel}
          </div>
          <Progress
            value={LEVEL_NUM[gap.currentLevel?.toUpperCase()] || 0}
            max={4}
            variant={gap.currentLevel === 'Not started' ? 'error' : ''}
            style={{ marginTop: 6 }}
          />
        </div>
        <div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Required Level</div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {gap.requiredLevel}
          </div>
          <Progress value={LEVEL_NUM[gap.requiredLevel?.toUpperCase()] || 2} max={4} style={{ marginTop: 6 }} />
        </div>
      </div>

      {/* Recommendation */}
      {gap.recommendation && (
        <div style={{
          background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)',
          padding: '0.625rem 0.75rem', fontSize: '0.8125rem', color: 'var(--text-secondary)',
          display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
          <BookOpen size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }} />
          {gap.recommendation}
        </div>
      )}
    </Card>
  )
}

export default function SkillGaps() {
  const { data, isLoading, error, refetch } = useGaps()

  if (isLoading) return (
    <div>
      <div className="section-header"><div className="skeleton" style={{ height: 28, width: 200 }} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '1rem' }}>
        {[0,1,2,3].map((i) => <SkeletonCard key={i} lines={5} />)}
      </div>
    </div>
  )
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const gaps = data?.gaps || []
  const mandatory = gaps.filter((g) => g.priority === 'MANDATORY')
  const preferred = gaps.filter((g) => g.priority !== 'MANDATORY')

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">SKILL GAP ANALYSIS</p>
          <h1 className="section-title">Skill Gaps</h1>
          <p className="section-desc">Skills you need to develop based on live industry demand</p>
        </div>
        <Link to="/student/learning">
          <button className="btn btn-primary">
            <BookOpen size={14} /> View Learning Plan
          </button>
        </Link>
      </div>

      {gaps.length === 0 ? (
        <Card className="card-padded">
          <EmptyState
            icon={CheckCircle}
            title="No skill gaps detected"
            description="You meet the skill requirements for all current published opportunities. Keep building your skill evidence."
          />
        </Card>
      ) : (
        <>
          {/* Summary */}
          <div className="metric-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="metric-card">
              <div className="metric-label"><AlertTriangle size={12} style={{ color: 'var(--color-error-500)' }} />Critical Gaps</div>
              <div className="metric-value">{mandatory.length}</div>
              <div className="metric-sub">required by employers</div>
            </div>
            <div className="metric-card">
              <div className="metric-label"><Target size={12} style={{ color: 'var(--color-warning-500)' }} />Preferred Gaps</div>
              <div className="metric-value">{preferred.length}</div>
              <div className="metric-sub">preferred by employers</div>
            </div>
            <div className="metric-card">
              <div className="metric-label"><TrendingUp size={12} style={{ color: 'var(--accent-primary)' }} />Total to Address</div>
              <div className="metric-value">{gaps.length}</div>
              <div className="metric-sub">skills to develop</div>
            </div>
          </div>

          {mandatory.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={16} style={{ color: 'var(--color-error-500)' }} /> Required skills
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '0.875rem' }}>
                {mandatory.map((gap) => <GapCard key={gap.skill} gap={gap} />)}
              </div>
            </div>
          )}

          {preferred.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target size={16} style={{ color: 'var(--color-warning-500)' }} /> Preferred skills
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '0.875rem' }}>
                {preferred.map((gap) => <GapCard key={gap.skill} gap={gap} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
