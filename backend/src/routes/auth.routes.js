import { Router } from 'express'
import { login, me, register } from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/login', login)
router.post('/register', register)
router.get('/me', requireAuth, me)

export default router