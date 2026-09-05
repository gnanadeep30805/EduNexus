import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { Card, Button, Input, Textarea, Select, Badge, SkeletonCard, ErrorState, Progress, Alert } from '../../components/ui/index.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { User, Plus, Trash2, GraduationCap, Briefcase, Award, Activity } from 'lucide-react'

function useProfile() {
  return useQuery({
    queryKey: ['student', 'profile'],
    queryFn: () => api.get('/students/me/profile').then(r => r.data.data),
  })
}

export default function StudentProfile() {
  const toast = useToast()
  const qc = useQueryClient()
  const { data: profile, isLoading, error, refetch } = useProfile()
  const [saving, setSaving] = useState(false)

  const updateMut = useMutation({
    mutationFn: body => api.patch('/students/me/profile', body),
    onSuccess: () => { toast.success('Profile updated'); qc.invalidateQueries(['student', 'profile']); qc.invalidateQueries(['student', 'dashboard']) },
    onError: err => toast.error(err.message),
  })

  function handleSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const body = {
      first_name: fd.get('first_name'),
      last_name: fd.get('last_name'),
      institution_name: fd.get('institution_name'),
      course: fd.get('course'),
      graduation_year: fd.get('graduation_year') ? Number(fd.get('graduation_year')) : undefined,
      location: fd.get('location'),
      bio: fd.get('bio'),
      portfolio_url: fd.get('portfolio_url'),
      career_interests: fd.get('career_interests') ? fd.get('career_interests').split(',').map(s => s.trim()).filter(Boolean) : [],
      internship_availability: fd.get('internship_availability') === 'on',
    }
    updateMut.mutate(body)
  }

  if (isLoading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}><SkeletonCard lines={6} /><SkeletonCard lines={4} /></div>
  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const fields = [profile?.first_name, profile?.last_name, profile?.institution_name, profile?.course, profile?.graduation_year, profile?.location, profile?.bio, profile?.portfolio_url, profile?.career_interests?.length]
  const completion = Math.round((fields.filter(Boolean).length / fields.length) * 100)

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">PROFILE</p>
          <h1 className="section-title">My Profile</h1>
          <p className="section-desc">Your professional profile visible to industry recruiters</p>
        </div>
      </div>

      {/* Completion */}
      <Card className="card-padded" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Profile completion</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: completion >= 70 ? 'var(--color-success-600)' : 'var(--accent-primary)' }}>{completion}%</span>
        </div>
        <Progress value={completion} />
        {completion < 80 && <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 6 }}>Complete your profile to improve visibility to recruiters.</p>}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Personal */}
          <Card className="card-padded">
            <h2 className="card-title" style={{ marginBottom: '1rem' }}>Personal information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <Input id="first_name" label="First name" name="first_name" defaultValue={profile?.first_name || ''} required />
              <Input id="last_name" label="Last name" name="last_name" defaultValue={profile?.last_name || ''} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <Input id="institution_name" label="Institution" name="institution_name" defaultValue={profile?.institution_name || ''} placeholder="IIT Bombay" />
              <Input id="location" label="Location" name="location" defaultValue={profile?.location || ''} placeholder="Mumbai, India" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <Input id="course" label="Course / Degree" name="course" defaultValue={profile?.course || ''} placeholder="B.Tech Computer Science" />
              <Input id="graduation_year" label="Graduation year" name="graduation_year" type="number" min="2020" max="2035" defaultValue={profile?.graduation_year || ''} placeholder="2026" />
            </div>
            <Textarea id="bio" label="Bio" name="bio" defaultValue={profile?.bio || ''} placeholder="Tell recruiters about yourself, your interests, and goals…" />
          </Card>

          {/* Career */}
          <Card className="card-padded">
            <h2 className="card-title" style={{ marginBottom: '1rem' }}>Career & availability</h2>
            <Input id="portfolio_url" label="Portfolio URL" name="portfolio_url" type="url" defaultValue={profile?.portfolio_url || ''} placeholder="https://yourportfolio.com" style={{ marginBottom: '1rem' }} />
            <Input id="career_interests" label="Career interests" name="career_interests" defaultValue={profile?.career_interests?.join(', ') || ''} placeholder="Full Stack Developer, ML Engineer, DevOps" hint="Comma-separated list of your target roles" />
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: '1rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
              <input type="checkbox" name="internship_availability" defaultChecked={profile?.internship_availability} style={{ width: 16, height: 16, accentColor: 'var(--accent-primary)' }} />
              I am available for internships
            </label>
          </Card>

          <Button type="submit" loading={updateMut.isPending}>Save profile</Button>
        </form>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card className="card-padded">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1rem' }}>
              <div className="avatar avatar-primary avatar-xl avatar-square">
                {(profile?.first_name?.[0] || '') + (profile?.last_name?.[0] || '')}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{profile?.first_name} {profile?.last_name}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{profile?.course}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{profile?.institution_name}</div>
              </div>
            </div>
            {profile?.internship_availability && <Badge variant="success" dot>Available for internships</Badge>}
            {profile?.career_interests?.length > 0 && (
              <div style={{ marginTop: '0.875rem' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginBottom: 6 }}>CAREER INTERESTS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {profile.career_interests.map((interest, i) => <Badge key={i} variant="primary">{interest}</Badge>)}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
