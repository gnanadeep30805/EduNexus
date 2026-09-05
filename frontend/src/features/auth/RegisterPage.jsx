import { useState } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button, Input, Alert } from '../../components/ui/index.jsx'
import { GraduationCap, Building2, School } from 'lucide-react'

const MODULES = [
  { key: 'student',  icon: GraduationCap, label: 'Student',  orgLabel: 'Institution name (optional)', orgRequired: false },
  { key: 'industry', icon: Building2,     label: 'Industry', orgLabel: 'Company name',                orgRequired: true  },
  { key: 'academia', icon: School,        label: 'Academia', orgLabel: 'Institution name',            orgRequired: true  },
]

function getDefaultRoute(role) {
  if (role === 'STUDENT')   return '/student/dashboard'
  if (role === 'RECRUITER') return '/industry/dashboard'
  return '/academia/dashboard'
}

export default function RegisterPage() {
  const { user, register } = useAuth()
  const navigate = useNavigate()

  const [module, setModule]           = useState('student')
  const [fullName, setFullName]       = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [orgName, setOrgName]         = useState('')
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)

  if (user) return <Navigate to={getDefaultRoute(user.role)} replace />

  const mod = MODULES.find((m) => m.key === module)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const data = await register({ module, fullName, email, password, organizationName: orgName })
      navigate(getDefaultRoute(data.user.role))
    } catch (err) {
      setError(err.message || 'Unable to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="auth-logo-mark">EN</div>
            <span className="auth-logo-name">EduNexus</span>
          </div>
          <p className="auth-eyebrow">Create Your Account</p>
          <h1 className="auth-title">Get started</h1>
          <p className="auth-subtitle">Build skills. Connect with industry. Build careers.</p>
        </div>

        {/* Module selector */}
        <div className="auth-module-select" role="group" aria-label="Select workspace type">
          {MODULES.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              className={`auth-module-btn ${module === key ? 'selected' : ''}`}
              onClick={() => { setModule(key); setError('') }}
            >
              <Icon size={14} style={{ display: 'block', margin: '0 auto 4px' }} />
              {label}
            </button>
          ))}
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            id="full-name"
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Arjun Mehta"
            required
            autoComplete="name"
          />

          <Input
            id="reg-email"
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />

          <Input
            id="reg-org"
            label={mod?.orgLabel}
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder={module === 'industry' ? 'TechNova Solutions' : module === 'academia' ? 'IIT Bombay' : 'IIT Delhi'}
            required={mod?.orgRequired}
            autoComplete="organization"
          />

          <Input
            id="reg-password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            required
            minLength={8}
            autoComplete="new-password"
            hint="At least 8 characters"
          />

          {error && <Alert variant="error">{error}</Alert>}

          <Button type="submit" loading={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            Create {mod?.label} account
          </Button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '1.25rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
