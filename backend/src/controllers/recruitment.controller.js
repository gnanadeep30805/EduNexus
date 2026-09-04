import { asyncHandler, success } from '../utils/api.js'
import { Errors } from '../utils/errors.js'
import { applicationRepo, VALID_STATUSES } from '../repositories/application.repository.js'
import { audit } from '../services/audit.service.js'

const PIPELINE_STAGES = ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'ASSESSMENT', 'INTERVIEW', 'SELECTED', 'REJECTED']

export const getPipeline = asyncHandler(async (req, res) => {
  const { rows } = await (await import('../db/pool.js')).query(
    `SELECT a.id, a.status, a.match_score, a.match_strength, a.applied_at,
            s.first_name, s.last_name, s.institution_name, s.location, s.verification_status,
            o.title AS opportunity_title, o.type AS opportunity_type
     FROM applications a
     JOIN students s ON s.id = a.student_id
     JOIN opportunities o ON o.id = a.opportunity_id
     WHERE a.company_id = $1 AND a.status != 'WITHDRAWN'
     ORDER BY a.applied_at DESC`,
    [req.user.companyId],
  )
  const stages = PIPELINE_STAGES.map((stage) => ({
    status: stage,
    label: stage.replace('_', ' '),
    candidates: rows.filter((r) => r.status === stage),
  }))
  success(res, { stages, total: rows.length }, 'Pipeline loaded')
})

export const moveCandidate = asyncHandler(async (req, res) => {
  const { toStatus } = req.body || {}
  if (!toStatus) throw Errors.badRequest('toStatus is required')
  if (!VALID_STATUSES.includes(toStatus)) throw Errors.badRequest('Invalid target status')

  const app = await applicationRepo.findByIdForCompany(req.params.id, req.user.companyId)
  if (!app) throw Errors.notFound('Application not found')

  const updated = await applicationRepo.updateStatus(app.id, toStatus, req.user.id, req.body.note)
  await audit(req.user.id, req.user.companyId, `CANDIDATE_${toStatus.replace(' ', '_')}`, 'application', app.id, { from: app.status })
  success(res, { application: updated, fromStatus: app.status, toStatus }, 'Candidate moved')
})
