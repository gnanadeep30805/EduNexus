import { asyncHandler, success } from '../utils/api.js'
import { Errors } from '../utils/errors.js'
import { opportunityRepo } from '../repositories/opportunity.repository.js'
import { skillService } from '../services/skill.service.js'
import { audit } from '../services/audit.service.js'
import { query } from '../db/pool.js'
import { notifyRecruitersForCompany } from '../services/notification.service.js'

export const listOpportunities = asyncHandler(async (req, res) => {
  const { status, type, search } = req.query
  const items = await opportunityRepo.listByCompany(req.user.companyId, { status, type, search })
  success(res, { items }, 'Opportunities loaded')
})

export const getOpportunity = asyncHandler(async (req, res) => {
  const opp = await opportunityRepo.findById(req.params.id)
  if (!opp) throw Errors.notFound('Opportunity not found')
  if (String(opp.company_id) !== String(req.user.companyId)) throw Errors.forbidden('Cannot access another organization\'s opportunity')

  const skills = (await query(
    `SELECT os.id, os.required_level, os.priority, os.years_experience, s.name, s.id AS skill_id, s.category
     FROM opportunity_skills os JOIN skills s ON s.id = os.skill_id
     WHERE os.opportunity_id = $1 ORDER BY os.priority, s.name`,
    [opp.id],
  )).rows

  const apps = await query(
    `SELECT COUNT(*)::int AS n FROM applications WHERE opportunity_id = $1`,
    [opp.id],
  )

  success(res, { ...opp, skills, applicationCount: apps.rows[0].n }, 'Opportunity loaded')
})

export const createOpportunity = asyncHandler(async (req, res) => {
  const body = req.body || {}
  if (!body.title) throw Errors.badRequest('Title is required')
  if (!body.type) throw Errors.badRequest('Opportunity type is required')

  const status = body.status || 'DRAFT'
  const opp = await opportunityRepo.create({
    companyId: req.user.companyId,
    title: body.title, type: body.type, roleTitle: body.roleTitle,
    description: body.description, responsibilities: body.responsibilities,
    eligibility: body.eligibility, location: body.location, workMode: body.workMode,
    duration: body.duration, stipend: body.stipend, salary: body.salary,
    selectionProcess: body.selectionProcess, contact: body.contact,
    openings: body.openings || 1, applicationDeadline: body.applicationDeadline,
    status, createdBy: req.user.id,
  })

  const skills = await skillService.resolveMany(body.skills || [])
  for (const sk of skills) {
    await query(
      `INSERT INTO opportunity_skills (opportunity_id, skill_id, required_level, priority, years_experience)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (opportunity_id, skill_id) DO UPDATE
       SET required_level = EXCLUDED.required_level, priority = EXCLUDED.priority, years_experience = EXCLUDED.years_experience`,
      [opp.id, sk.skillId, sk.requiredLevel || 'INTERMEDIATE', sk.priority || 'PREFERRED', sk.yearsExperience || 0],
    )
    if (body.recordDemand) {
      await query(
        `INSERT INTO industry_skill_demands (company_id, opportunity_id, skill_id, required_level, priority)
         VALUES ($1,$2,$3,$4,$5)`,
        [req.user.companyId, opp.id, sk.skillId, sk.requiredLevel || 'INTERMEDIATE', sk.priority || 'PREFERRED'],
      )
    }
  }

  await audit(req.user.id, req.user.companyId, 'OPPORTUNITY_CREATE', 'opportunity', opp.id)
  success(res, opp, 'Opportunity created', 201)
})

export const updateOpportunity = asyncHandler(async (req, res) => {
  const existing = await opportunityRepo.findById(req.params.id)
  if (!existing) throw Errors.notFound('Opportunity not found')
  if (String(existing.company_id) !== String(req.user.companyId)) throw Errors.forbidden('Cannot modify another organization\'s opportunity')

  const body = req.body || {}
  const updated = await opportunityRepo.update(req.params.id, body)

  if (body.skills) {
    const skills = await skillService.resolveMany(body.skills)
    await query('DELETE FROM opportunity_skills WHERE opportunity_id = $1', [req.params.id])
    for (const sk of skills) {
      await query(
        `INSERT INTO opportunity_skills (opportunity_id, skill_id, required_level, priority, years_experience)
         VALUES ($1,$2,$3,$4,$5)`,
        [req.params.id, sk.skillId, sk.requiredLevel || 'INTERMEDIATE', sk.priority || 'PREFERRED', sk.yearsExperience || 0],
      )
    }
  }

  await audit(req.user.id, req.user.companyId, 'OPPORTUNITY_UPDATE', 'opportunity', req.params.id)
  success(res, updated, 'Opportunity updated')
})

async function transitionStatus(req, res, toStatus, action) {
  const opp = await opportunityRepo.findById(req.params.id)
  if (!opp) throw Errors.notFound('Opportunity not found')
  if (String(opp.company_id) !== String(req.user.companyId)) throw Errors.forbidden('Cannot modify another organization\'s opportunity')

  const opts = {}
  if (toStatus === 'PUBLISHED') opts.publishedAt = new Date()
  if (toStatus === 'PENDING_REVIEW') opts.submittedAt = new Date()

  const updated = await opportunityRepo.updateStatus(req.params.id, toStatus, opts)
  await audit(req.user.id, req.user.companyId, action, 'opportunity', req.params.id, { to: toStatus })
  if (toStatus === 'PUBLISHED') {
    await notifyRecruitersForCompany(req.user.companyId, 'OPPORTUNITY_PUBLISHED', 'Opportunity published', `${opp.title} is now live.`, 'opportunity', opp.id)
  }
  success(res, updated, `Opportunity ${toStatus.toLowerCase().replace('_', ' ')}`)
}

export const publishOpportunity = asyncHandler((req, res) => transitionStatus(req, res, 'PUBLISHED', 'OPPORTUNITY_PUBLISH'))
export const pauseOpportunity = asyncHandler((req, res) => transitionStatus(req, res, 'PAUSED', 'OPPORTUNITY_PAUSE'))
export const closeOpportunity = asyncHandler((req, res) => transitionStatus(req, res, 'CLOSED', 'OPPORTUNITY_CLOSE'))
export const submitOpportunity = asyncHandler((req, res) => transitionStatus(req, res, 'PENDING_REVIEW', 'OPPORTUNITY_SUBMIT'))
