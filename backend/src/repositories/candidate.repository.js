import { query } from '../db/pool.js'

export const candidateRepo = {
  async list({ search, skillIds = [], level, location, interests, available, verified, page = 1, pageSize = 10, sort }) {
    const conditions = ['s.consent_public_visibility = TRUE']
    const params = []
    if (search) { params.push(`%${search}%`); conditions.push(`(s.first_name ILIKE $${params.length} OR s.last_name ILIKE $${params.length} OR s.bio ILIKE $${params.length})`) }
    if (location) { params.push(`%${location}%`); conditions.push(`s.location ILIKE $${params.length}`) }
    if (available !== undefined) { params.push(available === true || available === 'true'); conditions.push(`s.internship_availability = $${params.length}`) }
    if (verified) { params.push('VERIFIED'); conditions.push(`s.verification_status = $${params.length}`) }
    if (interests && interests.length) {
      params.push(interests)
      conditions.push('s.career_interests && $' + params.length)
    }

    let skillFilter = ''
    if (skillIds && skillIds.length) {
      params.push(skillIds)
      skillFilter = `EXISTS (SELECT 1 FROM student_skills ss WHERE ss.student_id = s.id AND ss.skill_id = ANY($${params.length})) AND `
    }

    const whereSql = `WHERE ${skillFilter}${conditions.join(' AND ')}`

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM students s ${whereSql}`,
      params,
    )
    const total = countResult.rows[0].total

    const offset = (page - 1) * pageSize
    params.push(pageSize, offset)
    let orderBy = 's.id DESC'
    if (sort === 'name') orderBy = 's.first_name ASC, s.last_name ASC'
    if (sort === 'newest') orderBy = 's.id DESC'

    const { rows } = await query(
      `SELECT s.id, s.user_id, s.first_name, s.last_name, s.institution_name, s.course,
         s.graduation_year, s.location, s.bio, s.verification_status, s.internship_availability
       FROM students s ${whereSql}
       ORDER BY ${orderBy} LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    )

    return { total, items: rows }
  },

  async findById(id) {
    const { rows } = await query('SELECT * FROM students WHERE id = $1', [id])
    return rows[0]
  },

  async getSkills(studentId) {
    const { rows } = await query(
      `SELECT ss.id, ss.self_level, ss.verified_level, ss.years_experience, s.name, s.category,
              s.id AS skill_id
       FROM student_skills ss JOIN skills s ON s.id = ss.skill_id
       WHERE ss.student_id = $1 ORDER BY s.name`,
      [studentId],
    )
    return rows
  },

  async getEvidence(studentSkillIds) {
    if (!studentSkillIds.length) return {}
    const { rows } = await query(
      `SELECT student_skill_id, evidence_type, title, description, is_verified, verified_by
       FROM student_skill_evidence WHERE student_skill_id = ANY($1)`,
      [studentSkillIds],
    )
    const map = {}
    for (const row of rows) {
      if (!map[row.student_skill_id]) map[row.student_skill_id] = []
      map[row.student_skill_id].push(row)
    }
    return map
  },

  async getProjects(studentId) {
    const { rows } = await query('SELECT * FROM student_projects WHERE student_id = $1 ORDER BY start_date DESC', [studentId])
    return rows
  },

  async getCertifications(studentId) {
    const { rows } = await query('SELECT * FROM student_certifications WHERE student_id = $1 ORDER BY issue_date DESC', [studentId])
    return rows
  },

  async getEducation(studentId) {
    const { rows } = await query('SELECT * FROM student_education WHERE student_id = $1', [studentId])
    return rows
  },

  async getExperience(studentId) {
    const { rows } = await query('SELECT * FROM student_experience WHERE student_id = $1 ORDER BY start_date DESC', [studentId])
    return rows
  },
}
