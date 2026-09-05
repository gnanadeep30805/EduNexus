import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <style>{`
          @media (max-width: 768px) {
            #mobile-menu-btn { display: flex !important; }
          }
        `}</style>
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  )
}
