import { query } from '../db/pool.js'

export async function createNotification(userId, type, title, body, relatedType, relatedId) {
  try {
    await query(
      `INSERT INTO notifications (user_id, type, title, body, related_type, related_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, type, title, body, relatedType, relatedId],
    )
  } catch (error) {
    console.error('Notification write failed:', error.message)
  }
}

export async function notifyRecruitersForCompany(companyId, type, title, body, relatedType, relatedId) {
  const { rows } = await query(
    `SELECT cu.user_id FROM company_users cu
     WHERE cu.company_id = $1 AND cu.is_active = TRUE`,
    [companyId],
  )
  for (const row of rows) {
    await createNotification(row.user_id, type, title, body, relatedType, relatedId)
  }
}
