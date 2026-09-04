import pg from 'pg'
import { config } from '../config.js'

const { Pool } = pg

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
})

export async function query(text, params) {
  const result = await pool.query(text, params)
  return result
}

export async function getClient() {
  return await pool.connect()
}
