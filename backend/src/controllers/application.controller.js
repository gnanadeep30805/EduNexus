import { asyncHandler, success } from '../utils/api.js'
import { Errors } from '../utils/errors.js'
import { applicationRepo, VALID_STATUSES } from '../repositories/application.repository.js'
import { candidateRepo } from '../repositories/candidate.repository.js'
import { audit } from '../services/audit.service.js'

export const listApplications = asyncHandler(async (req, res) => {
  const { status, opportunityId, search, page = 1, pageSize = 10 } = req.query
  const data = await applicationRepo.listByCompany(req.user.companyId, {
    status, opportunityId, search, page: Number(page), pageSize: Number(pageSize),
  })
  success(res, data, 'Applications loaded')
})

export const getApplication = asyncHandler(async (req, res) => {
  const app = await applicationRepo.findByIdForCompany(req.params.id, req.user.companyId)
  if (!app) throw Errors.notFound('Application not found')
  const skills = await candidateRepo.getSkills(app.student_id)
  const skillIds = skills.map((s) => s.id)
  const evidence = await candidateRepo.getEvidence(skillIds)
  const skillsWithEvidence = skills.map((s) => ({
    id: s.id, name: s.name, selfLevel: s.self_level, verifiedLevel: s.verified_level, evidence: evidence[s.id] || [],
  }))
  const history = await applicationRepo.getHistory(app.id)
  success(res, { ...app, skills: skillsWithEvidence, history }, 'Application loaded')
})

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const app = await applicationRepo.findByIdForCompany(req.params.id, req.user.companyId)
  if (!app) throw Errors.notFound('Application not found')

  const { status, note } = req.body || {}
  if (!status) throw Errors.badRequest('Status is required')
  if (!VALID_STATUSES.includes(status)) throw Errors.badRequest('Invalid application status')

  const updated = await applicationRepo.updateStatus(app.id, status, req.user.id, note)
  await audit(req.user.id, req.user.companyId, `APPLICATION_${status.replace(' ', '_')}`, 'application', app.id)
  success(res, updated, 'Application updated')
})
