// Reuse the same Settings component pattern for industry
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useMutation } from '@tanstack/react-query'
import api from '../../services/api'
import { Card, Input, Button, Alert } from '../../components/ui/index.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useState } from 'react'
import { Moon, Sun, Monitor, Shield, User } from 'lucide-react'

export default function IndustrySettings() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const toast = useToast()
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')

  const changePwMut = useMutation({
    mutationFn: body => api.post('/auth/change-password', body),
    onSuccess: () => { toast.success('Password changed'); setCurrentPw(''); setNewPw(''); setConfirmPw(''); setPwError('') },
    onError: err => setPwError(err.message),
  })

  const THEMES = [{ key: 'light', icon: Sun, label: 'Light' }, { key: 'dark', icon: Moon, label: 'Dark' }, { key: 'system', icon: Monitor, label: 'System' }]

  return (
    <div>
      <div className="section-header"><div><p className="section-eyebrow">SETTINGS</p><h1 className="section-title">Settings</h1></div></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 620 }}>
        <Card className="card-padded">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}><User size={16} style={{ color: 'var(--accent-primary)' }} /><h2 className="card-title">Account</h2></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>EMAIL</div><div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{user?.email}</div></div>
            <div><div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>ROLE</div><div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{user?.role}</div></div>
          </div>
        </Card>
        <Card className="card-padded">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}><Monitor size={16} style={{ color: 'var(--accent-primary)' }} /><h2 className="card-title">Appearance</h2></div>
          <div style={{ display: 'flex', gap: 12 }}>
            {THEMES.map(({ key, icon: Icon, label }) => (
              <button key={key} onClick={() => setTheme(key)} style={{ flex: 1, padding: '0.875rem', border: `2px solid ${theme === key ? 'var(--accent-primary)' : 'var(--border-base)'}`, borderRadius: 'var(--radius-lg)', background: theme === key ? 'var(--accent-light)' : 'var(--bg-surface)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: theme === key ? 'var(--accent-primary)' : 'var(--text-secondary)', transition: 'all var(--transition-fast)' }}>
                <Icon size={20} /><span style={{ fontSize: '0.8125rem', fontWeight: theme === key ? 700 : 500 }}>{label}</span>
              </button>
            ))}
          </div>
        </Card>
        <Card className="card-padded">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}><Shield size={16} style={{ color: 'var(--accent-primary)' }} /><h2 className="card-title">Change Password</h2></div>
          <form onSubmit={e => { e.preventDefault(); setPwError(''); if (newPw !== confirmPw) { setPwError('Passwords do not match'); return } changePwMut.mutate({ currentPassword: currentPw, newPassword: newPw }) }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input id="is-cur-pw" label="Current password" type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required />
            <Input id="is-new-pw" label="New password" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={8} />
            <Input id="is-confirm-pw" label="Confirm new password" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required />
            {pwError && <Alert variant="error">{pwError}</Alert>}
            <Button type="submit" loading={changePwMut.isPending}>Update password</Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
