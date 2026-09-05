import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import {
  Card, ProgressRing, SkeletonCard, ErrorState, EmptyState, Badge, SkillLevel, Progress,
} from '../../components/ui/index.jsx'
import { Award, CheckCircle, Shield, Star, Tag, TrendingUp } from 'lucide-react'

function useSkills() {
  return useQuery({
    queryKey: ['student', 'skills'],
    queryFn: () => api.get('/students/me/skills').then((r) => r.data.data),
  })
}

function TrustBadge({ evidenceCount, verifiedLevel, verifiedEvidence }) {
  if (verifiedLevel && verifiedEvidence > 0)
    return <Badge variant="success"><Shield size={9} style={{ display: 'inline', marginRight: 3 }} />Industry Verified</Badge>
  if (verifiedLevel)
    return <Badge variant="primary"><CheckCircle size={9} style={{ display: 'inline', marginRight: 3 }} />Assessed</Badge>
  if (evidenceCount > 0)
    return <Badge variant="info">Evidence</Badge>
  return <Badge variant="neutral">Self Declared</Badge>
}

const LEVEL_ORDER = { BASIC: 1, INTERMEDIATE: 2, ADVANCED: 3, EXPERT: 4 }

export default function SkillPassport() {
  const { data, isLoading, error, refetch } = useSkills()

  if (isLoading) return (
    <div>
      <div className="section-header"><div className="skeleton" style={{ height: 28, width: 220 }} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '1rem' }}>
        {[0,1,2,3,4,5].map((i) => <SkeletonCard key={i} lines={4} />)}
      </div>
    </div>
  )
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const skills = data?.skills || []
  const byCategory = {}
  for (const skill of skills) {
    const cat = skill.category || 'Other'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(skill)
  }

  const totalSkills   = skills.length
  const assessed      = skills.filter((s) => s.verified_level).length
  const withEvidence  = skills.filter((s) => s.evidence_count > 0).length
  const avgLevel      = totalSkills
    ? Math.round(skills.reduce((sum, s) => sum + (LEVEL_ORDER[s.verified_level || s.self_level] || 1), 0) / totalSkills * 25)
    : 0

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">SKILL PASSPORT</p>
          <h1 className="section-title">Your Skill Passport</h1>
          <p className="section-desc">Verified evidence of your capabilities across all domains</p>
        </div>
      </div>

      {/* Summary */}
      <div className="metric-grid" style={{ marginBottom: '1.75rem' }}>
        <div className="metric-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ProgressRing value={avgLevel} size={64} strokeWidth={6} />
          <div>
            <div className="metric-label"><Star size={12} style={{ color: 'var(--color-warning-500)' }} />Overall Level</div>
            <div className="metric-value" style={{ fontSize: '1.5rem' }}>{avgLevel}%</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label"><Tag size={12} style={{ color: 'var(--accent-primary)' }} />Total Skills</div>
          <div className="metric-value">{totalSkills}</div>
          <div className="metric-sub">across {Object.keys(byCategory).length} categories</div>
        </div>
        <div className="metric-card">
          <div className="metric-label"><CheckCircle size={12} style={{ color: 'var(--color-success-500)' }} />Assessed</div>
          <div className="metric-value">{assessed}</div>
          <div className="metric-sub">skill assessments completed</div>
        </div>
        <div className="metric-card">
          <div className="metric-label"><Award size={12} style={{ color: 'var(--color-info-500)' }} />With Evidence</div>
          <div className="metric-value">{withEvidence}</div>
          <div className="metric-sub">backed by projects / certs</div>
        </div>
      </div>

      {totalSkills === 0 ? (
        <Card className="card-padded">
          <EmptyState
            icon={Award}
            title="Your passport is empty"
            description="Add skills and evidence to build a verified skill passport that employers trust."
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {Object.entries(byCategory).sort().map(([category, catSkills]) => (
            <div key={category}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>{category}</h2>
                <div style={{ flex: 1, height: 1, background: 'var(--border-base)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{catSkills.length} skills</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '0.875rem' }}>
                {catSkills.map((skill) => (
                  <Card key={skill.id} className="card-padded">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                      <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{skill.name}</h3>
                      <TrustBadge
                        evidenceCount={skill.evidence_count}
                        verifiedLevel={skill.verified_level}
                        verifiedEvidence={skill.verified_evidence_count}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Self-assessed</div>
                        <SkillLevel level={skill.self_level} />
                      </div>
                      {skill.verified_level && (
                        <div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Verified level</div>
                          <SkillLevel level={skill.verified_level} />
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {skill.evidence_count > 0 && (
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Award size={10} /> {skill.evidence_count} evidence item{skill.evidence_count !== 1 ? 's' : ''}
                        </span>
                      )}
                      {skill.years_experience && (
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                          {skill.years_experience}y experience
                        </span>
                      )}
                    </div>

                    <Progress
                      value={LEVEL_ORDER[skill.verified_level || skill.self_level] || 1}
                      max={4}
                      style={{ marginTop: 10 }}
                    />
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
