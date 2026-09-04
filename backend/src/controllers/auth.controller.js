import { asyncHandler, success } from '../utils/api.js'
import { authService } from '../services/auth.service.js'
import { Errors } from '../utils/errors.js'

export const login = asyncHandler(async (req, res) => {
  const { email, password, module } = req.body || {}
  if (!email || !password) throw Errors.badRequest('Email and password are required')
  const data = await authService.authenticate(email, password)
  if (module && !authService.moduleMatches(module, data.user.role)) throw Errors.forbidden('This account belongs to a different EduNexus module')
  success(res, data, 'Login successful')
})

export const register = asyncHandler(async (req, res) => {
  const { module = 'industry', fullName, email, password, organizationName } = req.body || {}
  if (!['student', 'industry', 'academia'].includes(module) || !fullName || !email || !password || (module !== 'student' && !organizationName)) {
    throw Errors.badRequest('Module, full name, email, password, and organization name are required')
  }
  if (password.length < 8) throw Errors.badRequest('Password must be at least 8 characters')
  const data = await authService.register({ module, fullName, email, password, organizationName })
  success(res, data, 'Account created. Your workspace is pending verification.', 201)
})

export const me = asyncHandler(async (req, res) => {
  success(res, {
    user: { id: req.user.id, fullName: req.user.fullName, email: req.user.email, role: req.user.role },
    membership: { companyId: req.user.companyId, companyRole: req.user.companyRole },
    institution: req.user.institution,
    company: req.user.company,
  }, 'Profile loaded')
})
