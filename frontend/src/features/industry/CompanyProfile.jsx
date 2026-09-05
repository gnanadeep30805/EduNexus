import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { Card, Button, Input, Textarea, Select, Badge, SkeletonCard, ErrorState } from '../../components/ui/index.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { Building2, Globe, Mail, Phone } from 'lucide-react'

function useCompany() {
  return useQuery({
    queryKey: ['industry', 'company'],
    queryFn: () => api.get('/industry/company').then(r => r.data.data),
  })
}

const SIZE_OPTIONS = ['1-10','11-50','51-200','201-500','501-1000','1001-5000','5000+']
const INDUSTRY_OPTIONS = ['Technology','Finance','Healthcare','Education','E-Commerce','Manufacturing','Consulting','Media','Other']

export default function CompanyProfile() {
  const toast = useToast()
  const qc = useQueryClient()
  const { data, isLoading, error, refetch } = useCompany()

  const updateMut = useMutation({
    mutationFn: body => api.put('/industry/company', body),
    onSuccess: () => { toast.success('Company profile updated'); qc.invalidateQueries(['industry', 'company']) },
    onError: err => toast.error(err.message),
  })

  if (isLoading) return <SkeletonCard lines={8} />
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const company = data?.company || data || {}

  function handleSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    updateMut.mutate({
      name: fd.get('name'), industry: fd.get('industry'), description: fd.get('description'),
      website: fd.get('website'), contactEmail: fd.get('contact_email'), contactPhone: fd.get('contact_phone'),
      companySize: fd.get('company_size'),
      technologyAreas: fd.get('technology_areas')?.split(',').map(s => s.trim()).filter(Boolean),
    })
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">COMPANY</p>
          <h1 className="section-title">Company Profile</h1>
          <p className="section-desc">Visible to students browsing opportunities</p>
        </div>
        {company.is_verified && <Badge variant="success" dot>Verified company</Badge>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', alignItems: 'start' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card className="card-padded">
            <h2 className="card-title" style={{ marginBottom: '1rem' }}>Basic information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <Input id="c-name" label="Company name" name="name" defaultValue={company.name || ''} required />
              <Select id="c-industry" label="Industry" name="industry" defaultValue={company.industry || ''}>
                <option value="">Select industry…</option>
                {INDUSTRY_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
              </Select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <Select id="c-size" label="Company size" name="company_size" defaultValue={company.company_size || ''}>
                <option value="">Select size…</option>
                {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s} employees</option>)}
              </Select>
              <Input id="c-website" label="Website" name="website" type="url" defaultValue={company.website || ''} placeholder="https://company.com" />
            </div>
            <Textarea id="c-desc" label="Company description" name="description" defaultValue={company.description || ''} placeholder="Tell students about your company, culture, and what you're building…" />
          </Card>

          <Card className="card-padded">
            <h2 className="card-title" style={{ marginBottom: '1rem' }}>Contact & technology</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <Input id="c-email" label="Contact email" name="contact_email" type="email" defaultValue={company.contact_email || ''} />
              <Input id="c-phone" label="Contact phone" name="contact_phone" defaultValue={company.contact_phone || ''} />
            </div>
            <Input id="c-tech" label="Technology areas" name="technology_areas" defaultValue={company.technology_areas?.join(', ') || ''} hint="Comma-separated: React, Node.js, AWS, Machine Learning…" />
          </Card>

          <Button type="submit" loading={updateMut.isPending}>Save company profile</Button>
        </form>

        {/* Preview card */}
        <Card className="card-padded" style={{ position: 'sticky', top: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--accent-light)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.25rem' }}>
              {company.name?.charAt(0) || 'C'}
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>{company.name || 'Your Company'}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{company.industry || 'Industry'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {company.website && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Globe size={13} />{company.website}</span>}
            {company.contact_email && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={13} />{company.contact_email}</span>}
            {company.contact_phone && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={13} />{company.contact_phone}</span>}
            {company.company_size && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Building2 size={13} />{company.company_size} employees</span>}
          </div>
          {company.technology_areas?.length > 0 && (
            <div style={{ marginTop: '0.875rem' }}>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginBottom: 6 }}>TECHNOLOGY</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {company.technology_areas.map((t, i) => <Badge key={i} variant="primary">{t}</Badge>)}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
