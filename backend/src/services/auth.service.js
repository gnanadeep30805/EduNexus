import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { config } from '../config.js'
import { query } from '../db/pool.js'
import { Errors } from '../utils/errors.js'
import { asyncHandler } from '../utils/api.js'

export function signToken(user, companyUser) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: companyUser?.company_id || null,
      companyRole: companyUser?.role || null,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpires },
  )
}

export const authService = {
  async authenticate(email, password) {
    const { rows } = await query('SELECT * FROM users WHERE lower(email) = lower($1)', [email])
    const user = rows[0]
    if (!user) throw Errors.unauthorized('Invalid credentials')
    const valid = await bcrypt.compare(password, user.password_hash || '')
    if (!valid) throw Errors.unauthorized('Invalid credentials')

    const compRows = await query(
      'SELECT * FROM company_users WHERE user_id = $1 AND is_active = TRUE',
      [user.id],
    )
    const membership = compRows.rows[0] || null

    const token = signToken(user, membership)

    const company = membership
      ? (await query('SELECT * FROM companies WHERE id = $1', [membership.company_id])).rows[0]
      : null

    return {
      token,
      user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role, avatar: user.avatar },
      membership: membership
        ? { companyId: membership.company_id, companyRole: membership.role, designation: membership.designation }
        : null,
      company: company
        ? { id: company.id, name: company.name, verificationStatus: company.verification_status, industry: company.industry }
        : null,
    }
  },

  async requireAuth(token) {
    if (!token) throw Errors.unauthorized()
    let payload
    try {
      payload = jwt.verify(token, config.jwtSecret)
    } catch {
      throw Errors.unauthorized('Invalid or expired token')
    }
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [payload.sub])
    const user = rows[0]
    if (!user) throw Errors.unauthorized('User not found')

    const compRows = await query(
      'SELECT * FROM company_users WHERE user_id = $1 AND is_active = TRUE',
      [user.id],
    )
    const membership = compRows.rows[0] || null

    return {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      companyId: membership?.company_id || null,
      companyRole: membership?.role || null,
      company: membership
        ? (await query('SELECT * FROM companies WHERE id = $1', [membership.company_id])).rows[0] || null
        : null,
    }
  },
}
