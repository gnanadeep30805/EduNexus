import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth.middleware.js'
import * as assessmentController from '../controllers/assessment.controller.js'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Student routes
router.get('/',         requireRole('STUDENT'), assessmentController.listAssessments)
router.get('/:id',      requireRole('STUDENT'), assessmentController.getAssessment)
router.post('/:id/submit', requireRole('STUDENT'), assessmentController.submitAssessment)

// Admin/Academia routes for creating assessments
router.post('/',        requireRole('ADMIN', 'ACADEMIA'), assessmentController.createAssessment)
router.post('/:id/questions', requireRole('ADMIN', 'ACADEMIA'), assessmentController.addQuestion)

export default router
