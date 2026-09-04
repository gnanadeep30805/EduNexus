import { query } from '../db/pool.js'

export const offerRepo = {
  async listByCompany(companyId) {
    const { rows } = await query(
      `SELECT off.*, s.first_name, s.last_name, o.title AS opportunity_title
       FROM offers off
       JOIN students s ON s.id = off.student_id
       JOIN opportunities o ON o.id = off.opportunity_id
       WHERE off.company_id = $1 ORDER BY off.created_at DESC`,
      [companyId],
    )
    return rows
  },

  async findByIdForCompany(id, companyId) {
    const { rows } = await query(
      `SELECT off.*, s.first_name, s.last_name, o.title AS opportunity_title
       FROM offers off
       JOIN students s ON s.id = off.student_id
       JOIN opportunities o ON o.id = off.opportunity_id
       WHERE off.id = $1 AND off.company_id = $2`,
      [id, companyId],
    )
    return rows[0]
  },

  async create(data) {
    const { rows } = await query(
      `INSERT INTO offers (company_id, application_id, opportunity_id, student_id, role_title,
        compensation, offer_date, joining_date, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [data.companyId, data.applicationId, data.opportunityId, data.studentId, data.roleTitle,
        data.compensation, data.offerDate, data.joiningDate, data.status, data.notes],
    )
    return rows[0]
  },

  async updateStatus(id, status) {
    const { rows } = await query(
      'UPDATE offers SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id, status],
    )
    return rows[0]
  },
}
