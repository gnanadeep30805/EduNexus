import { asyncHandler, success } from '../utils/api.js'
import { query } from '../db/pool.js'
import { Errors } from '../utils/errors.js'
import { computeMatch } from '../services/matching.service.js'

async function getStudent(userId) {
  const result = await query('SELECT * FROM students WHERE user_id = $1 LIMIT 1', [userId])
  if (!result.rows[0]) throw Errors.notFound('Student profile not found')
  return result.rows[0]
}

function toOpportunity(row) {
  return { ...row, company: { id: row.company_id, name: row.company_name, logo: row.company_logo, industry: row.industry } }
}

export const listStudentOpportunities = asyncHandler(async (req, res) => {
  const { search, type, location, workMode, page = 1, pageSize = 12 } = req.query
  const params = []
  const conditions = ["o.status = 'PUBLISHED'", '(o.application_deadline IS NULL OR o.application_deadline >= CURRENT_DATE)']
  if (search) { params.push(`%${search}%`); conditions.push(`(o.title ILIKE $${params.length} OR o.role_title ILIKE $${params.length} OR o.description ILIKE $${params.length} OR c.name ILIKE $${params.length})`) }
  if (type) { params.push(type.toUpperCase()); conditions.push(`o.type = $${params.length}`) }
  if (location) { params.push(`%${location}%`); conditions.push(`o.location ILIKE $${params.length}`) }
  if (workMode) { params.push(workMode.toUpperCase()); conditions.push(`o.work_mode = $${params.length}`) }
  const where = conditions.join(' AND ')
  const count = await query(`SELECT COUNT(*)::int AS total FROM opportunities o JOIN companies c ON c.id = o.company_id WHERE ${where}`, params)
  const pageNumber = Math.max(1, Number(page))
  const size = Math.min(50, Math.max(1, Number(pageSize)))
  params.push(size, (pageNumber - 1) * size)
  const items = await query(`SELECT o.*, c.name AS company_name, c.logo AS company_logo, c.industry
    FROM opportunities o JOIN companies c ON c.id = o.company_id WHERE ${where}
    ORDER BY o.application_deadline NULLS LAST, o.published_at DESC NULLS LAST, o.created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}`, params)
  success(res, { items: items.rows.map(toOpportunity), total: count.rows[0].total, page: pageNumber, pageSize: size }, 'Opportunities loaded')
})

export const getStudentOpportunity = asyncHandler(async (req, res) => {
  const result = await query(`SELECT o.*, c.name AS company_name, c.logo AS company_logo, c.industry, c.description AS company_description,
      c.website AS company_website
    FROM opportunities o JOIN companies c ON c.id = o.company_id
    WHERE o.id = $1 AND o.status = 'PUBLISHED'`, [req.params.id])
  if (!result.rows[0]) throw Errors.notFound('Opportunity not found')
  const skills = await query(`SELECT s.id, s.name, s.category, os.required_level, os.priority
    FROM opportunity_skills os JOIN skills s ON s.id = os.skill_id WHERE os.opportunity_id = $1 ORDER BY os.priority, s.name`, [req.params.id])
  const student = await getStudent(req.user.id)
  const match = await computeMatch(req.params.id, student.id)
  success(res, { ...toOpportunity(result.rows[0]), skills: skills.rows, match: match?.explanation || null, matchingSkills: match?.matchingSkills || [], missingSkills: match?.missingSkills || [] }, 'Opportunity loaded')
})

export const listStudentApplications = asyncHandler(async (req, res) => {
  const student = await getStudent(req.user.id)
  const result = await query(`SELECT a.*, o.title AS opportunity_title, o.role_title, o.type AS opportunity_type,
      c.name AS company_name, c.logo AS company_logo
    FROM applications a JOIN opportunities o ON o.id = a.opportunity_id JOIN companies c ON c.id = a.company_id
    WHERE a.student_id = $1 ORDER BY a.updated_at DESC`, [student.id])
  const counts = await query(`SELECT status, COUNT(*)::int AS count FROM applications WHERE student_id = $1 GROUP BY status`, [student.id])
  success(res, { items: result.rows, counts: counts.rows }, 'Applications loaded')
})

export const getStudentApplication = asyncHandler(async (req, res) => {
  const student = await getStudent(req.user.id)
  const result = await query(`SELECT a.*, o.title AS opportunity_title, o.role_title, o.type AS opportunity_type,
      c.name AS company_name, c.logo AS company_logo FROM applications a
      JOIN opportunities o ON o.id = a.opportunity_id JOIN companies c ON c.id = a.company_id
      WHERE a.id = $1 AND a.student_id = $2`, [req.params.id, student.id])
  if (!result.rows[0]) throw Errors.notFound('Application not found')
  const [history, interviews] = await Promise.all([
    query('SELECT * FROM application_status_history WHERE application_id = $1 ORDER BY created_at ASC', [req.params.id]),
    query('SELECT id, round_number, round_name, scheduled_at, duration_minutes, mode, meeting_link, notes, status FROM interviews WHERE application_id = $1 ORDER BY scheduled_at ASC', [req.params.id]),
  ])
  success(res, { ...result.rows[0], history: history.rows, interviews: interviews.rows }, 'Application loaded')
})

export const createStudentApplication = asyncHandler(async (req, res) => {
  const student = await getStudent(req.user.id)
  const opportunity = await query("SELECT * FROM opportunities WHERE id = $1 AND status = 'PUBLISHED' AND (application_deadline IS NULL OR application_deadline >= CURRENT_DATE)", [req.body?.opportunityId])
  if (!opportunity.rows[0]) throw Errors.badRequest('This opportunity is no longer accepting applications')
  const existing = await query('SELECT id FROM applications WHERE opportunity_id = $1 AND student_id = $2', [opportunity.rows[0].id, student.id])
  if (existing.rows[0]) throw Errors.badRequest('You have already applied to this opportunity')
  const match = await computeMatch(opportunity.rows[0].id, student.id)
  const result = await query(`INSERT INTO applications (opportunity_id, student_id, company_id, match_score, match_strength, application_note)
    VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [opportunity.rows[0].id, student.id, opportunity.rows[0].company_id, match?.explanation.score || null, match?.explanation.strength || null, req.body?.note || null])
  await query('INSERT INTO application_status_history (application_id, to_status, changed_by) VALUES ($1, $2, $3)', [result.rows[0].id, 'APPLIED', req.user.id])
  success(res, result.rows[0], 'Application submitted', 201)
})

export const withdrawStudentApplication = asyncHandler(async (req, res) => {
  const student = await getStudent(req.user.id)
  const existing = await query("SELECT status FROM applications WHERE id = $1 AND student_id = $2 AND status NOT IN ('SELECTED', 'REJECTED', 'WITHDRAWN')", [req.params.id, student.id])
  if (!existing.rows[0]) throw Errors.badRequest('This application cannot be withdrawn')
  const result = await query("UPDATE applications SET status = 'WITHDRAWN', updated_at = NOW() WHERE id = $1 AND student_id = $2 RETURNING *", [req.params.id, student.id])
  await query('INSERT INTO application_status_history (application_id, from_status, to_status, changed_by) VALUES ($1, $2, $3, $4)', [req.params.id, existing.rows[0].status, 'WITHDRAWN', req.user.id])
  success(res, result.rows[0], 'Application withdrawn')
})

export const listStudentInternships = asyncHandler(async (req, res) => {
  const student = await getStudent(req.user.id)
  const result = await query(`SELECT im.*, c.name AS company_name, c.logo AS company_logo, o.title AS opportunity_title
    FROM internship_monitoring im LEFT JOIN companies c ON c.id = im.company_id LEFT JOIN opportunities o ON o.id = im.opportunity_id
    WHERE im.student_id = $1 ORDER BY im.start_date DESC`, [student.id])
  const items = await Promise.all(result.rows.map(async (internship) => {
    const milestones = await query('SELECT * FROM internship_milestones WHERE internship_id = $1 ORDER BY due_date NULLS LAST', [internship.id])
    return { ...internship, milestones: milestones.rows }
  }))
  success(res, { items }, 'Internships loaded')
})

export const getStudentPortfolio = asyncHandler(async (req, res) => {
  const student = await getStudent(req.user.id)
  const [projects, certifications, experience, education, skills] = await Promise.all([
    query('SELECT * FROM student_projects WHERE student_id = $1 ORDER BY start_date DESC NULLS LAST', [student.id]),
    query('SELECT * FROM student_certifications WHERE student_id = $1 ORDER BY issue_date DESC NULLS LAST', [student.id]),
    query('SELECT * FROM student_experience WHERE student_id = $1 ORDER BY start_date DESC NULLS LAST', [student.id]),
    query('SELECT * FROM student_education WHERE student_id = $1 ORDER BY end_year DESC NULLS LAST', [student.id]),
    query('SELECT ss.id, s.name, s.category, ss.verified_level, ss.self_level FROM student_skills ss JOIN skills s ON s.id = ss.skill_id WHERE ss.student_id = $1 ORDER BY s.name', [student.id]),
  ])
  success(res, { profile: student, projects: projects.rows, certifications: certifications.rows, experience: experience.rows, education: education.rows, skills: skills.rows }, 'Portfolio loaded')
})

export const saveStudentProject = asyncHandler(async (req, res) => {
  const student = await getStudent(req.user.id)
  const body = req.body || {}
  if (!body.title) throw Errors.badRequest('Project title is required')
  const result = await query(`INSERT INTO student_projects (student_id, title, description, skills, project_url, start_date, end_date)
    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [student.id, body.title, body.description || null, body.skills || [], body.projectUrl || null, body.startDate || null, body.endDate || null])
  success(res, result.rows[0], 'Project added', 201)
})

export const saveStudentCertification = asyncHandler(async (req, res) => {
  const student = await getStudent(req.user.id)
  const body = req.body || {}
  if (!body.name || !body.issuer) throw Errors.badRequest('Certification name and issuer are required')
  const result = await query(`INSERT INTO student_certifications (student_id, name, issuer, credential_url, issue_date)
    VALUES ($1, $2, $3, $4, $5) RETURNING *`, [student.id, body.name, body.issuer, body.credentialUrl || null, body.issueDate || null])
  success(res, result.rows[0], 'Certification added', 201)
})