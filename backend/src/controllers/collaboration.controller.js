import { asyncHandler, success } from '../utils/api.js'
import { Errors } from '../utils/errors.js'
import { collaborationRepo } from '../repositories/collaboration.repository.js'
import { audit } from '../services/audit.service.js'

export const listCollaborations = asyncHandler(async (req, res) => {
  const { status } = req.query
  const items = await collaborationRepo.listByCompany(req.user.companyId, { status })
  success(res, { items }, 'Collaborations loaded')
})

export const listAcademiaCollaborations = asyncHandler(async (req, res) => {
  const items = await collaborationRepo.listForAcademia()
  success(res, { items }, 'Collaborations loaded for academia')
})

export const getCollaboration = asyncHandler(async (req, res) => {
  const item = await collaborationRepo.findByIdForCompany(req.params.id, req.user.companyId)
  if (!item) throw Errors.notFound('Collaboration not found')
  success(res, item, 'Collaboration loaded')
})

export const createCollaboration = asyncHandler(async (req, res) => {
  const body = req.body || {}
  if (!body.title) throw Errors.badRequest('Title is required')
  if (!body.type) throw Errors.badRequest('Collaboration type is required')
  const item = await collaborationRepo.create({
    companyId: req.user.companyId, title: body.title, type: body.type, description: body.description,
    targetAudience: body.targetAudience, location: body.location, mode: body.mode,
    proposedDate: body.proposedDate, status: body.status || 'PROPOSED', contact: body.contact,
  })
  await audit(req.user.id, req.user.companyId, 'COLLABORATION_CREATE', 'collaboration', item.id)
  success(res, item, 'Collaboration created', 201)
})

export const updateCollaborationStatus = asyncHandler(async (req, res) => {
  const existing = await collaborationRepo.findByIdForCompany(req.params.id, req.user.companyId)
  if (!existing) throw Errors.notFound('Collaboration not found')
  const { status } = req.body || {}
  const valid = ['DRAFT', 'PROPOSED', 'ACTIVE', 'COMPLETED', 'CANCELLED']
  if (!valid.includes(status)) throw Errors.badRequest('Invalid collaboration status')
  const updated = await collaborationRepo.updateStatus(req.params.id, status)
  await audit(req.user.id, req.user.companyId, 'COLLABORATION_UPDATE', 'collaboration', req.params.id)
  success(res, updated, 'Collaboration updated')
})
