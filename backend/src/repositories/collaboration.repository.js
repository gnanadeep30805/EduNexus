import { query } from '../db/pool.js'

export const collaborationRepo = {
  async listByCompany(companyId, { status } = {}) {
    const conditions = ['c.company_id = $1']
    const params = [companyId]
    if (status) { params.push(status); conditions.push(`c.status = $${params.length}`) }
    const { rows } = await query(
      `SELECT c.*, comp.name AS company_name FROM collaborations c
       JOIN companies comp ON comp.id = c.company_id
       WHERE ${conditions.join(' AND ')} ORDER BY c.created_at DESC`,
      params,
    )
    return rows
  },

  async listForAcademia({ status } = {}) {
    const conditions = ["c.status IN ('PROPOSED','ACTIVE')"]
    const params = []
    if (status) { params.push(status); conditions.push(`c.status = $${params.length}`) }
    const { rows } = await query(
      `SELECT c.*, comp.name AS company_name FROM collaborations c
       JOIN companies comp ON comp.id = c.company_id
       WHERE ${conditions.join(' AND ')} ORDER BY c.created_at DESC`,
      params,
    )
    return rows
  },

  async findByIdForCompany(id, companyId) {
    const { rows } = await query('SELECT * FROM collaborations WHERE id = $1 AND company_id = $2', [id, companyId])
    return rows[0]
  },

  async create(data) {
    const { rows } = await query(
      `INSERT INTO collaborations (company_id, title, type, description, target_audience, location, mode, proposed_date, status, contact)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [data.companyId, data.title, data.type, data.description, data.targetAudience, data.location, data.mode, data.proposedDate, data.status, data.contact],
    )
    return rows[0]
  },

  async updateStatus(id, status) {
    const { rows } = await query(
      'UPDATE collaborations SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id, status],
    )
    return rows[0]
  },
}
