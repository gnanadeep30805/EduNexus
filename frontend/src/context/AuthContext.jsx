import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null)
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem('edunexus_token')
    if (!token) { setLoading(false); return }
    try {
      const { data: res } = await api.get('/auth/me')
      setUser(res.data.user)
      setProfile(res.data)
    } catch {
      localStorage.removeItem('edunexus_token')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadProfile() }, [loadProfile])

  const login = useCallback(async ({ module, email, password }) => {
    const { data: res } = await api.post('/auth/login', { module, email, password })
    localStorage.setItem('edunexus_token', res.data.token)
    setUser(res.data.user)
    setProfile(res.data)
    return res.data
  }, [])

  const register = useCallback(async ({ module, fullName, email, password, organizationName }) => {
    const { data: res } = await api.post('/auth/register', { module, fullName, email, password, organizationName })
    localStorage.setItem('edunexus_token', res.data.token)
    setUser(res.data.user)
    setProfile(res.data)
    return res.data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('edunexus_token')
    setUser(null)
    setProfile(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, login, register, logout, loadProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
