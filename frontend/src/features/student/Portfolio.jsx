import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { Card, Button, Input, Textarea, Modal, Badge, SkeletonCard, ErrorState, EmptyState, Tabs, Alert } from '../../components/ui/index.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { Plus, Code, Award, ExternalLink, Trash2, Calendar } from 'lucide-react'

function usePortfolio() {
  return useQuery({
    queryKey: ['student', 'portfolio'],
    queryFn: () => api.get('/students/me/portfolio').then(r => r.data.data),
  })
}

function ProjectCard({ project }) {
  const qc = useQueryClient()
  const toast = useToast()
  const deleteMut = useMutation({
    mutationFn: () => api.delete(`/students/me/portfolio/projects/${project.id}`),
    onSuccess: () => { toast.success('Project removed'); qc.invalidateQueries(['student', 'portfolio']) },
    onError: err => toast.error(err.message),
  })
  return (
    <Card className="card-padded">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
        <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--accent-light)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Code size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{project.title}</h3>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => deleteMut.mutate()} style={{ color: 'var(--color-error-600)' }}><Trash2 size={13} /></button>
          </div>
          {project.description && <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>{project.description}</p>}
          {project.skills?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
              {project.skills.map((s, i) => <Badge key={i} variant="primary">{typeof s === 'string' ? s : s.name}</Badge>)}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {(project.start_date || project.end_date) && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={11} />
                {project.start_date && new Date(project.start_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                {project.end_date && ` – ${new Date(project.end_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`}
              </span>
            )}
            {project.project_url && (
              <a href={project.project_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ExternalLink size={12} /> View project
              </a>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

function CertCard({ cert }) {
  const qc = useQueryClient()
  const toast = useToast()
  const deleteMut = useMutation({
    mutationFn: () => api.delete(`/students/me/portfolio/certifications/${cert.id}`),
    onSuccess: () => { toast.success('Certification removed'); qc.invalidateQueries(['student', 'portfolio']) },
    onError: err => toast.error(err.message),
  })
  return (
    <Card className="card-padded">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
        <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-warning-50)', color: 'var(--color-warning-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Award size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{cert.name}</h3>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => deleteMut.mutate()} style={{ color: 'var(--color-error-600)' }}><Trash2 size={13} /></button>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{cert.issuer}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {cert.issue_date && <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Issued {new Date(cert.issue_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>}
            {cert.credential_url && <a href={cert.credential_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}><ExternalLink size={12} /> View credential</a>}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function Portfolio() {
  const toast = useToast()
  const qc = useQueryClient()
  const { data, isLoading, error, refetch } = usePortfolio()
  const [tab, setTab] = useState('projects')
  const [addProject, setAddProject] = useState(false)
  const [addCert, setAddCert]       = useState(false)

  const addProjectMut = useMutation({
    mutationFn: body => api.post('/students/me/portfolio/projects', body),
    onSuccess: () => { toast.success('Project added'); qc.invalidateQueries(['student', 'portfolio']); setAddProject(false) },
    onError: err => toast.error(err.message),
  })
  const addCertMut = useMutation({
    mutationFn: body => api.post('/students/me/portfolio/certifications', body),
    onSuccess: () => { toast.success('Certification added'); qc.invalidateQueries(['student', 'portfolio']); setAddCert(false) },
    onError: err => toast.error(err.message),
  })

  if (isLoading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[0,1,2].map(i => <SkeletonCard key={i} lines={4} />)}</div>
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const projects = data?.projects || []
  const certs    = data?.certifications || []

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">PORTFOLIO</p>
          <h1 className="section-title">Portfolio</h1>
          <p className="section-desc">{projects.length} projects · {certs.length} certifications</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setAddCert(true)}><Plus size={14} /> Add Certification</button>
          <button className="btn btn-primary" onClick={() => setAddProject(true)}><Plus size={14} /> Add Project</button>
        </div>
      </div>

      <Tabs
        tabs={[{ key: 'projects', label: 'Projects', count: projects.length }, { key: 'certs', label: 'Certifications', count: certs.length }]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'projects' && (
        projects.length === 0
          ? <Card className="card-padded"><EmptyState icon={Code} title="No projects yet" description="Add your projects to showcase your work to recruiters." action={<button className="btn btn-primary btn-sm" onClick={() => setAddProject(true)}><Plus size={12} /> Add project</button>} /></Card>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>{projects.map(p => <ProjectCard key={p.id} project={p} />)}</div>
      )}

      {tab === 'certs' && (
        certs.length === 0
          ? <Card className="card-padded"><EmptyState icon={Award} title="No certifications yet" description="Add your certifications to build credibility." action={<button className="btn btn-primary btn-sm" onClick={() => setAddCert(true)}><Plus size={12} /> Add certification</button>} /></Card>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>{certs.map(c => <CertCard key={c.id} cert={c} />)}</div>
      )}

      {/* Add Project Modal */}
      <Modal open={addProject} onClose={() => setAddProject(false)} title="Add Project"
        footer={<><Button variant="secondary" onClick={() => setAddProject(false)}>Cancel</Button><Button form="project-form" type="submit" loading={addProjectMut.isPending}>Add Project</Button></>}>
        <form id="project-form" onSubmit={e => { e.preventDefault(); const fd = new FormData(e.currentTarget); addProjectMut.mutate({ title: fd.get('title'), description: fd.get('description'), skills: fd.get('skills')?.split(',').map(s => s.trim()).filter(Boolean), project_url: fd.get('project_url') || undefined, start_date: fd.get('start_date') || undefined, end_date: fd.get('end_date') || undefined }) }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input id="proj-title" label="Project title" name="title" required placeholder="E.g. Full-Stack Task Manager" />
          <Textarea id="proj-desc" label="Description" name="description" placeholder="What you built, technologies used, impact…" />
          <Input id="proj-skills" label="Skills used" name="skills" placeholder="React, Node.js, MongoDB (comma-separated)" hint="Separate with commas" />
          <Input id="proj-url" label="Project URL" name="project_url" type="url" placeholder="https://github.com/you/project" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input id="proj-start" label="Start date" name="start_date" type="date" />
            <Input id="proj-end" label="End date" name="end_date" type="date" />
          </div>
        </form>
      </Modal>

      {/* Add Cert Modal */}
      <Modal open={addCert} onClose={() => setAddCert(false)} title="Add Certification"
        footer={<><Button variant="secondary" onClick={() => setAddCert(false)}>Cancel</Button><Button form="cert-form" type="submit" loading={addCertMut.isPending}>Add Certification</Button></>}>
        <form id="cert-form" onSubmit={e => { e.preventDefault(); const fd = new FormData(e.currentTarget); addCertMut.mutate({ name: fd.get('name'), issuer: fd.get('issuer'), credential_url: fd.get('credential_url') || undefined, issue_date: fd.get('issue_date') || undefined }) }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input id="cert-name" label="Certification name" name="name" required placeholder="E.g. AWS Solutions Architect Associate" />
          <Input id="cert-issuer" label="Issuing organization" name="issuer" required placeholder="Amazon Web Services" />
          <Input id="cert-url" label="Credential URL" name="credential_url" type="url" placeholder="https://aws.amazon.com/verify/…" />
          <Input id="cert-date" label="Issue date" name="issue_date" type="date" />
        </form>
      </Modal>
    </div>
  )
}
