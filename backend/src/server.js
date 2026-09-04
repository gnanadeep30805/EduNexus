import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import industryRoutes from './routes/industry.routes.js'
import authRoutes from './routes/auth.routes.js'
import academiaRoutes from './routes/academia.routes.js'
import studentRoutes from './routes/student.routes.js'
import { config } from './config.js'
import { AppError } from './utils/errors.js'

const app = express()
const port = config.port

app.use(helmet())
app.use(cors({ origin: config.frontendUrl, credentials: true }))
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_request, response) => {
  response.json({ success: true, data: { service: 'edunexus-backend', status: 'ok' }, message: 'Service is healthy' })
})

app.use('/api/auth', authRoutes)
app.use('/api/industry', industryRoutes)
app.use('/api/academia', academiaRoutes)
app.use('/api/students', studentRoutes)

app.use((_request, response) => {
  response.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Resource not found', details: [] } })
})

app.use((error, _request, response, _next) => {
  if (error instanceof AppError) {
    return response.status(error.status).json({
      success: false,
      error: { code: error.code, message: error.message, details: error.details },
    })
  }
  console.error('[error]', error)
  response.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong', details: [] },
  })
})

app.listen(port, () => console.log(`EduNexus backend listening on port ${port}`))