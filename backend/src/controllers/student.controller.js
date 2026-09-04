import { asyncHandler, success } from '../utils/api.js'
import { query } from '../db/pool.js'
import { Errors } from '../utils/errors.js'
import { skillService, LEVELS } from '../services/skill.service.js'

async function getStudent(userId) {
  const result = await query('SELECT * FROM students WHERE user_id = $1 LIMIT 1', [userId])
  if (!result.rows[0]) throw Errors.notFound('Student profile not found')
  return result.rows[0]
}

async function getSkills(studentId) {
  const result = await query(`
    SELECT ss.id, ss.skill_id, s.name, s.category, ss.self_level, ss.verified_level,
      ss.years_experience, COUNT(e.id)::int AS evidence_count,
      COUNT(e.id) FILTER (WHERE e.is_verified)::int AS verified_evidence_count
    FROM student_skills ss
    JOIN skills s ON s.id = ss.skill_id
    LEFT JOIN student_skill_evidence e ON e.student_skill_id = ss.id
    WHERE ss.student_id = $1
    GROUP BY ss.id, s.name, s.category
    ORDER BY s.name`, [studentId])
  return result.rows
}

function levelValue(level) { return LEVELS.indexOf(level) + 1 }
function formatLevel(level) { return String(level || 'BASIC').toLowerCase().replace(/^./, (letter) => letter.toUpperCase()) }

export const getDashboard = asyncHandler(async (req, res) => {
  const student = await getStudent(req.user.id)
  const [skills, projects, certifications, demand] = await Promise.all([
    getSkills(student.id),
    query('SELECT COUNT(*)::int AS count FROM student_projects WHERE student_id = $1', [student.id]),
    query('SELECT COUNT(*)::int AS count FROM student_certifications WHERE student_id = $1', [student.id]),
    query(`SELECT s.name, os.required_level, os.priority, o.title
      FROM opportunity_skills os JOIN skills s ON s.id = os.skill_id
      JOIN opportunities o ON o.id = os.opportunity_id
      WHERE o.status = 'PUBLISHED' ORDER BY CASE os.priority WHEN 'MANDATORY' THEN 0 ELSE 1 END, s.name LIMIT 8`),
  ])
  const profileFields = [student.first_name, student.last_name, student.institution_name, student.course, student.graduation_year, student.location, student.bio, student.portfolio_url, student.career_interests?.length]
  const profileCompletion = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100)
  const assessed = skills.filter((skill) => skill.verified_level)
  const readiness = skills.length ? Math.round(skills.reduce((sum, skill) => sum + (levelValue(skill.verified_level || skill.self_level) / 4), 0) / skills.length * 100) : 0
  const owned = new Map(skills.map((skill) => [skill.name.toLowerCase(), skill]))
  const gaps = demand.rows.map((item) => {
    const current = owned.get(item.name.toLowerCase())
    const gap = Math.max(0, levelValue(item.required_level) - (current ? levelValue(current.verified_level || current.self_level) : 0))
    return { skill: item.name, requiredLevel: formatLevel(item.required_level), currentLevel: current ? formatLevel(current.verified_level || current.self_level) : 'Not started', gap, priority: item.priority, role: item.title }
  }).filter((item) => item.gap > 0).slice(0, 5)
  success(res, {
    profile: { ...student, firstName: student.first_name, lastName: student.last_name, profileCompletion },
    metrics: { profileCompletion, readiness, skills: skills.length, assessedSkills: assessed.length, evidence: skills.reduce((sum, skill) => sum + skill.evidence_count, 0), projects: projects.rows[0].count, certifications: certifications.rows[0].count },
    skills, gaps,
    nextActions: [
      ...(!student.bio ? ['Complete your profile'] : []),
      ...(gaps[0] ? [`Improve ${gaps[0].skill}`] : []),
      ...(skills.some((skill) => !skill.evidence_count) ? ['Add evidence to your skills'] : []),
    ],
  }, 'Student dashboard loaded')
})

export const getProfile = asyncHandler(async (req, res) => {
  const student = await getStudent(req.user.id)
  const [education, projects, certifications, experience] = await Promise.all([
    query('SELECT * FROM student_education WHERE student_id = $1 ORDER BY end_year DESC NULLS LAST', [student.id]),
    query('SELECT * FROM student_projects WHERE student_id = $1 ORDER BY end_date DESC NULLS LAST', [student.id]),
    query('SELECT * FROM student_certifications WHERE student_id = $1 ORDER BY issue_date DESC NULLS LAST', [student.id]),
    query('SELECT * FROM student_experience WHERE student_id = $1 ORDER BY end_date DESC NULLS LAST', [student.id]),
  ])
  success(res, { ...student, firstName: student.first_name, lastName: student.last_name, education: education.rows, projects: projects.rows, certifications: certifications.rows, experience: experience.rows }, 'Student profile loaded')
})

export const updateProfile = asyncHandler(async (req, res) => {
  const student = await getStudent(req.user.id)
  const allowed = ['first_name', 'last_name', 'institution_name', 'course', 'graduation_year', 'location', 'bio', 'portfolio_url', 'career_interests', 'internship_availability']
  const fields = allowed.filter((field) => Object.prototype.hasOwnProperty.call(req.body, field))
  if (!fields.length) throw Errors.badRequest('No profile fields supplied')
  const values = fields.map((field) => req.body[field])
  const assignments = fields.map((field, index) => `${field} = $${index + 1}`).join(', ')
  const result = await query(`UPDATE students SET ${assignments}, updated_at = NOW() WHERE id = $${values.length + 1} RETURNING *`, [...values, student.id])
  success(res, result.rows[0], 'Profile updated')
})

export const listSkills = asyncHandler(async (req, res) => {
  const student = await getStudent(req.user.id)
  const skills = await getSkills(student.id)
  const available = await skillService.listSkills(req.query.search)
  success(res, { skills, available }, 'Skills loaded')
})

export const addSkill = asyncHandler(async (req, res) => {
  const student = await getStudent(req.user.id)
  const skill = await skillService.resolveSkill(req.body.name)
  if (!skill) throw Errors.badRequest('Choose a skill from the shared taxonomy')
  const level = req.body.level || 'BASIC'
  if (!LEVELS.includes(level)) throw Errors.badRequest('Invalid skill level')
  const result = await query(`INSERT INTO student_skills (student_id, skill_id, self_level)
    VALUES ($1, $2, $3) ON CONFLICT (student_id, skill_id) DO UPDATE SET self_level = EXCLUDED.self_level RETURNING *`, [student.id, skill.id, level])
  success(res, { ...result.rows[0], name: skill.name, category: skill.category }, 'Skill saved', 201)
})

export const removeSkill = asyncHandler(async (req, res) => {
  const student = await getStudent(req.user.id)
  await query('DELETE FROM student_skills WHERE id = $1 AND student_id = $2', [req.params.id, student.id])
  success(res, null, 'Skill removed')
})

export const addEvidence = asyncHandler(async (req, res) => {
  const student = await getStudent(req.user.id)
  const skill = await query('SELECT id FROM student_skills WHERE id = $1 AND student_id = $2', [req.params.id, student.id])
  if (!skill.rows[0]) throw Errors.notFound('Student skill not found')
  const type = req.body.evidenceType || 'PROJECT'
  const result = await query(`INSERT INTO student_skill_evidence (student_skill_id, evidence_type, title, description, credential_url)
    VALUES ($1, $2, $3, $4, $5) RETURNING *`, [req.params.id, type, req.body.title, req.body.description || null, req.body.url || null])
  success(res, result.rows[0], 'Evidence added', 201)
})

export const getSkillGaps = asyncHandler(async (req, res) => {
  const student = await getStudent(req.user.id)
  const skills = await getSkills(student.id)
  const owned = new Map(skills.map((skill) => [skill.name.toLowerCase(), skill]))
  const result = await query(`SELECT DISTINCT s.name, os.required_level, os.priority, o.title
    FROM opportunity_skills os JOIN skills s ON s.id = os.skill_id JOIN opportunities o ON o.id = os.opportunity_id
    WHERE o.status = 'PUBLISHED' ORDER BY s.name`, [])
  const gaps = result.rows.map((item) => {
    const current = owned.get(item.name.toLowerCase())
    const currentValue = current ? levelValue(current.verified_level || current.self_level) : 0
    const requiredValue = levelValue(item.required_level)
    return { skill: item.name, requiredLevel: formatLevel(item.required_level), currentLevel: current ? formatLevel(current.verified_level || current.self_level) : 'Not started', gap: Math.max(0, requiredValue - currentValue), priority: item.priority, role: item.title, recommendation: current ? `Build a ${item.name} project and complete an assessment.` : `Start a fundamentals course for ${item.name}.` }
  }).filter((item) => item.gap > 0)
  success(res, { gaps }, 'Skill gaps calculated')
})