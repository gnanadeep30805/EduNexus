import { asyncHandler, success } from '../utils/api.js'
import { authService } from '../services/auth.service.js'
import { Errors } from '../utils/errors.js'

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) throw Errors.badRequest('Email and password are required')
  const data = await authService.authenticate(email, password)
  success(res, data, 'Login successful')
})

export const me = asyncHandler(async (req, res) => {
  success(res, {
    user: { id: req.user.id, fullName: req.user.fullName, email: req.user.email, role: req.user.role },
    membership: { companyId: req.user.companyId, companyRole: req.user.companyRole },
    company: req.user.company,
  }, 'Profile loaded')
})
