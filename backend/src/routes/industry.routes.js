import { Router } from 'express'
import { requireAuth, requireCompany, requireRole, requireVerified } from '../middleware/auth.js'
import { getDashboard, getAnalytics } from '../controllers/analytics.controller.js'
import {
  getCompany, updateCompany,
} from '../controllers/company.controller.js'
import {
  listOpportunities, getOpportunity, createOpportunity, updateOpportunity,
  publishOpportunity, pauseOpportunity, closeOpportunity, submitOpportunity,
} from '../controllers/opportunity.controller.js'
import { searchCandidates, getCandidate } from '../controllers/candidate.controller.js'
import {
  listMatches, getMatch, generateForOpportunity, listMatchCandidates, shortlistFromMatch,
} from '../controllers/match.controller.js'
import { listApplications, getApplication, updateApplicationStatus } from '../controllers/application.controller.js'
import { getPipeline, moveCandidate } from '../controllers/recruitment.controller.js'
import {
  listInterviews, getInterview, createInterview, updateInterview, updateInterviewStatus,
} from '../controllers/interview.controller.js'
import { listOffers, getOffer, createOffer, recordHiring } from '../controllers/offer.controller.js'
import {
  listCollaborations, getCollaboration, createCollaboration, updateCollaborationStatus, listAcademiaCollaborations,
} from '../controllers/collaboration.controller.js'
import { listNotifications, markRead, markAllRead } from '../controllers/notification.controller.js'
import { listSkills, createSkill } from '../controllers/skill.controller.js'
import {
  getRecruiterProfile, updateRecruiterProfile, listRoleRequirements, createRoleRequirement,
  createFeedback, listFeedback,
} from '../controllers/settings.controller.js'

const router = Router()

router.use(requireAuth, requireCompany)

// Dashboard & analytics
router.get('/dashboard', getDashboard)
router.get('/analytics', getAnalytics)

// Company
router.get('/company', getCompany)
router.put('/company', updateCompany)

// Skills (shared taxonomy)
router.get('/skills', listSkills)
router.post('/skills', requireVerified, requireRole('COMPANY_ADMIN', 'RECRUITER', 'HIRING_MANAGER'), createSkill)

// Opportunities
router.get('/opportunities', listOpportunities)
router.post('/opportunities', requireVerified, requireRole('COMPANY_ADMIN', 'RECRUITER', 'HIRING_MANAGER'), createOpportunity)
router.get('/opportunities/:id', getOpportunity)
router.put('/opportunities/:id', requireVerified, requireRole('COMPANY_ADMIN', 'RECRUITER', 'HIRING_MANAGER'), updateOpportunity)
router.post('/opportunities/:id/publish', requireVerified, requireRole('COMPANY_ADMIN', 'RECRUITER'), publishOpportunity)
router.post('/opportunities/:id/pause', requireVerified, requireRole('COMPANY_ADMIN', 'RECRUITER'), pauseOpportunity)
router.post('/opportunities/:id/close', requireVerified, requireRole('COMPANY_ADMIN', 'RECRUITER'), closeOpportunity)
router.post('/opportunities/:id/submit', requireVerified, requireRole('COMPANY_ADMIN', 'RECRUITER'), submitOpportunity)

// Matches
router.get('/matches', listMatches)
router.post('/opportunities/:id/matches/generate', requireVerified, requireRole('COMPANY_ADMIN', 'RECRUITER', 'HIRING_MANAGER'), generateForOpportunity)
router.get('/opportunities/:id/matches', listMatchCandidates)
router.get('/matches/:id', getMatch)
router.post('/matches/:id/shortlist', requireVerified, requireRole('COMPANY_ADMIN', 'RECRUITER', 'HIRING_MANAGER'), shortlistFromMatch)

// Candidates
router.get('/candidates', searchCandidates)
router.get('/candidates/:id', getCandidate)

// Applications
router.get('/applications', listApplications)
router.get('/applications/:id', getApplication)
router.patch('/applications/:id/status', updateApplicationStatus)

// Recruitment pipeline
router.get('/recruitment', getPipeline)
router.post('/recruitment/:id/move', requireVerified, requireRole('COMPANY_ADMIN', 'RECRUITER', 'HIRING_MANAGER'), moveCandidate)

// Interviews
router.get('/interviews', listInterviews)
router.post('/interviews', requireVerified, requireRole('COMPANY_ADMIN', 'RECRUITER', 'HIRING_MANAGER'), createInterview)
router.get('/interviews/:id', getInterview)
router.put('/interviews/:id', requireVerified, requireRole('COMPANY_ADMIN', 'RECRUITER', 'HIRING_MANAGER'), updateInterview)
router.patch('/interviews/:id/status', requireVerified, requireRole('COMPANY_ADMIN', 'RECRUITER', 'HIRING_MANAGER'), updateInterviewStatus)

// Offers & hiring
router.get('/offers', listOffers)
router.get('/offers/:id', getOffer)
router.post('/offers', requireVerified, requireRole('COMPANY_ADMIN', 'RECRUITER'), createOffer)
router.post('/offers/:id/hire', requireVerified, requireRole('COMPANY_ADMIN', 'RECRUITER'), recordHiring)

// Collaborations
router.get('/collaborations', listCollaborations)
router.post('/collaborations', requireVerified, requireRole('COMPANY_ADMIN', 'RECRUITER', 'HIRING_MANAGER', 'MENTOR'), createCollaboration)
router.get('/collaborations/:id', getCollaboration)
router.patch('/collaborations/:id/status', requireVerified, requireRole('COMPANY_ADMIN', 'RECRUITER', 'HIRING_MANAGER'), updateCollaborationStatus)
router.get('/collaborations/academia', listAcademiaCollaborations)

// Recruiter profile & settings
router.get('/settings/profile', getRecruiterProfile)
router.put('/settings/profile', updateRecruiterProfile)
router.get('/settings/skill-demand', listRoleRequirements)
router.post('/settings/skill-demand', createRoleRequirement)

// Feedback
router.get('/feedback', listFeedback)
router.post('/feedback', createFeedback)

// Notifications
router.get('/notifications', listNotifications)
router.patch('/notifications/read-all', markAllRead)
router.patch('/notifications/:id/read', markRead)

export default router