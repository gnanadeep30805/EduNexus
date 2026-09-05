import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const addToast = useCallback(({ type = 'info', message, duration = 4000 }) => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration)
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = {
    success: (msg, opts) => addToast({ type: 'success', message: msg, ...opts }),
    error:   (msg, opts) => addToast({ type: 'error',   message: msg, ...opts }),
    info:    (msg, opts) => addToast({ type: 'info',    message: msg, ...opts }),
    warning: (msg, opts) => addToast({ type: 'warning', message: msg, ...opts }),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container" role="log" aria-live="polite">
        {toasts.map(({ id, type, message }) => {
          const Icon = ICONS[type] || Info
          return (
            <div key={id} className={`toast toast-${type}`} role="alert">
              <Icon size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span className="toast-message">{message}</span>
              <button
                onClick={() => removeToast(id)}
                className="btn btn-ghost btn-sm btn-icon"
                aria-label="Dismiss"
                style={{ flexShrink: 0 }}
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
