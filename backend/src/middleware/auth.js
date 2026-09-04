import { Errors } from '../utils/errors.js'
import { authService } from '../services/auth.service.js'

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    req.user = await authService.requireAuth(token)
    next()
  } catch (error) {
    next(error)
  }
}

export function requireCompany(req, _res, next) {
  if (!req.user?.companyId) return next(Errors.forbidden('No company membership associated with this account'))
  next()
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user?.companyRole) return next(Errors.forbidden('No company role associated with this account'))
    if (!roles.includes(req.user.companyRole)) {
      return next(Errors.forbidden('You do not have permission to perform this action'))
    }
    next()
  }
}

export function requireVerified(req, _res, next) {
  const status = req.user?.company?.verification_status
  if (status !== 'VERIFIED') {
    return next(Errors.forbidden('Your organization must be verified to perform this action'))
  }
  next()
}
