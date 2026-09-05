import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { Card, Badge, Progress, SkeletonCard, ErrorState, EmptyState } from '../../components/ui/index.jsx'
import { BookOpen, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

function useSkills() {
  return useQuery({
    queryKey: ['academia', 'skills'],
    queryFn: () => api.get('/academia/skills').then(r => r.data.data),
  })
}

function getAlignment(skill) {
  const demand  = skill.industry_demand || 0
  const coverage = skill.student_count  || 0
  if (demand > 5 && coverage < demand * 0.5) return 'GAP'
  if (demand > 0 && coverage >= demand * 0.8) return 'ALIGNED'
  if (coverage > 5 && demand === 0) return 'EXCESS'
  return 'PARTIAL'
}

const ALIGNMENT_CONFIG = {
  GAP:     { label: 'Skill Gap',    variant: 'error',   icon: AlertTriangle,  desc: 'High demand, low student coverage' },
  ALIGNED: { label: 'Aligned',      variant: 'success', icon: CheckCircle,    desc: 'Good coverage matches demand' },
  EXCESS:  { label: 'Low Demand',   variant: 'neutral', icon: BookOpen,       desc: 'Students have skill, low demand' },
  PARTIAL: { label: 'Partial',      variant: 'warning', icon: TrendingUp,     desc: 'Moderate alignment' },
}

export default function CurriculumAlignment() {
  const { data, isLoading, error, refetch } = useSkills()

  if (isLoading) return <SkeletonCard lines={10} />
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const skills = (data?.skills || []).filter(s => s.industry_demand > 0 || s.student_count > 0)

  const gaps    = skills.filter(s => getAlignment(s) === 'GAP')
  const aligned = skills.filter(s => getAlignment(s) === 'ALIGNED')
  const excess  = skills.filter(s => getAlignment(s) === 'EXCESS')
  const partial = skills.filter(s => getAlignment(s) === 'PARTIAL')

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">CURRICULUM ALIGNMENT</p>
          <h1 className="section-title">Curriculum vs. Industry Demand</h1>
          <p className="section-desc">Identify which skills to add, strengthen, or deprioritize</p>
        </div>
      </div>

      <div className="metric-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="metric-card">
          <div className="metric-label"><AlertTriangle size={12} style={{ color: 'var(--color-error-500)' }} />Skill Gaps</div>
          <div className="metric-value" style={{ color: 'var(--color-error-500)' }}>{gaps.length}</div>
          <div className="metric-sub">need curriculum addition</div>
        </div>
        <div className="metric-card">
          <div className="metric-label"><CheckCircle size={12} style={{ color: 'var(--color-success-500)' }} />Aligned</div>
          <div className="metric-value" style={{ color: 'var(--color-success-600)' }}>{aligned.length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label"><TrendingUp size={12} style={{ color: 'var(--color-warning-500)' }} />Partial</div>
          <div className="metric-value">{partial.length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label"><BookOpen size={12} style={{ color: 'var(--text-tertiary)' }} />Low Demand</div>
          <div className="metric-value">{excess.length}</div>
        </div>
      </div>

      {skills.length === 0 ? (
        <Card className="card-padded"><EmptyState icon={BookOpen} title="No data available" description="Skill data will appear here as students add skills and companies post opportunities." /></Card>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Skill</th>
                <th>Category</th>
                <th>Students with skill</th>
                <th>Industry demand (roles)</th>
                <th>Alignment</th>
                <th>Recommended action</th>
              </tr>
            </thead>
            <tbody>
              {[...gaps, ...partial, ...aligned, ...excess].map(skill => {
                const alignment = getAlignment(skill)
                const config = ALIGNMENT_CONFIG[alignment]
                const action = alignment === 'GAP' ? 'Add to curriculum'
                  : alignment === 'ALIGNED' ? 'Maintain coverage'
                  : alignment === 'PARTIAL' ? 'Increase focus'
                  : 'Deprioritize'
                return (
                  <tr key={skill.id}>
                    <td style={{ fontWeight: 600 }}>{skill.name}</td>
                    <td><Badge variant="neutral">{skill.category || '—'}</Badge></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Progress value={skill.student_count || 0} max={Math.max(...(data?.skills || []).map(s => s.student_count || 0), 1)} style={{ width: 60 }} />
                        <span style={{ fontSize: '0.8125rem' }}>{skill.student_count || 0}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Progress value={skill.industry_demand || 0} max={Math.max(...(data?.skills || []).map(s => s.industry_demand || 0), 1)} variant="warning" style={{ width: 60 }} />
                        <span style={{ fontSize: '0.8125rem' }}>{skill.industry_demand || 0}</span>
                      </div>
                    </td>
                    <td><Badge variant={config.variant}>{config.label}</Badge></td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{action}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
