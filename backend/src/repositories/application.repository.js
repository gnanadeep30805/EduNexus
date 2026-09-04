import { query } from '../db/pool.js'

export const VALID_STATUSES = ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'ASSESSMENT', 'INTERVIEW', 'SELECTED', 'REJECTED', 'WITHDRAWN']

const APP_FIELDS = `
  a.id, a.opportunity_id, a.student_id, a.company_id, a.status, a.match_score, a.match_strength,
  a.application_note, a.applied_at, a.updated_at,
  o.title AS opportunity_title, o.type AS opportunity_type, o.role_title,
  s.first_name, s.last_name, s.institution_name, s.course, s.location, s.verification_status,
  u.email
`

export const applicationRepo = {
  async listByCompany(companyId, { status, opportunityId, search, page = 1, pageSize = 10 } = {}) {
    const conditions = ['a.company_id = $1']
    const params = [companyId]
    if (status) { params.push(status); conditions.push(`a.status = $${params.length}`) }
    if (opportunityId) { params.push(opportunityId); conditions.push(`a.opportunity_id = $${params.length}`) }
    if (search) { params.push(`%${search}%`); conditions.push(`(s.first_name ILIKE $${params.length} OR s.last_name ILIKE $${params.length})`) }

    const where = conditions.join(' AND ')
    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM applications a
       JOIN students s ON s.id = a.student_id WHERE ${where}`,
      params,
    )
    const total = countResult.rows[0].total

    const offset = (page - 1) * pageSize
    params.push(pageSize, offset)
    const { rows } = await query(
      `SELECT ${APP_FIELDS} FROM applications a
       JOIN opportunities o ON o.id = a.opportunity_id
       JOIN students s ON s.id = a.student_id
       JOIN users u ON u.id = s.user_id
       WHERE ${where} ORDER BY a.applied_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    )
    return { total, items: rows }
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT ${APP_FIELDS} FROM applications a
       JOIN opportunities o ON o.id = a.opportunity_id
       JOIN students s ON s.id = a.student_id
       JOIN users u ON u.id = s.user_id
       WHERE a.id = $1`,
      [id],
    )
    return rows[0]
  },

  async findByIdForCompany(id, companyId) {
    const { rows } = await query(
      `SELECT ${APP_FIELDS} FROM applications a
       JOIN opportunities o ON o.id = a.opportunity_id
       JOIN students s ON s.id = a.student_id
       JOIN users u ON u.id = s.user_id
       WHERE a.id = $1 AND a.company_id = $2`,
      [id, companyId],
    )
    return rows[0]
  },

  async updateStatus(id, status, changedBy, note) {
    const client = await (await import('../db/pool.js')).getClient()
    try {
      await client.query('BEGIN')
      const { rows } = await client.query(
        `UPDATE applications SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [id, status],
      )
      const prev = rows[0]
      if (!prev) { await client.query('ROLLBACK'); return null }
      await client.query(
        `INSERT INTO application_status_history (application_id, from_status, to_status, changed_by, note)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, prev.status, status, changedBy, note],
      )
      await client.query('COMMIT')
      return rows[0]
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },

  async getHistory(applicationId) {
    const { rows } = await query(
      `SELECT * FROM application_status_history WHERE application_id = $1 ORDER BY created_at DESC`,
      [applicationId],
    )
    return rows
  },

  async create(opportunityId, studentId, companyId) {
    const { rows } = await query(
      `INSERT INTO applications (opportunity_id, student_id, company_id)
       VALUES ($1, $2, $3) ON CONFLICT (opportunity_id, student_id) DO UPDATE SET updated_at = NOW()
       RETURNING *`,
      [opportunityId, studentId, companyId],
    )
    return rows[0]
  },
}
