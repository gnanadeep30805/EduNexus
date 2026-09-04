import 'dotenv/config'

export const config = {
  port: Number(process.env.PORT || 4000),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://edunexus:edunexus_dev@localhost:5432/edunexus',
  jwtSecret: process.env.JWT_SECRET || 'edunexus_local_dev_secret_change_me',
  jwtExpires: process.env.JWT_EXPIRES || '7d',
}
