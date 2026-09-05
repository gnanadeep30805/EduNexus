import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { Card, Badge, Progress, SkeletonCard, ErrorState, EmptyState, ProgressRing } from '../../components/ui/index.jsx'
import { TrendingUp, Target, BookOpen, Briefcase, Award, ArrowRight, CheckCircle, Circle } from 'lucide-react'

function useGaps() {
  return useQuery({
    queryKey: ['student', 'skill-gaps'],
    queryFn: () => api.get('/students/me/skill-gaps').then(r => r.data.data),
  })
}

function useDashboard() {
  return useQuery({
    queryKey: ['student', 'dashboard'],
    queryFn: () => api.get('/students/me/dashboard').then(r => r.data.data),
  })
}

const LEVEL_NUM = { BASIC: 1, INTERMEDIATE: 2, ADVANCED: 3, EXPERT: 4 }

function Step({ number, title, desc, status, children }) {
  const isComplete = status === 'complete'
  const isActive   = status === 'active'
  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '0.875rem', flexShrink: 0,
          background: isComplete ? 'var(--color-success-500)' : isActive ? 'var(--accent-primary)' : 'var(--bg-overlay)',
          color: isComplete || isActive ? 'white' : 'var(--text-tertiary)',
          border: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
        }}>
          {isComplete ? <CheckCircle size={16} /> : number}
        </div>
        <div style={{ flex: 1, width: 2, background: isComplete ? 'var(--color-success-500)' : 'var(--border-base)', marginTop: 4, minHeight: 32 }} />
      </div>
      <div style={{ flex: 1, paddingBottom: '1.5rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: isActive ? 'var(--text-primary)' : isComplete ? 'var(--color-success-700)' : 'var(--text-secondary)' }}>{title}</div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: children ? 8 : 0 }}>{desc}</div>
        {children}
      </div>
    </div>
  )
}

export default function CareerPath() {
  const { data: gapsData, isLoading: gapsLoading } = useGaps()
  const { data: dashData, isLoading: dashLoading } = useDashboard()

  const isLoading = gapsLoading || dashLoading
  if (isLoading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[0,1,2].map(i => <SkeletonCard key={i} lines={3} />)}</div>

  const gaps = gapsData?.gaps || []
  const metrics = dashData?.metrics || {}
  const skills  = dashData?.skills  || []
  const readiness = metrics.readiness || 0

  const mandatoryGaps = gaps.filter(g => g.priority === 'MANDATORY')
  const hasSkills = metrics.skills > 0
  const hasAssessed = metrics.assessedSkills > 0
  const hasGaps = gaps.length > 0

  const step1Status = hasSkills ? 'complete' : 'active'
  const step2Status = hasSkills && !hasAssessed ? 'active' : hasAssessed ? 'complete' : 'inactive'
  const step3Status = hasGaps ? 'active' : hasAssessed ? 'complete' : 'inactive'
  const step4Status = readiness >= 60 ? 'active' : 'inactive'
  const step5Status = 'inactive'
  const step6Status = 'inactive'

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">CAREER PATH</p>
          <h1 className="section-title">Your Career Journey</h1>
          <p className="section-desc">From where you are today to placement readiness</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ProgressRing value={readiness} size={64} strokeWidth={6} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Readiness</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{readiness}%</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Journey steps */}
        <Card className="card-padded">
          <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>Career roadmap</h2>

          <Step number={1} title="Build your skill profile" desc={`${metrics.skills || 0} skills in your passport`} status={step1Status}>
            {!hasSkills && (
              <Link to="/student/skills">
                <button className="btn btn-primary btn-sm" style={{ marginTop: 6 }}>Add your first skill <ArrowRight size={12} /></button>
              </Link>
            )}
          </Step>

          <Step number={2} title="Complete skill assessments" desc={`${metrics.assessedSkills || 0} of ${metrics.skills || 0} skills assessed`} status={step2Status}>
            {hasSkills && !hasAssessed && (
              <Link to="/student/assessments">
                <button className="btn btn-primary btn-sm" style={{ marginTop: 6 }}>Take an assessment <ArrowRight size={12} /></button>
              </Link>
            )}
          </Step>

          <Step number={3} title="Address skill gaps" desc={`${mandatoryGaps.length} required gaps to close`} status={step3Status}>
            {hasGaps && (
              <div style={{ marginTop: 8 }}>
                {mandatoryGaps.slice(0, 3).map(g => (
                  <div key={g.skill} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    <Target size={12} style={{ color: 'var(--color-error-500)' }} />
                    <span>{g.skill}</span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>{g.currentLevel} → {g.requiredLevel}</span>
                  </div>
                ))}
                <Link to="/student/learning">
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }}>View learning plan</button>
                </Link>
              </div>
            )}
          </Step>

          <Step number={4} title="Apply to internships" desc="Match with opportunities matching your skill profile" status={step4Status}>
            {readiness >= 40 && (
              <Link to="/student/opportunities">
                <button className="btn btn-primary btn-sm" style={{ marginTop: 6 }}>Browse opportunities <ArrowRight size={12} /></button>
              </Link>
            )}
          </Step>

          <Step number={5} title="Complete internship & get feedback" desc="Build industry-verified evidence during your internship" status={step5Status} />

          <Step number={6} title="Placement readiness" desc="Achieve 80%+ readiness for placement drives" status={step6Status} />
        </Card>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Skill summary */}
          <Card className="card-padded">
            <h3 className="card-title" style={{ marginBottom: '0.875rem' }}>Skill snapshot</h3>
            {skills.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>Add skills to see your snapshot.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {skills.slice(0, 5).map(s => (
                  <div key={s.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{s.name}</span>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>{(s.verified_level || s.self_level || 'BASIC').toLowerCase()}</span>
                    </div>
                    <Progress value={LEVEL_NUM[s.verified_level || s.self_level] || 1} max={4} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Top gaps */}
          {gaps.length > 0 && (
            <Card className="card-padded">
              <h3 className="card-title" style={{ marginBottom: '0.875rem' }}>Top gaps to close</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {gaps.slice(0, 4).map(g => (
                  <div key={g.skill} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: g.priority === 'MANDATORY' ? 'var(--color-error-500)' : 'var(--color-warning-500)', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{g.skill}</span>
                    <Badge variant={g.priority === 'MANDATORY' ? 'error' : 'warning'} style={{ fontSize: '0.625rem' }}>
                      {g.gap} level{g.gap !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                ))}
              </div>
              <Link to="/student/skill-gaps">
                <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, width: '100%' }}>View full analysis →</button>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
