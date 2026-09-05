// Shared UI primitives for EduNexus
// All components use design system CSS classes

import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

// ─── Button ───────────────────────────────────────────────────────
export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', icon: Icon, iconRight, loading, children, className = '', ...props },
  ref,
) {
  const sizeClass = { sm: 'btn-sm', md: '', lg: 'btn-lg' }[size]
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
    success: 'btn-success',
  }[variant] || 'btn-primary'

  return (
    <button
      ref={ref}
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={size === 'sm' ? 12 : 14} className="spinner" style={{ animation: 'spin 0.7s linear infinite', border: 'none', background: 'none' }} /> : Icon && <Icon size={size === 'sm' ? 12 : 14} />}
      {children}
      {iconRight && !loading && <iconRight size={14} />}
    </button>
  )
})

// ─── IconButton ───────────────────────────────────────────────────
export function IconButton({ icon: Icon, size = 'md', variant = 'ghost', label, className = '', ...props }) {
  const sizeClass = { sm: 'btn-sm', md: '', lg: 'btn-lg' }[size]
  const variantClass = { primary: 'btn-primary', secondary: 'btn-secondary', ghost: 'btn-ghost' }[variant]
  return (
    <button
      className={`btn btn-icon ${variantClass} ${sizeClass} ${className}`}
      aria-label={label}
      {...props}
    >
      <Icon size={size === 'sm' ? 14 : 16} />
    </button>
  )
}

// ─── Input ────────────────────────────────────────────────────────
export const Input = forwardRef(function Input({ label, hint, error, className = '', id, ...props }, ref) {
  return (
    <div className="form-group">
      {label && <label className="form-label" htmlFor={id}>{label}</label>}
      <input ref={ref} id={id} className={`input ${error ? 'error' : ''} ${className}`} {...props} />
      {hint && !error && <span className="form-hint">{hint}</span>}
      {error && <span className="form-error-text" role="alert">{error}</span>}
    </div>
  )
})

// ─── Textarea ─────────────────────────────────────────────────────
export const Textarea = forwardRef(function Textarea({ label, hint, error, className = '', id, ...props }, ref) {
  return (
    <div className="form-group">
      {label && <label className="form-label" htmlFor={id}>{label}</label>}
      <textarea ref={ref} id={id} className={`input textarea ${error ? 'error' : ''} ${className}`} {...props} />
      {hint && !error && <span className="form-hint">{hint}</span>}
      {error && <span className="form-error-text" role="alert">{error}</span>}
    </div>
  )
})

// ─── Select ───────────────────────────────────────────────────────
export const Select = forwardRef(function Select({ label, hint, error, children, className = '', id, ...props }, ref) {
  return (
    <div className="form-group">
      {label && <label className="form-label" htmlFor={id}>{label}</label>}
      <select ref={ref} id={id} className={`input select ${error ? 'error' : ''} ${className}`} {...props}>
        {children}
      </select>
      {hint && !error && <span className="form-hint">{hint}</span>}
      {error && <span className="form-error-text" role="alert">{error}</span>}
    </div>
  )
})

// ─── Card ─────────────────────────────────────────────────────────
export function Card({ children, padded = true, className = '', ...props }) {
  return (
    <div className={`card ${padded ? 'card-padded' : ''} ${className}`} {...props}>
      {children}
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────
const STATUS_BADGE_MAP = {
  // Application statuses
  APPLIED:       'neutral',
  UNDER_REVIEW:  'info',
  SHORTLISTED:   'primary',
  ASSESSMENT:    'warning',
  INTERVIEW:     'warning',
  SELECTED:      'success',
  REJECTED:      'error',
  WITHDRAWN:     'neutral',
  // Opportunity statuses
  PUBLISHED:     'success',
  DRAFT:         'neutral',
  PAUSED:        'warning',
  CLOSED:        'error',
  // Strength
  STRONG:        'success',
  GOOD:          'primary',
  MODERATE:      'warning',
  WEAK:          'error',
  // Generic
  ACTIVE:        'success',
  INACTIVE:      'neutral',
  PENDING:       'warning',
  VERIFIED:      'success',
  COMPLETED:     'success',
  AT_RISK:       'error',
  UPCOMING:      'info',
}

export function Badge({ variant, children, dot = false, className = '' }) {
  const v = variant || STATUS_BADGE_MAP[children] || STATUS_BADGE_MAP[String(children).toUpperCase()] || 'neutral'
  return (
    <span className={`badge badge-${v} ${dot ? 'badge-dot' : ''} ${className}`}>
      {children}
    </span>
  )
}

export function StatusBadge({ status, label }) {
  const display = label || String(status).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
  return <Badge variant={STATUS_BADGE_MAP[status] || 'neutral'}>{display}</Badge>
}

// ─── Avatar ───────────────────────────────────────────────────────
export function Avatar({ name = '?', size = 'md', square = false, src, className = '' }) {
  const initials = name.trim().split(' ').slice(0, 2).map((w) => w[0] || '').join('').toUpperCase()
  const sizeClass = { sm: 'avatar-sm', md: 'avatar-md', lg: 'avatar-lg', xl: 'avatar-xl' }[size]
  return (
    <div className={`avatar avatar-primary ${sizeClass} ${square ? 'avatar-square' : ''} ${className}`}>
      {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} /> : initials}
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────
export function Progress({ value = 0, max = 100, variant, className = '' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const v = variant || (pct >= 70 ? 'success' : pct >= 40 ? '' : 'error')
  return (
    <div className={`progress-track ${className}`} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div className={`progress-fill ${v}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

// ─── Progress Ring ─────────────────────────────────────────────────
export function ProgressRing({ value = 0, max = 100, size = 80, strokeWidth = 7, label, className = '' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  const color = pct >= 70 ? 'var(--color-success-500)' : pct >= 40 ? 'var(--accent-primary)' : 'var(--color-error-500)'
  return (
    <div className={`progress-ring ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-overlay)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="progress-ring-label" style={{ fontSize: size < 64 ? '0.75rem' : '1rem' }}>
        {label !== undefined ? label : `${Math.round(pct)}%`}
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────
export function Skeleton({ width, height = 16, className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width: width || '100%', height }}
      aria-hidden="true"
    />
  )
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card card-padded" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <Skeleton height={20} width="60%" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={14} width={i === lines - 1 ? '45%' : '100%'} />
      ))}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`empty-state ${className}`}>
      {Icon && (
        <div className="empty-state-icon">
          <Icon size={24} />
        </div>
      )}
      <p className="empty-state-title">{title}</p>
      {description && <p className="empty-state-desc">{description}</p>}
      {action}
    </div>
  )
}

// ─── Error State ──────────────────────────────────────────────────
export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" style={{ background: 'var(--color-error-50)', color: 'var(--color-error-500)' }}>
        <span style={{ fontSize: 24 }}>⚠</span>
      </div>
      <p className="empty-state-title">{title}</p>
      {message && <p className="empty-state-desc">{message}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button>
      )}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div
        className={`modal ${size === 'lg' ? 'modal-lg' : size === 'xl' ? 'modal-xl' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h2 className="modal-title" id="modal-title">{title}</h2>
          <IconButton icon={() => <span>✕</span>} label="Close modal" onClick={onClose} variant="ghost" size="sm" />
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

// ─── SkillLevel ───────────────────────────────────────────────────
const LEVEL_MAP = { BASIC: 1, INTERMEDIATE: 2, ADVANCED: 3, EXPERT: 4 }
export function SkillLevel({ level, showLabel = true }) {
  const n = LEVEL_MAP[level?.toUpperCase()] || 0
  const key = level?.toLowerCase() || 'basic'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div className="skill-level">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`skill-level-dot ${i <= n ? `filled ${key}` : ''}`} />
        ))}
      </div>
      {showLabel && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
          {level?.toLowerCase() || 'none'}
        </span>
      )}
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map(({ key, label, count }) => (
        <button
          key={key}
          role="tab"
          aria-selected={active === key}
          className={`tab-item ${active === key ? 'active' : ''}`}
          onClick={() => onChange(key)}
        >
          {label}
          {count !== undefined && (
            <span style={{ marginLeft: 4, fontSize: '0.6875rem', opacity: 0.7 }}>({count})</span>
          )}
        </button>
      ))}
    </div>
  )
}

// ─── Chip filter ──────────────────────────────────────────────────
export function Chip({ children, active, onClick }) {
  return (
    <button className={`chip ${active ? 'active' : ''}`} onClick={onClick} type="button">
      {children}
    </button>
  )
}

// ─── Alert ────────────────────────────────────────────────────────
export function Alert({ variant = 'info', title, children, icon: Icon }) {
  return (
    <div className={`alert alert-${variant}`} role="alert">
      {Icon && <Icon size={16} style={{ flexShrink: 0, marginTop: 1 }} />}
      <div>
        {title && <div style={{ fontWeight: 600, marginBottom: 2 }}>{title}</div>}
        {children}
      </div>
    </div>
  )
}

// ─── Match Score Badge ─────────────────────────────────────────────
export function MatchScore({ score, strength, size = 'sm' }) {
  const s = (strength || '').toLowerCase()
  const color = s === 'strong' ? 'var(--color-success-600)' : s === 'good' ? 'var(--color-primary-600)' : s === 'moderate' ? 'var(--color-warning-600)' : 'var(--color-error-600)'
  return (
    <span style={{ fontWeight: 700, fontSize: size === 'sm' ? '0.8125rem' : '1rem', color }}>
      {Math.round(score)}%
    </span>
  )
}

// ─── Loading state ────────────────────────────────────────────────
export function LoadingPage({ message = 'Loading your workspace…' }) {
  return (
    <div className="loading-page">
      <div className="loading-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div className="sidebar-logo-mark" style={{ width: 32, height: 32, fontSize: '0.875rem' }}>E</div>
          <span style={{ fontWeight: 800, fontSize: '1.0625rem', letterSpacing: '-0.03em' }}>EduNexus</span>
        </div>
        <div className="spinner spinner-lg" />
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 4 }}>{message}</p>
      </div>
    </div>
  )
}

// ─── Inline Loading ────────────────────────────────────────────────
export function InlineLoading({ message = 'Loading…' }) {
  return (
    <div className="empty-state">
      <div className="spinner" />
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{message}</p>
    </div>
  )
}
