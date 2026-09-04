import { Router } from 'express'
import { requireAcademia, requireAuth } from '../middleware/auth.js'
import {
  getDashboard, getInstitution, getSkills, listCollaborations, listDepartments,
  listInternships, listPlacements, listStudents,
} from '../controllers/academia.controller.js'

const router = Router()
router.use(requireAuth, requireAcademia)
router.get('/dashboard', getDashboard)
router.get('/institution', getInstitution)
router.get('/skills', getSkills)
router.get('/students', listStudents)
router.get('/departments', listDepartments)
router.get('/internships', listInternships)
router.get('/placements', listPlacements)
router.get('/collaboration', listCollaborations)
router.get('/collaborations', listCollaborations)

export default router
