import { asyncHandler, success } from '../utils/api.js'
import { authService } from '../services/auth.service.js'
import { Errors } from '../utils/errors.js'

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) throw Errors.badRequest('Email and password are required')
  const data = await authService.authenticate(email, password)
  success(res, data, 'Login successful')
})

export const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, companyName } = req.body || {}
  if (!fullName || !email || !password || !companyName) {
    throw Errors.badRequest('Full name, email, password, and company name are required')
  }
  if (password.length < 8) throw Errors.badRequest('Password must be at least 8 characters')
  const data = await authService.register({ fullName, email, password, companyName })
  success(res, data, 'Account created. Your company is pending verification.', 201)
})

export const me = asyncHandler(async (req, res) => {
  success(res, {
    user: { id: req.user.id, fullName: req.user.fullName, email: req.user.email, role: req.user.role },
    membership: { companyId: req.user.companyId, companyRole: req.user.companyRole },
    institution: req.user.institution,
    company: req.user.company,
  }, 'Profile loaded')
})
