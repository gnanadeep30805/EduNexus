import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { pool } from './pool.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(__dirname, '..', '..', 'migrations')

async function runMigrations() {
  const client = await pool.connect()
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`)

    const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()
    const { rows } = await client.query('SELECT filename FROM schema_migrations')
    const applied = new Set(rows.map((r) => r.filename))

    for (const file of files) {
      if (applied.has(file)) continue
      const sql = readFileSync(join(migrationsDir, file), 'utf8')
      console.log(`Applying migration: ${file}`)
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file])
        await client.query('COMMIT')
        console.log(`Applied: ${file}`)
      } catch (error) {
        await client.query('ROLLBACK')
        throw new Error(`Migration ${file} failed: ${error.message}`)
      }
    }
    console.log('All migrations up to date.')
  } finally {
    client.release()
  }
}

runMigrations().then(() => pool.end()).catch((error) => {
  console.error('Migration error:', error.message)
  process.exit(1)
})
