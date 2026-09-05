import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Bell, Search, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Avatar } from '../ui/index.jsx'

function getBreadcrumbs(pathname, role) {
  const parts = pathname.split('/').filter(Boolean)
  const workspace = parts[0]
  const section = parts[1]
  const sub = parts[2]

  const label = section
    ? section.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Dashboard'
  const subLabel = sub && !/^[0-9a-f-]{30,}$/.test(sub)
    ? sub.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : null

  return { workspace: workspace?.charAt(0).toUpperCase() + workspace?.slice(1), label, subLabel }
}

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth()
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const crumbs = getBreadcrumbs(location.pathname, user?.role)

  return (
    <header className="topbar">
      {/* Mobile menu button */}
      <button
        className="btn btn-ghost btn-sm btn-icon"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        style={{ display: 'none' }}
        id="mobile-menu-btn"
      >
        <Menu size={18} />
      </button>

      {/* Breadcrumb */}
      <div className="topbar-breadcrumb">
        <span>{crumbs.workspace}</span>
        <span className="topbar-breadcrumb-sep">/</span>
        <span className="topbar-breadcrumb-current">{crumbs.label}</span>
        {crumbs.subLabel && (
          <>
            <span className="topbar-breadcrumb-sep">/</span>
            <span className="topbar-breadcrumb-current">{crumbs.subLabel}</span>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="topbar-actions">
        {searchOpen ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              className="input"
              placeholder="Search…"
              autoFocus
              style={{ width: 220, height: 34, fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
            />
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setSearchOpen(false)} aria-label="Close search">
              <X size={16} />
            </button>
          </div>
        ) : (
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setSearchOpen(true)} aria-label="Search">
            <Search size={16} />
          </button>
        )}

        <Link to={`/${(user?.role || 'student').toLowerCase()}/notifications`}>
          <button className="btn btn-ghost btn-sm btn-icon" aria-label="Notifications">
            <Bell size={16} />
          </button>
        </Link>

        <Link to={`/${(user?.role || 'student').toLowerCase()}/settings`} style={{ textDecoration: 'none' }}>
          <Avatar name={user?.fullName || 'User'} size="sm" />
        </Link>
      </div>
    </header>
  )
}
