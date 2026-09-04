import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { Errors } from '../utils/errors.js'
import { addEvidence, addSkill, getDashboard, getProfile, getSkillGaps, listSkills, removeSkill, updateProfile } from '../controllers/student.controller.js'

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

export default router