import { query } from '../db/pool.js'

const OPP_FIELDS = `
  o.id, o.company_id, o.title, o.type, o.role_title, o.description, o.responsibilities,
  o.eligibility, o.location, o.work_mode, o.duration, o.stipend, o.salary, o.selection_process,
  o.openings, o.application_deadline, o.status, o.contact, o.created_at, o.updated_at,
  o.published_at, c.name AS company_name, c.verification_status AS company_verification
`

export const opportunityRepo = {
  async listByCompany(companyId, { status, type, search } = {}) {
    const conditions = ['o.company_id = $1']
    const params = [companyId]
    if (status) { params.push(status); conditions.push(`o.status = $${params.length}`) }
    if (type) { params.push(type); conditions.push(`o.type = $${params.length}`) }
    if (search) { params.push(`%${search}%`); conditions.push(`(o.title ILIKE $${params.length} OR o.role_title ILIKE $${params.length})`) }
    const { rows } = await query(
      `SELECT ${OPP_FIELDS} FROM opportunities o JOIN companies c ON c.id = o.company_id
       WHERE ${conditions.join(' AND ')} ORDER BY o.created_at DESC`,
      params,
    )
    return rows
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT ${OPP_FIELDS} FROM opportunities o JOIN companies c ON c.id = o.company_id
       WHERE o.id = $1`,
      [id],
    )
    return rows[0]
  },

  async listPublishedForStudents() {
    const { rows } = await query(
      `SELECT ${OPP_FIELDS} FROM opportunities o JOIN companies c ON c.id = o.company_id
       WHERE o.status = 'PUBLISHED' ORDER BY o.published_at DESC`,
    )
    return rows
  },

  async create(data) {
    const { rows } = await query(
      `INSERT INTO opportunities (company_id, title, type, role_title, description, responsibilities,
        eligibility, location, work_mode, duration, stipend, salary, selection_process, contact,
        openings, application_deadline, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [data.companyId, data.title, data.type, data.roleTitle, data.description, data.responsibilities,
        data.eligibility, data.location, data.workMode, data.duration, data.stipend, data.salary,
        data.selectionProcess, data.contact, data.openings, data.applicationDeadline, data.status, data.createdBy],
    )
    return rows[0]
  },

  async update(id, data) {
    const sets = []
    const params = [id]
    const fields = {
      title: 'title', type: 'type', role_title: 'roleTitle', description: 'description',
      responsibilities: 'responsibilities', eligibility: 'eligibility', location: 'location',
      work_mode: 'workMode', duration: 'duration',       stipend: 'stipend', salary: 'salary',
      selection_process: 'selectionProcess', contact: 'contact',
    }
    for (const [col, key] of Object.entries(fields)) {
      if (data[key] !== undefined) {
        params.push(data[key])
        sets.push(`${col} = $${params.length}`)
      }
    }
    if (data.openings !== undefined) {
      params.push(data.openings)
      sets.push(`openings = $${params.length}`)
    }
    if (data.applicationDeadline !== undefined) {
      params.push(data.applicationDeadline)
      sets.push(`application_deadline = $${params.length}`)
    }
    sets.push('updated_at = NOW()')
    const { rows } = await query(
      `UPDATE opportunities SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
      params,
    )
    return rows[0]
  },

  async updateStatus(id, status, opts = {}) {
    const cols = ['status = $2', 'updated_at = NOW()']
    const params = [id, status]
    if (opts.publishedAt) { params.push(opts.publishedAt); cols.push(`published_at = $${params.length}`) }
    if (opts.submittedAt) { params.push(opts.submittedAt); cols.push(`submitted_at = $${params.length}`) }
    const { rows } = await query(`UPDATE opportunities SET ${cols.join(', ')} WHERE id = $1 RETURNING *`, params)
    return rows[0]
  },
}
