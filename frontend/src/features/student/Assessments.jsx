import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { Card, Badge, SkeletonCard, ErrorState, EmptyState, StatusBadge } from '../../components/ui/index.jsx'
import { ClipboardList, Clock, Star, ChevronRight, CheckCircle, Play } from 'lucide-react'

function useAssessments() {
  return useQuery({
    queryKey: ['student', 'assessments'],
    queryFn: () => api.get('/students/me/assessments').then(r => r.data.data),
  })
}

const DIFF_COLOR = { EASY: 'success', MEDIUM: 'warning', HARD: 'error' }

function AssessmentCard({ assessment }) {
  const latest = assessment.latest_attempt
  const passed  = latest?.status === 'COMPLETED' && latest?.score >= 60

  return (
    <Card className="card-padded">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 'var(--radius-md)',
          background: passed ? 'var(--color-success-50)' : 'var(--accent-light)',
          color: passed ? 'var(--color-success-600)' : 'var(--accent-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {passed ? <CheckCircle size={20} /> : <ClipboardList size={20} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{assessment.title}</h3>
            <div style={{ display: 'flex', gap: 4 }}>
              <Badge variant={DIFF_COLOR[assessment.difficulty] || 'neutral'}>{assessment.difficulty}</Badge>
              {passed && <Badge variant="success">Passed</Badge>}
            </div>
          </div>

          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
            {assessment.skill_name && <span>Skill: <strong>{assessment.skill_name}</strong> · </span>}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} /> {assessment.time_limit} min
            </span>
            {assessment.question_count && <span> · {assessment.question_count} questions</span>}
          </div>

          {assessment.description && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: 10 }}>
              {assessment.description}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {latest ? (
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Last score: <strong style={{ color: latest.score >= 60 ? 'var(--color-success-600)' : 'var(--color-error-500)' }}>{latest.score}%</strong>
              </span>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Not attempted</span>
            )}
            <Link to={`/student/assessments/${assessment.id}`} style={{ marginLeft: 'auto' }}>
              <button className="btn btn-primary btn-sm">
                {latest ? <><Play size={12} /> Retake</> : <><Play size={12} /> Start</>}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function Assessments() {
  const { data, isLoading, error, refetch } = useAssessments()

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[0,1,2,3].map(i => <SkeletonCard key={i} lines={3} />)}
    </div>
  )
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const assessments = data?.assessments || []
  const attempted = assessments.filter(a => a.latest_attempt)
  const passed    = assessments.filter(a => a.latest_attempt?.score >= 60)

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">ASSESSMENTS</p>
          <h1 className="section-title">Skill Assessments</h1>
          <p className="section-desc">Verify your skills and unlock evidence for your passport</p>
        </div>
      </div>

      <div className="metric-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="metric-card">
          <div className="metric-label"><ClipboardList size={12} style={{ color: 'var(--accent-primary)' }} />Available</div>
          <div className="metric-value">{assessments.length}</div>
          <div className="metric-sub">assessments</div>
        </div>
        <div className="metric-card">
          <div className="metric-label"><Star size={12} style={{ color: 'var(--color-warning-500)' }} />Attempted</div>
          <div className="metric-value">{attempted.length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label"><CheckCircle size={12} style={{ color: 'var(--color-success-500)' }} />Passed</div>
          <div className="metric-value">{passed.length}</div>
        </div>
      </div>

      {assessments.length === 0 ? (
        <Card className="card-padded">
          <EmptyState
            icon={ClipboardList}
            title="No assessments yet"
            description="Assessments will appear here as your institution creates them. Check back soon."
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {assessments.map(a => <AssessmentCard key={a.id} assessment={a} />)}
        </div>
      )}
    </div>
  )
}
