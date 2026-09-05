import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { Card, Badge, Progress, SkeletonCard, ErrorState, EmptyState } from '../../components/ui/index.jsx'
import { BarChart3 } from 'lucide-react'

function useSkills() {
  return useQuery({
    queryKey: ['academia', 'skills'],
    queryFn: () => api.get('/academia/skills').then(r => r.data.data),
  })
}

const LEVEL_LABEL = { 1: 'Basic', 2: 'Intermediate', 3: 'Advanced', 4: 'Expert' }

export default function SkillIntelligence() {
  const { data, isLoading, error, refetch } = useSkills()
  const [catFilter, setCatFilter] = useState('All')

  if (isLoading) return <SkeletonCard lines={10} />
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const skills = data?.skills || []
  const categories = ['All', ...new Set(skills.map(s => s.category).filter(Boolean))]
  const filtered = catFilter === 'All' ? skills : skills.filter(s => s.category === catFilter)

  const totalStudents = skills.reduce((sum, s) => sum + (s.student_count || 0), 0)
  const totalVerified = skills.reduce((sum, s) => sum + (s.verified_count || 0), 0)

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">SKILL INTELLIGENCE</p>
          <h1 className="section-title">Skill Analytics</h1>
          <p className="section-desc">{skills.length} skills tracked across your institution</p>
        </div>
      </div>

      <div className="metric-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="metric-card"><div className="metric-label"><BarChart3 size={12} style={{ color: 'var(--accent-primary)' }} />Skills Tracked</div><div className="metric-value">{skills.length}</div></div>
        <div className="metric-card"><div className="metric-label">Total Skill Records</div><div className="metric-value">{totalStudents}</div><div className="metric-sub">student–skill pairs</div></div>
        <div className="metric-card"><div className="metric-label">Verified Records</div><div className="metric-value">{totalVerified}</div><div className="metric-sub">industry-assessed</div></div>
        <div className="metric-card"><div className="metric-label">Categories</div><div className="metric-value">{categories.length - 1}</div></div>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {categories.map(cat => (
          <button key={cat} className={`chip ${catFilter === cat ? 'active' : ''}`} onClick={() => setCatFilter(cat)}>{cat}</button>
        ))}
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Skill</th>
              <th>Category</th>
              <th>Students</th>
              <th>Verified</th>
              <th>Avg. Level</th>
              <th>Industry Demand</th>
              <th>Coverage</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem' }}>No skills in this category</td></tr>
            ) : filtered.map(skill => {
              const avgLevelNum = skill.avg_level ? Math.round(skill.avg_level) : 1
              const coverage = skill.student_count && data?.totalStudents
                ? Math.round((skill.student_count / data.totalStudents) * 100) : null
              return (
                <tr key={skill.id}>
                  <td style={{ fontWeight: 600 }}>{skill.name}</td>
                  <td><Badge variant="neutral">{skill.category || '—'}</Badge></td>
                  <td style={{ fontWeight: 700 }}>{skill.student_count || 0}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--color-success-600)' }}>{skill.verified_count || 0}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Progress value={avgLevelNum} max={4} style={{ width: 60 }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{LEVEL_LABEL[avgLevelNum]}</span>
                    </div>
                  </td>
                  <td>
                    {skill.industry_demand
                      ? <span style={{ fontWeight: 700, color: 'var(--color-warning-600)' }}>{skill.industry_demand} roles</span>
                      : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                  </td>
                  <td>
                    {coverage !== null
                      ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Progress value={coverage} style={{ width: 60 }} /><span style={{ fontSize: '0.75rem' }}>{coverage}%</span></div>
                      : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
