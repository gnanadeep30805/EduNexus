import { asyncHandler, success } from '../utils/api.js'
import { Errors } from '../utils/errors.js'
import { offerRepo } from '../repositories/offer.repository.js'
import { applicationRepo } from '../repositories/application.repository.js'
import { query } from '../db/pool.js'
import { audit } from '../services/audit.service.js'

export const listOffers = asyncHandler(async (req, res) => {
  const items = await offerRepo.listByCompany(req.user.companyId)
  success(res, { items }, 'Offers loaded')
})

export const getOffer = asyncHandler(async (req, res) => {
  const offer = await offerRepo.findByIdForCompany(req.params.id, req.user.companyId)
  if (!offer) throw Errors.notFound('Offer not found')
  const outcome = (await query(
    'SELECT * FROM placement_outcomes WHERE offer_id = $1',
    [offer.id],
  )).rows[0] || null
  success(res, { ...offer, outcome }, 'Offer loaded')
})

export const createOffer = asyncHandler(async (req, res) => {
  const body = req.body || {}
  const app = await applicationRepo.findByIdForCompany(body.applicationId, req.user.companyId)
  if (!app) throw Errors.badRequest('Application not found for this company')

  const existing = (await query(
    'SELECT * FROM offers WHERE application_id = $1',
    [app.id],
  )).rows[0]
  if (existing) throw Errors.conflict('An offer already exists for this application')

  const offer = await offerRepo.create({
    companyId: req.user.companyId, applicationId: app.id,
    opportunityId: app.opportunity_id, studentId: app.student_id,
    roleTitle: body.roleTitle || app.role_title || app.opportunity_title,
    compensation: body.compensation, offerDate: body.offerDate, joiningDate: body.joiningDate,
    status: body.status || 'SENT', notes: body.notes,
  })
  await applicationRepo.updateStatus(app.id, 'SELECTED', req.user.id, 'Offer created')
  await audit(req.user.id, req.user.companyId, 'OFFER_CREATE', 'offer', offer.id)
  success(res, offer, 'Offer created', 201)
})

export const recordHiring = asyncHandler(async (req, res) => {
  const offer = await offerRepo.findByIdForCompany(req.params.id, req.user.companyId)
  if (!offer) throw Errors.notFound('Offer not found')
  const body = req.body || {}

  const outcome = (await query(
    `INSERT INTO placement_outcomes (offer_id, application_id, student_id, company_id, joined, joined_at, role_title, compensation)
     VALUES ($1,$2,$3,$4,TRUE,$5,$6,$7)
     ON CONFLICT ((offer_id)) DO UPDATE SET joined = TRUE, joined_at = EXCLUDED.joined_at, role_title = EXCLUDED.role_title, compensation = EXCLUDED.compensation
     RETURNING *`,
    [offer.id, offer.application_id, offer.student_id, offer.company_id,
      body.joinedAt || new Date().toISOString().slice(0, 10), body.roleTitle || offer.role_title, body.compensation || offer.compensation],
  )).rows[0]

  await offerRepo.updateStatus(offer.id, 'ACCEPTED')
  await applicationRepo.updateStatus(offer.application_id, 'SELECTED', req.user.id, 'Candidate hired')
  await audit(req.user.id, req.user.companyId, 'HIRING_OUTCOME', 'offer', offer.id)
  success(res, outcome, 'Placement outcome recorded')
})
