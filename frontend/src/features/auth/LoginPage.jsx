import { useState } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button, Input, Alert } from '../../components/ui/index.jsx'
import { GraduationCap, Building2, School, Eye, EyeOff } from 'lucide-react'

const MODULES = [
  {
    key: 'student',
    icon: GraduationCap,
    label: 'Student',
    desc: 'Build your skill passport',
    defaultRoute: '/student/dashboard',
  },
  {
    key: 'industry',
    icon: Building2,
    label: 'Industry',
    desc: 'Manage hiring & talent',
    defaultRoute: '/industry/dashboard',
  },
  {
    key: 'academia',
    icon: School,
    label: 'Academia',
    desc: 'Institution intelligence',
    defaultRoute: '/academia/dashboard',
  },
]

const DEMO_CREDS = {
  student:  { email: 'arjun@demo.edunexus.in',  password: 'Password@123' },
  industry: { email: 'priya@technova.com',       password: 'Password@123' },
  academia: { email: 'admin@iitbombay.edunexus.in', password: 'Password@123' },
}

function getDefaultRoute(role) {
  if (role === 'STUDENT')  return '/student/dashboard'
  if (role === 'RECRUITER') return '/industry/dashboard'
  return '/academia/dashboard'
}

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()

  const [module, setModule] = useState('student')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]   = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to={getDefaultRoute(user.role)} replace />

  function fillDemo() {
    const creds = DEMO_CREDS[module]
    setEmail(creds.email)
    setPassword(creds.password)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login({ module, email, password })
      navigate(getDefaultRoute(data.user.role))
    } catch (err) {
      setError(err.message || 'Unable to sign in. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const selectedMod = MODULES.find((m) => m.key === module)

  return (
    <div className="auth-shell">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-header">
          <div className="auth-logo">
            <div className="auth-logo-mark">EN</div>
            <span className="auth-logo-name">EduNexus</span>
          </div>
          <p className="auth-eyebrow">
            {selectedMod?.label.toUpperCase()} WORKSPACE
          </p>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your {selectedMod?.label.toLowerCase()} workspace</p>
        </div>

        {/* Module selector */}
        <div className="auth-module-select" role="group" aria-label="Select workspace">
          {MODULES.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              className={`auth-module-btn ${module === key ? 'selected' : ''}`}
              onClick={() => { setModule(key); setError('') }}
            >
              <Icon size={14} style={{ marginBottom: 3, display: 'block', margin: '0 auto 4px' }} />
              {label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            id="email"
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="current-password"
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)',
                  display: 'flex', padding: 2,
                }}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          <Button type="submit" loading={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            Sign in
          </Button>

          <div className="auth-divider">or</div>

          <Button
            type="button"
            variant="secondary"
            onClick={fillDemo}
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem' }}
          >
            Fill demo credentials ({DEMO_CREDS[module].email})
          </Button>
        </form>

        {/* Register link */}
        <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '1.25rem' }}>
          New to EduNexus?{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>Create an account</Link>
        </p>
      </div>
    </div>
  )
}
