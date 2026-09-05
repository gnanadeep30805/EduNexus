import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingPage } from '../components/ui/index.jsx'
import AppShell from '../components/layout/AppShell'

export function RequireAuth({ role }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingPage />
  if (!user)   return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/login" replace />
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

export function RedirectIfAuth() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingPage />
  if (!user)   return <Outlet />
  if (user.role === 'STUDENT')   return <Navigate to="/student/dashboard" replace />
  if (user.role === 'RECRUITER') return <Navigate to="/industry/dashboard" replace />
  return <Navigate to="/academia/dashboard" replace />
}
