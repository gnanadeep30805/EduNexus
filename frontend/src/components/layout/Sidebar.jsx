import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import {
  LayoutDashboard, User, Layers, Target, TrendingUp, BookOpen,
  Briefcase, FileText, Award, Bell, Settings, LogOut, ChevronDown,
  Users, Building2, BarChart3, GraduationCap, MessageSquare,
  Handshake, Search, Moon, Sun, Monitor, Menu, X, Zap,
  ClipboardList, Star, CircleDot, PieChart, UserCheck,
} from 'lucide-react'

const STUDENT_NAV = [
  {
    label: 'My Career Space',
    items: [
      { to: '/student/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/student/profile',       icon: User,            label: 'Profile' },
      { to: '/student/skill-passport',icon: Layers,          label: 'Skill Passport' },
      { to: '/student/skill-gaps',    icon: Target,          label: 'Skill Gaps' },
      { to: '/student/career-path',   icon: TrendingUp,      label: 'Career Path' },
      { to: '/student/learning',      icon: BookOpen,        label: 'Learning' },
      { to: '/student/assessments',   icon: ClipboardList,   label: 'Assessments' },
    ],
  },
  {
    label: 'Opportunities',
    items: [
      { to: '/student/opportunities', icon: Briefcase,  label: 'Browse Opportunities' },
      { to: '/student/applications',  icon: FileText,   label: 'My Applications' },
      { to: '/student/internships',   icon: Star,       label: 'Internships' },
    ],
  },
  {
    label: 'Portfolio',
    items: [
      { to: '/student/portfolio',       icon: Award,    label: 'Portfolio' },
      { to: '/student/certifications',  icon: GraduationCap, label: 'Certifications' },
      { to: '/student/notifications',   icon: Bell,     label: 'Notifications' },
      { to: '/student/settings',        icon: Settings, label: 'Settings' },
    ],
  },
]

const INDUSTRY_NAV = [
  {
    label: 'Recruitment',
    items: [
      { to: '/industry/dashboard',      icon: LayoutDashboard, label: 'Overview' },
      { to: '/industry/opportunities',  icon: Briefcase,       label: 'Opportunities' },
      { to: '/industry/candidates',     icon: Users,           label: 'Candidates' },
      { to: '/industry/recruitment',    icon: PieChart,        label: 'Pipeline' },
      { to: '/industry/interviews',     icon: MessageSquare,   label: 'Interviews' },
      { to: '/industry/offers',         icon: FileText,        label: 'Offers' },
    ],
  },
  {
    label: 'Collaboration',
    items: [
      { to: '/industry/collaborations', icon: Handshake,  label: 'Collaborations' },
    ],
  },
  {
    label: 'Company',
    items: [
      { to: '/industry/company',   icon: Building2, label: 'Company Profile' },
      { to: '/industry/settings',  icon: Settings,  label: 'Settings' },
      { to: '/industry/notifications', icon: Bell,  label: 'Notifications' },
    ],
  },
]

const ACADEMIA_NAV = [
  {
    label: 'Intelligence',
    items: [
      { to: '/academia/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/academia/skills',        icon: BarChart3,       label: 'Skill Intelligence' },
      { to: '/academia/curriculum',    icon: BookOpen,        label: 'Curriculum Alignment' },
    ],
  },
  {
    label: 'Students & Programs',
    items: [
      { to: '/academia/students',      icon: Users,        label: 'Students' },
      { to: '/academia/internships',   icon: Briefcase,    label: 'Internships' },
      { to: '/academia/placements',    icon: UserCheck,    label: 'Placements' },
      { to: '/academia/collaborations',icon: Handshake,    label: 'Collaborations' },
    ],
  },
  {
    label: 'Institution',
    items: [
      { to: '/academia/settings', icon: Settings, label: 'Settings' },
    ],
  },
]

function getNavConfig(role) {
  if (role === 'STUDENT')  return STUDENT_NAV
  if (role === 'RECRUITER') return INDUSTRY_NAV
  return ACADEMIA_NAV
}

function getWorkspaceLabel(role) {
  if (role === 'STUDENT')  return 'Student workspace'
  if (role === 'RECRUITER') return 'Industry workspace'
  return 'Academia workspace'
}

function WorkspaceAvatar({ name }) {
  const initials = (name || '').split(' ').slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || 'EN'
  return (
    <div className="sidebar-workspace-avatar">{initials}</div>
  )
}

function ThemeToggle({ compact = false }) {
  const { theme, setTheme } = useTheme()
  const options = [
    { key: 'light', icon: Sun,     label: 'Light' },
    { key: 'dark',  icon: Moon,    label: 'Dark' },
    { key: 'system',icon: Monitor, label: 'System' },
  ]
  return (
    <div style={{
      display: 'flex',
      gap: 2,
      background: 'var(--bg-overlay)',
      borderRadius: 'var(--radius-md)',
      padding: 3,
    }}>
      {options.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => setTheme(key)}
          aria-label={`${label} theme`}
          title={label}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: compact ? '4px 6px' : '4px 8px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: theme === key ? 'var(--bg-surface)' : 'transparent',
            color: theme === key ? 'var(--text-primary)' : 'var(--text-tertiary)',
            cursor: 'pointer',
            fontSize: '0.6875rem',
            fontWeight: theme === key ? 600 : 400,
            boxShadow: theme === key ? 'var(--shadow-sm)' : 'none',
            transition: 'all var(--transition-fast)',
          }}
        >
          <Icon size={12} />
          {!compact && label}
        </button>
      ))}
    </div>
  )
}

export default function Sidebar({ open, onClose }) {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()
  const navConfig = getNavConfig(user?.role)
  const orgName = profile?.company?.name || profile?.institution?.name || user?.fullName || 'EduNexus'
  const workspaceLabel = getWorkspaceLabel(user?.role)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Main navigation">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">EN</div>
          <span className="sidebar-logo-name">EduNexus</span>
          <button
            onClick={onClose}
            style={{ marginLeft: 'auto', display: 'none' }}
            className="btn btn-ghost btn-sm btn-icon mobile-only"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Workspace */}
        <div className="sidebar-workspace">
          <WorkspaceAvatar name={orgName} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-workspace-name truncate">{orgName}</div>
            <div className="sidebar-workspace-role">{workspaceLabel}</div>
          </div>
          <ChevronDown size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" aria-label="Site navigation">
          {navConfig.map(({ label, items }) => (
            <div key={label}>
              <p className="sidebar-nav-label">{label}</p>
              {items.map(({ to, icon: Icon, label: itemLabel }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => { if (window.innerWidth < 768) onClose() }}
                >
                  <Icon size={15} className="nav-item-icon" />
                  {itemLabel}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <ThemeToggle compact />
          <button
            className="nav-item"
            onClick={handleLogout}
            style={{ marginTop: 6, width: '100%', color: 'var(--color-error-600)' }}
          >
            <LogOut size={15} className="nav-item-icon" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
