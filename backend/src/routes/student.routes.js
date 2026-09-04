import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { Errors } from '../utils/errors.js'
import { addEvidence, addSkill, getDashboard, getProfile, getSkillGaps, listSkills, removeSkill, updateProfile } from '../controllers/student.controller.js'
import {
	createStudentApplication, getStudentApplication, getStudentOpportunity, getStudentPortfolio,
	listStudentApplications, listStudentInternships, listStudentOpportunities, saveStudentCertification,
	saveStudentProject, withdrawStudentApplication,
} from '../controllers/studentCareer.controller.js'
import { listNotifications, markAllRead, markRead } from '../controllers/notification.controller.js'

const router = Router()
router.use(requireAuth)
router.use((req, _res, next) => req.user.role === 'STUDENT' ? next() : next(Errors.forbidden('Student role required')))
router.get('/me/dashboard', getDashboard)
router.get('/me/profile', getProfile)
router.patch('/me/profile', updateProfile)
router.get('/me/skills', listSkills)
router.post('/me/skills', addSkill)
router.delete('/me/skills/:id', removeSkill)
router.post('/me/skills/:id/evidence', addEvidence)
router.get('/me/skill-gaps', getSkillGaps)
router.get('/me/opportunities', listStudentOpportunities)
router.get('/me/opportunities/:id', getStudentOpportunity)
router.get('/me/applications', listStudentApplications)
router.post('/me/applications', createStudentApplication)
router.get('/me/applications/:id', getStudentApplication)
router.post('/me/applications/:id/withdraw', withdrawStudentApplication)
router.get('/me/internships', listStudentInternships)
router.get('/me/portfolio', getStudentPortfolio)
router.post('/me/portfolio/projects', saveStudentProject)
router.post('/me/portfolio/certifications', saveStudentCertification)
router.get('/me/notifications', listNotifications)
router.patch('/me/notifications/read-all', markAllRead)
router.patch('/me/notifications/:id/read', markRead)

export default router