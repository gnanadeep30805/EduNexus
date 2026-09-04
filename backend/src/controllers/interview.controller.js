import { asyncHandler, success } from '../utils/api.js'
import { Errors } from '../utils/errors.js'
import { interviewRepo } from '../repositories/interview.repository.js'
import { applicationRepo } from '../repositories/application.repository.js'
import { audit } from '../services/audit.service.js'

export const listInterviews = asyncHandler(async (req, res) => {
  const { status } = req.query
  const items = await interviewRepo.listByCompany(req.user.companyId, { status })
  success(res, { items }, 'Interviews loaded')
})

export const getInterview = asyncHandler(async (req, res) => {
  const interview = await interviewRepo.findByIdForCompany(req.params.id, req.user.companyId)
  if (!interview) throw Errors.notFound('Interview not found')
  success(res, interview, 'Interview loaded')
})

export const createInterview = asyncHandler(async (req, res) => {
  const body = req.body || {}
  const app = await applicationRepo.findByIdForCompany(body.applicationId, req.user.companyId)
  if (!app) throw Errors.badRequest('Application not found for this company')

  if (!body.scheduledAt) throw Errors.badRequest('Scheduled time is required')
  if (!body.roundNumber) throw Errors.badRequest('Round number is required')

  const interview = await interviewRepo.create({
    companyId: req.user.companyId, applicationId: app.id,
    opportunityId: app.opportunity_id, studentId: app.student_id,
    interviewerId: body.interviewerId || req.user.id,
    roundNumber: body.roundNumber, roundName: body.roundName, scheduledAt: body.scheduledAt,
    durationMinutes: body.durationMinutes || 45, mode: body.mode || 'ONLINE',
    meetingLink: body.meetingLink, notes: body.notes, status: body.status || 'SCHEDULED',
  })

  if (app.status !== 'INTERVIEW') {
    await applicationRepo.updateStatus(app.id, 'INTERVIEW', req.user.id, 'Moved to interview stage')
  }
  await audit(req.user.id, req.user.companyId, 'INTERVIEW_SCHEDULE', 'interview', interview.id)
  success(res, interview, 'Interview scheduled', 201)
})

export const updateInterview = asyncHandler(async (req, res) => {
  const existing = await interviewRepo.findByIdForCompany(req.params.id, req.user.companyId)
  if (!existing) throw Errors.notFound('Interview not found')
  const updated = await interviewRepo.update(req.params.id, req.body || {})
  await audit(req.user.id, req.user.companyId, 'INTERVIEW_UPDATE', 'interview', req.params.id)
  success(res, updated, 'Interview updated')
})

export const updateInterviewStatus = asyncHandler(async (req, res) => {
  const existing = await interviewRepo.findByIdForCompany(req.params.id, req.user.companyId)
  if (!existing) throw Errors.notFound('Interview not found')
  const { status } = req.body || {}
  if (!status) throw Errors.badRequest('Status is required')
  const valid = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW']
  if (!valid.includes(status)) throw Errors.badRequest('Invalid interview status')
  const updated = await interviewRepo.update(req.params.id, { status })
  await audit(req.user.id, req.user.companyId, `INTERVIEW_${status}`, 'interview', req.params.id)
  success(res, updated, 'Interview status updated')
})
