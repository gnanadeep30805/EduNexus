import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { config } from '../config.js'
import { getClient, query } from '../db/pool.js'
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
  moduleMatches(module, role) {
    if (module === 'industry') return role === 'RECRUITER'
    if (module === 'academia') return ['ACADEMIA', 'ADMIN'].includes(role)
    return role === 'STUDENT'
  },

  async register({ module, fullName, email, password, organizationName }) {
    const client = await getClient()
    try {
      await client.query('BEGIN')
      const existing = await client.query('SELECT id FROM users WHERE lower(email) = lower($1)', [email])
      if (existing.rows[0]) throw Errors.conflict('An account with this email already exists')

      const passwordHash = await bcrypt.hash(password, 12)
      const role = module === 'industry' ? 'RECRUITER' : module === 'academia' ? 'ACADEMIA' : 'STUDENT'
      const userResult = await client.query(
        `INSERT INTO users (full_name, email, password_hash, role)
         VALUES ($1, lower($2), $3, $4) RETURNING *`,
        [fullName, email, passwordHash, role],
      )
      const user = userResult.rows[0]
      let membership = null
      let company = null
      let institution = null
      if (module === 'industry') {
        const result = await client.query(`INSERT INTO companies (name, verification_status, created_by) VALUES ($1, 'PENDING', $2) RETURNING *`, [organizationName, user.id])
        company = result.rows[0]
        membership = (await client.query(`INSERT INTO company_users (company_id, user_id, role, designation) VALUES ($1, $2, 'COMPANY_ADMIN', 'Company administrator') RETURNING *`, [company.id, user.id])).rows[0]
      } else if (module === 'academia') {
        const result = await client.query(`INSERT INTO institutions (name, verification_status) VALUES ($1, 'PENDING') RETURNING *`, [organizationName])
        institution = result.rows[0]
        await client.query(`INSERT INTO institution_users (institution_id, user_id, role, is_active) VALUES ($1, $2, 'INSTITUTION_ADMIN', TRUE)`, [institution.id, user.id])
      } else {
        await client.query(`INSERT INTO students (user_id, first_name, last_name, institution_name, verification_status, consent_public_visibility) VALUES ($1, $2, '', $3, 'PENDING', FALSE)`, [user.id, fullName, organizationName || null])
      }
      await client.query('COMMIT')
      return {
        token: signToken(user, membership),
        user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role },
        membership: membership ? { companyId: company.id, companyRole: membership.role } : null,
        institution: institution ? { institutionId: institution.id, institutionRole: 'INSTITUTION_ADMIN', name: institution.name, verificationStatus: institution.verification_status } : null,
        company: company ? { id: company.id, name: company.name, verificationStatus: company.verification_status } : null,
      }
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },

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
    const institutionRows = await query(
      `SELECT iu.*, i.name AS institution_name, i.verification_status
       FROM institution_users iu JOIN institutions i ON i.id = iu.institution_id
       WHERE iu.user_id = $1 AND iu.is_active = TRUE LIMIT 1`,
      [user.id],
    )
    const institution = institutionRows.rows[0] || null

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
      institution: institution
        ? { institutionId: institution.institution_id, institutionRole: institution.role, name: institution.institution_name, verificationStatus: institution.verification_status }
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
    const institutionRows = await query(
      `SELECT iu.*, i.name AS institution_name, i.verification_status
       FROM institution_users iu JOIN institutions i ON i.id = iu.institution_id
       WHERE iu.user_id = $1 AND iu.is_active = TRUE LIMIT 1`,
      [user.id],
    )
    const institution = institutionRows.rows[0] || null

    return {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      companyId: membership?.company_id || null,
      companyRole: membership?.role || null,
      institutionId: institution?.institution_id || null,
      institutionRole: institution?.role || null,
      institution: institution
        ? { id: institution.institution_id, name: institution.institution_name, verificationStatus: institution.verification_status }
        : null,
      company: membership
        ? (await query('SELECT * FROM companies WHERE id = $1', [membership.company_id])).rows[0] || null
        : null,
    }
  },
}
