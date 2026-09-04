import { asyncHandler, success } from '../utils/api.js'
import { Errors } from '../utils/errors.js'
import { query } from '../db/pool.js'
import { skillService } from '../services/skill.service.js'
import { audit } from '../services/audit.service.js'

export const getRecruiterProfile = asyncHandler(async (req, res) => {
  const { rows } = await query(
    'SELECT * FROM recruiters WHERE user_id = $1 AND company_id = $2',
    [req.user.id, req.user.companyId],
  )
  const membership = (await query(
    'SELECT * FROM company_users WHERE user_id = $1 AND company_id = $2',
    [req.user.id, req.user.companyId],
  )).rows[0]
  success(res, { recruiter: rows[0] || null, membership }, 'Profile loaded')
})

export const updateRecruiterProfile = asyncHandler(async (req, res) => {
  const body = req.body || {}
  const existing = (await query(
    'SELECT * FROM recruiters WHERE user_id = $1 AND company_id = $2',
    [req.user.id, req.user.companyId],
  )).rows[0]
  let result
  if (existing) {
    const { rows } = await query(
      `UPDATE recruiters SET designation = COALESCE($3, designation), department = COALESCE($4, department),
        phone = COALESCE($5, phone), areas_of_hiring = COALESCE($6, areas_of_hiring) WHERE id = $1 RETURNING *`,
      [existing.id, null, body.designation, body.department, body.phone, body.areasOfHiring],
    )
    result = rows[0]
  } else {
    const { rows } = await query(
      `INSERT INTO recruiters (user_id, company_id, designation, department, phone, areas_of_hiring)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, req.user.companyId, body.designation, body.department, body.phone, body.areasOfHiring || []],
    )
    result = rows[0]
  }
  if (body.areasOfHiring) {
    await query('UPDATE company_users SET areas_of_hiring = $1 WHERE user_id = $2 AND company_id = $3',
      [body.areasOfHiring, req.user.id, req.user.companyId])
  }
  await audit(req.user.id, req.user.companyId, 'PROFILE_UPDATE', 'recruiter', null)
  success(res, result, 'Profile updated')
})

// --- Industry skill demand (role requirements) ---
export const listRoleRequirements = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT rr.*, (
       SELECT COALESCE(json_agg(json_build_object('skill', s.name, 'skillId', s.id, 'requiredLevel', isd.required_level, 'priority', isd.priority) ORDER BY isd.priority), '[]')
       FROM industry_skill_demands isd JOIN skills s ON s.id = isd.skill_id
       WHERE isd.opportunity_id IS NULL AND isd.company_id = rr.company_id AND isd.id IN (
         SELECT isd2.id FROM industry_skill_demands isd2 WHERE isd2.company_id = rr.company_id AND isd2.opportunity_id IS NULL
       )
     ) AS skills
     FROM role_requirements rr WHERE rr.company_id = $1 ORDER BY rr.created_at DESC`,
    [req.user.companyId],
  )
  success(res, { items: rows }, 'Role requirements loaded')
})

export const createRoleRequirement = asyncHandler(async (req, res) => {
  const body = req.body || {}
  if (!body.roleTitle) throw Errors.badRequest('Role title is required')
  const { rows } = await query(
    `INSERT INTO role_requirements (company_id, role_title, description, years_experience_min, years_experience_max, education, location)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.user.companyId, body.roleTitle, body.description, body.yearsExperienceMin, body.yearsExperienceMax, body.education, body.location],
  )
  const role = rows[0]
  const skills = await skillService.resolveMany(body.skills || [])
  for (const sk of skills) {
    await query(
      `INSERT INTO industry_skill_demands (company_id, skill_id, required_level, priority)
       VALUES ($1,$2,$3,$4)`,
      [req.user.companyId, sk.skillId, sk.requiredLevel || 'INTERMEDIATE', sk.priority || 'PREFERRED'],
    )
  }
  await audit(req.user.id, req.user.companyId, 'SKILL_DEMAND_CREATE', 'role_requirement', role.id)
  success(res, { ...role, skills }, 'Role requirement created', 201)
})

// --- Industry feedback on students ---
export const createFeedback = asyncHandler(async (req, res) => {
  const body = req.body || {}
  if (!body.studentId) throw Errors.badRequest('Student is required')
  if (!body.skillId) throw Errors.badRequest('Skill is required')
  const { rows } = await query(
    `INSERT INTO industry_feedback (company_id, mentor_id, student_id, skill_id, opportunity_id, observed_level, performance, strengths, improvement_areas, comments)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [req.user.companyId, req.user.id, body.studentId, body.skillId, body.opportunityId,
      body.observedLevel, body.performance, body.strengths, body.improvementAreas, body.comments],
  )
  await audit(req.user.id, req.user.companyId, 'FEEDBACK_CREATE', 'industry_feedback', rows[0].id)
  success(res, rows[0], 'Feedback submitted', 201)
})

export const listFeedback = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT fb.*, s.first_name, s.last_name, sk.name AS skill_name, u.full_name AS mentor_name
     FROM industry_feedback fb
     JOIN students s ON s.id = fb.student_id
     LEFT JOIN skills sk ON sk.id = fb.skill_id
     LEFT JOIN users u ON u.id = fb.mentor_id
     WHERE fb.company_id = $1 ORDER BY fb.created_at DESC`,
    [req.user.companyId],
  )
  success(res, { items: rows }, 'Feedback loaded')
})