import { query } from '../db/pool.js'

export const interviewRepo = {
  async listByCompany(companyId, { status } = {}) {
    const conditions = ['i.company_id = $1']
    const params = [companyId]
    if (status) { params.push(status); conditions.push(`i.status = $${params.length}`) }
    const { rows } = await query(
      `SELECT i.*, s.first_name, s.last_name, s.institution_name,
              o.title AS opportunity_title
       FROM interviews i
       JOIN students s ON s.id = i.student_id
       JOIN opportunities o ON o.id = i.opportunity_id
       WHERE ${conditions.join(' AND ')} ORDER BY i.scheduled_at ASC`,
      params,
    )
    return rows
  },

  async findByIdForCompany(id, companyId) {
    const { rows } = await query(
      `SELECT i.*, s.first_name, s.last_name, s.institution_name,
              o.title AS opportunity_title, u.full_name AS interviewer_name
       FROM interviews i
       JOIN students s ON s.id = i.student_id
       JOIN opportunities o ON o.id = i.opportunity_id
       LEFT JOIN users u ON u.id = i.interviewer_id
       WHERE i.id = $1 AND i.company_id = $2`,
      [id, companyId],
    )
    return rows[0]
  },

  async create(data) {
    const { rows } = await query(
      `INSERT INTO interviews (company_id, application_id, opportunity_id, student_id, interviewer_id,
        round_number, round_name, scheduled_at, duration_minutes, mode, meeting_link, notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [data.companyId, data.applicationId, data.opportunityId, data.studentId, data.interviewerId,
        data.roundNumber, data.roundName, data.scheduledAt, data.durationMinutes, data.mode,
        data.meetingLink, data.notes, data.status],
    )
    return rows[0]
  },

  async update(id, data) {
    const sets = []
    const params = [id]
    const fields = {
      interviewer_id: 'interviewerId', round_number: 'roundNumber', round_name: 'roundName',
      scheduled_at: 'scheduledAt', duration_minutes: 'durationMinutes', mode: 'mode',
      meeting_link: 'meetingLink', notes: 'notes', status: 'status',
    }
    for (const [col, key] of Object.entries(fields)) {
      if (data[key] !== undefined) { params.push(data[key]); sets.push(`${col} = $${params.length}`) }
    }
    if (!sets.length) return null
    sets.push('updated_at = NOW()')
    const { rows } = await query(`UPDATE interviews SET ${sets.join(', ')} WHERE id = $1 RETURNING *`, params)
    return rows[0]
  },
}
