import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme) {
  const resolved = theme === 'system' ? getSystemTheme() : theme
  document.documentElement.setAttribute('data-theme', resolved)
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('edunexus_theme') || 'system')

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem('edunexus_theme', theme)
  }, [theme])

  // Watch system preference changes
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const isDark = theme === 'dark' || (theme === 'system' && getSystemTheme() === 'dark')

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
