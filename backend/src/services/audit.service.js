import { query } from '../db/pool.js'

export async function audit(actorId, companyId, action, resource, resourceId, metadata = {}) {
  try {
    await query(
      `INSERT INTO audit_logs (actor_id, company_id, action, resource, resource_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [actorId, companyId, action, resource, resourceId, JSON.stringify(metadata)],
    )
  } catch (error) {
    console.error('Audit log write failed:', error.message)
  }
}
