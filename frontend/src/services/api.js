import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('edunexus_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Normalize errors to { message, code }
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      'Something went wrong'
    const code = error.response?.data?.error?.code || 'UNKNOWN_ERROR'
    const status = error.response?.status || 0
    const enhanced = new Error(message)
    enhanced.code = code
    enhanced.status = status
    enhanced.details = error.response?.data?.error?.details || []
    return Promise.reject(enhanced)
  },
)

export default api
