import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import {
  Card, Badge, Button, SkillLevel, ProgressRing, ErrorState, InlineLoading,
  Alert, Modal,
} from '../../components/ui/index.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import {
  Building2, MapPin, Clock, Calendar, Briefcase, CheckCircle, X,
  ChevronLeft, ArrowRight, ExternalLink, Wifi,
} from 'lucide-react'

function useOpportunity(id) {
  return useQuery({
    queryKey: ['student', 'opportunity', id],
    queryFn: () => api.get(`/students/me/opportunities/${id}`).then((r) => r.data.data),
    enabled: !!id,
  })
}

function MatchExplainer({ match, matchingSkills = [], missingSkills = [] }) {
  if (!match) return null
  const strength = (match.strength || '').toLowerCase()
  const color = strength === 'strong' ? 'var(--color-success-600)' :
    strength === 'good' ? 'var(--accent-primary)' :
    strength === 'moderate' ? 'var(--color-warning-600)' : 'var(--color-error-600)'

  return (
    <Card className="card-padded" style={{ borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <ProgressRing value={match.score} size={72} strokeWidth={7} />
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 2 }}>AI MATCH SCORE</p>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{Math.round(match.score)}% match</h3>
          <Badge variant={strength === 'strong' ? 'success' : strength === 'good' ? 'primary' : strength === 'moderate' ? 'warning' : 'error'}>
            {match.strength}
          </Badge>
        </div>
      </div>

      {match.reasons?.length > 0 && (
        <div style={{ marginBottom: '0.875rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 6 }}>STRENGTHS</p>
          {match.reasons.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <CheckCircle size={13} style={{ color: 'var(--color-success-500)', flexShrink: 0, marginTop: 1 }} />
              {r}
            </div>
          ))}
        </div>
      )}

      {match.gaps?.length > 0 && (
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 6 }}>SKILL GAPS</p>
          {match.gaps.slice(0, 3).map((g, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <X size={13} style={{ color: 'var(--color-error-500)', flexShrink: 0, marginTop: 1 }} />
              {g.skill} <span style={{ color: 'var(--text-tertiary)' }}>({g.requiredLevel} required)</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default function OpportunityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const qc = useQueryClient()
  const [applyOpen, setApplyOpen] = useState(false)
  const [note, setNote] = useState('')

  const { data: opp, isLoading, error } = useOpportunity(id)

  const applyMut = useMutation({
    mutationFn: (body) => api.post('/students/me/applications', body),
    onSuccess: () => {
      toast.success('Application submitted successfully!')
      qc.invalidateQueries(['student', 'applications'])
      setApplyOpen(false)
      navigate('/student/applications')
    },
    onError: (err) => toast.error(err.message),
  })

  if (isLoading) return <InlineLoading message="Loading opportunity…" />
  if (error) return <ErrorState message={error.message} />
  if (!opp) return null

  const days = opp.application_deadline
    ? Math.max(0, Math.ceil((new Date(opp.application_deadline) - new Date()) / 86400000))
    : null

  return (
    <div>
      {/* Back */}
      <Link to="/student/opportunities" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', textDecoration: 'none' }}>
        <ChevronLeft size={15} /> Back to opportunities
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header */}
          <Card className="card-padded">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 'var(--radius-lg)', background: 'var(--bg-overlay)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem',
                fontWeight: 800, color: 'var(--accent-primary)', flexShrink: 0,
              }}>
                {opp.company?.name?.charAt(0) || 'C'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                  <Badge variant={opp.type === 'JOB' ? 'primary' : 'success'}>{opp.type?.replace(/_/g, ' ')}</Badge>
                  <Badge variant="success">Active</Badge>
                </div>
                <h1 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: 2 }}>{opp.title}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={13} />{opp.company?.name}</span>
                  {opp.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={13} />{opp.location}</span>}
                  {opp.work_mode && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Wifi size={13} />{opp.work_mode}</span>}
                  {opp.duration && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={13} />{opp.duration}</span>}
                  {days !== null && (
                    <span style={{ color: days <= 3 ? 'var(--color-error-500)' : 'var(--text-tertiary)', fontWeight: days <= 3 ? 600 : 400, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={13} />{days === 0 ? 'Closes today' : `${days} days left`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {opp.stipend && (
              <div style={{ padding: '0.625rem 1rem', background: 'var(--color-success-50)', borderRadius: 'var(--radius-md)', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-success-700)' }}>
                💰 {opp.stipend}
              </div>
            )}
          </Card>

          {/* Description */}
          <Card className="card-padded">
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.875rem' }}>About the role</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {opp.description || 'No description provided.'}
            </p>
          </Card>

          {/* Required Skills */}
          {opp.skills?.length > 0 && (
            <Card className="card-padded">
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Required skills</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {opp.skills.map((skill) => (
                  <div key={skill.id} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{skill.name}</span>
                        <Badge variant={skill.priority === 'MANDATORY' ? 'error' : 'warning'}>
                          {skill.priority === 'MANDATORY' ? 'Required' : 'Preferred'}
                        </Badge>
                      </div>
                      <SkillLevel level={skill.required_level} showLabel />
                    </div>
                    {/* match indicator from matchingSkills */}
                    {opp.matchingSkills?.find((m) => m.skillId === skill.id) ? (
                      <CheckCircle size={16} style={{ color: 'var(--color-success-500)' }} />
                    ) : opp.missingSkills?.find((m) => m.skillId === skill.id) ? (
                      <X size={16} style={{ color: 'var(--color-error-500)' }} />
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Eligibility */}
          {opp.eligibility && (
            <Card className="card-padded">
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.875rem' }}>Eligibility</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{opp.eligibility}</p>
            </Card>
          )}

          {/* Selection process */}
          {opp.selection_process && (
            <Card className="card-padded">
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.875rem' }}>Selection process</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{opp.selection_process}</p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '1rem' }}>
          {/* Apply CTA */}
          <Card className="card-padded">
            <Button
              style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem' }}
              onClick={() => setApplyOpen(true)}
            >
              <Briefcase size={14} /> Apply Now
            </Button>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              Your skill passport will be shared with your application
            </p>
          </Card>

          {/* Match score */}
          <MatchExplainer
            match={opp.match}
            matchingSkills={opp.matchingSkills}
            missingSkills={opp.missingSkills}
          />

          {/* Company info */}
          <Card className="card-padded">
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem' }}>About {opp.company?.name}</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {opp.company?.description || 'No company description available.'}
            </p>
            {opp.company?.website && (
              <a href={opp.company.website} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem', fontWeight: 600, marginTop: 8 }}>
                <ExternalLink size={12} /> Company website
              </a>
            )}
          </Card>
        </div>
      </div>

      {/* Apply modal */}
      <Modal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        title={`Apply to ${opp.title}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setApplyOpen(false)}>Cancel</Button>
            <Button loading={applyMut.isPending} onClick={() => applyMut.mutate({ opportunityId: id, applicationNote: note })}>
              Submit application
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Alert variant="info">
            Your skill passport, education, projects, and certifications will be shared automatically.
          </Alert>
          <div className="form-group">
            <label className="form-label" htmlFor="app-note">Cover note (optional)</label>
            <textarea
              id="app-note"
              className="input textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Briefly explain why you're a strong fit for this role…"
              rows={4}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
