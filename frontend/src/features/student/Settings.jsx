import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useMutation } from '@tanstack/react-query'
import api from '../../services/api'
import { Card, Input, Button, Alert } from '../../components/ui/index.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { Moon, Sun, Monitor, Shield, User } from 'lucide-react'

export default function Settings() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const toast = useToast()
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw]         = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError]     = useState('')

  const changePwMut = useMutation({
    mutationFn: body => api.post('/auth/change-password', body),
    onSuccess: () => { toast.success('Password changed successfully'); setCurrentPw(''); setNewPw(''); setConfirmPw(''); setPwError('') },
    onError: err => setPwError(err.message),
  })

  function handlePwSubmit(e) {
    e.preventDefault()
    setPwError('')
    if (newPw !== confirmPw) { setPwError('New passwords do not match'); return }
    if (newPw.length < 8) { setPwError('Password must be at least 8 characters'); return }
    changePwMut.mutate({ currentPassword: currentPw, newPassword: newPw })
  }

  const THEMES = [
    { key: 'light',  icon: Sun,     label: 'Light' },
    { key: 'dark',   icon: Moon,    label: 'Dark' },
    { key: 'system', icon: Monitor, label: 'System' },
  ]

  return (
    <div>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">SETTINGS</p>
          <h1 className="section-title">Settings</h1>
          <p className="section-desc">Manage your account preferences</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 620 }}>
        {/* Account info */}
        <Card className="card-padded">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
            <User size={16} style={{ color: 'var(--accent-primary)' }} />
            <h2 className="card-title">Account</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>EMAIL</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{user?.email}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>ROLE</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{user?.role}</div>
            </div>
          </div>
        </Card>

        {/* Theme */}
        <Card className="card-padded">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
            <Monitor size={16} style={{ color: 'var(--accent-primary)' }} />
            <h2 className="card-title">Appearance</h2>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Choose your preferred color theme</p>
          <div style={{ display: 'flex', gap: 12 }}>
            {THEMES.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                style={{
                  flex: 1, padding: '0.875rem', border: `2px solid ${theme === key ? 'var(--accent-primary)' : 'var(--border-base)'}`,
                  borderRadius: 'var(--radius-lg)', background: theme === key ? 'var(--accent-light)' : 'var(--bg-surface)',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  color: theme === key ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Icon size={20} />
                <span style={{ fontSize: '0.8125rem', fontWeight: theme === key ? 700 : 500 }}>{label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Change Password */}
        <Card className="card-padded">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
            <Shield size={16} style={{ color: 'var(--accent-primary)' }} />
            <h2 className="card-title">Change Password</h2>
          </div>
          <form onSubmit={handlePwSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input id="cur-pw" label="Current password" type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required placeholder="••••••••" autoComplete="current-password" />
            <Input id="new-pw" label="New password" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={8} placeholder="Min 8 characters" autoComplete="new-password" />
            <Input id="confirm-pw" label="Confirm new password" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required placeholder="Re-enter new password" autoComplete="new-password" />
            {pwError && <Alert variant="error">{pwError}</Alert>}
            <Button type="submit" loading={changePwMut.isPending}>Update password</Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
