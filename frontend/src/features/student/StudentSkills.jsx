import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import {
  Card, Button, Input, Textarea, Select, Badge, SkeletonCard, ErrorState, EmptyState,
  SkillLevel, Progress, Alert,
} from '../../components/ui/index.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { Plus, Trash2, Tag, Award, BookOpen, Upload } from 'lucide-react'

const LEVELS = ['BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']
const CATEGORIES = ['Programming', 'Frontend', 'Backend', 'Database', 'Cloud', 'DevOps', 'AI/ML', 'Cybersecurity', 'Data', 'Soft Skills', 'Other']

function useSkills() {
  return useQuery({
    queryKey: ['student', 'skills'],
    queryFn: () => api.get('/students/me/skills').then((r) => r.data.data),
  })
}

function AddSkillForm({ available = [], onAdd }) {
  const [name, setName]   = useState('')
  const [level, setLevel] = useState('BASIC')
  const [filtered, setFiltered] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)

  function handleSearch(val) {
    setName(val)
    if (val.length >= 1) {
      const f = available.filter((s) => s.name.toLowerCase().includes(val.toLowerCase())).slice(0, 8)
      setFiltered(f)
      setShowDropdown(f.length > 0)
    } else {
      setShowDropdown(false)
    }
  }

  function pickSkill(skillName) {
    setName(skillName)
    setShowDropdown(false)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({ name: name.trim(), level })
    setName('')
    setLevel('BASIC')
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <div style={{ position: 'relative' }}>
        <Input
          id="skill-name"
          label="Skill name"
          value={name}
          onChange={(e) => handleSearch(e.target.value)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder="Type to search skills…"
          autoComplete="off"
        />
        {showDropdown && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
            background: 'var(--bg-surface)', border: '1px solid var(--border-base)',
            borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
            marginTop: 2, overflow: 'hidden',
          }}>
            {filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => pickSkill(s.name)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '0.5rem 0.75rem', border: 'none', background: 'none',
                  cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--text-primary)',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = ''}
              >
                <Tag size={12} style={{ color: 'var(--text-tertiary)' }} />
                {s.name}
                <span style={{ marginLeft: 'auto', fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>{s.category}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Select id="skill-level" label="Proficiency level" value={level} onChange={(e) => setLevel(e.target.value)}>
        {LEVELS.map((l) => (
          <option key={l} value={l}>{l.charAt(0) + l.slice(1).toLowerCase()}</option>
        ))}
      </Select>

      <Button type="submit" icon={Plus}>Add skill</Button>
    </form>
  )
}

function EvidenceModal({ skill, onClose }) {
  const toast = useToast()
  const qc = useQueryClient()
  const [type, setType]   = useState('PROJECT')
  const [title, setTitle] = useState('')
  const [desc, setDesc]   = useState('')
  const [url, setUrl]     = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post(`/students/me/skills/${skill.id}/evidence`, {
        evidenceType: type, title, description: desc, url: url || undefined,
      })
      toast.success('Evidence added successfully')
      qc.invalidateQueries(['student', 'skills'])
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal aria-labelledby="ev-modal-title">
        <div className="modal-header">
          <h2 className="modal-title" id="ev-modal-title">Add evidence — {skill.name}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Select id="ev-type" label="Evidence type" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="PROJECT">Project</option>
              <option value="ASSESSMENT">Assessment</option>
              <option value="CERTIFICATION">Certification</option>
              <option value="INTERNSHIP">Internship</option>
              <option value="COURSE">Course</option>
            </Select>
            <Input id="ev-title" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Full-Stack Todo App" />
            <Textarea id="ev-desc" label="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Briefly describe what you built or learned…" />
            <Input id="ev-url" label="URL (optional)" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/you/project" />
          </div>
          <div className="modal-footer">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Add evidence</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function StudentSkills() {
  const toast = useToast()
  const qc = useQueryClient()
  const { data, isLoading, error, refetch } = useSkills()
  const [evidenceSkill, setEvidenceSkill] = useState(null)
  const [catFilter, setCatFilter] = useState('All')

  const addMut = useMutation({
    mutationFn: (body) => api.post('/students/me/skills', body),
    onSuccess: () => { toast.success('Skill added to your passport'); qc.invalidateQueries(['student', 'skills']) },
    onError: (err) => toast.error(err.message),
  })

  const removeMut = useMutation({
    mutationFn: (id) => api.delete(`/students/me/skills/${id}`),
    onSuccess: () => { toast.success('Skill removed'); qc.invalidateQueries(['student', 'skills']) },
    onError: (err) => toast.error(err.message),
  })

  if (isLoading) return <div className="metric-grid">{[0,1,2].map((i) => <SkeletonCard key={i} lines={4} />)}</div>
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const mySkills    = data?.skills || []
  const available   = data?.available || []
  const categories  = ['All', ...new Set(mySkills.map((s) => s.category).filter(Boolean))]
  const filtered    = catFilter === 'All' ? mySkills : mySkills.filter((s) => s.category === catFilter)

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">SKILLS</p>
          <h1 className="section-title">My Skills</h1>
          <p className="section-desc">{mySkills.length} skills in your profile</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Add skill panel */}
        <Card className="card-padded" style={{ position: 'sticky', top: '1rem' }}>
          <h3 className="card-title" style={{ marginBottom: '1rem' }}>Add a skill</h3>
          <AddSkillForm available={available} onAdd={(body) => addMut.mutate(body)} />
          {mySkills.length > 0 && (
            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-base)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 8 }}>OVERVIEW</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {LEVELS.map((level) => {
                  const count = mySkills.filter((s) => (s.verified_level || s.self_level) === level).length
                  return count > 0 ? (
                    <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', width: 80, textTransform: 'capitalize' }}>
                        {level.toLowerCase()}
                      </span>
                      <Progress value={count} max={mySkills.length} style={{ flex: 1 }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', width: 20, textAlign: 'right' }}>{count}</span>
                    </div>
                  ) : null
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Skills list */}
        <div>
          {/* Category filter */}
          {categories.length > 2 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1rem' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`chip ${catFilter === cat ? 'active' : ''}`}
                  onClick={() => setCatFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="No skills yet"
              description="Search for a skill and add your proficiency level to build your skill passport."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filtered.map((skill) => (
                <Card key={skill.id} className="card-padded">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--radius-md)',
                      background: 'var(--accent-light)', color: 'var(--accent-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Tag size={17} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>{skill.name}</h3>
                        {skill.category && <Badge variant="neutral">{skill.category}</Badge>}
                        {skill.verified_level && <Badge variant="success">Assessed</Badge>}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginBottom: 2 }}>Self-assessed</div>
                          <SkillLevel level={skill.self_level} />
                        </div>
                        {skill.verified_level && (
                          <div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginBottom: 2 }}>Verified</div>
                            <SkillLevel level={skill.verified_level} />
                          </div>
                        )}
                        <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          {skill.evidence_count} evidence · {skill.verified_evidence_count} verified
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setEvidenceSkill(skill)}
                        >
                          <Upload size={12} /> Add evidence
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => removeMut.mutate(skill.id)}
                          style={{ color: 'var(--color-error-600)' }}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {evidenceSkill && <EvidenceModal skill={evidenceSkill} onClose={() => setEvidenceSkill(null)} />}
    </div>
  )
}
