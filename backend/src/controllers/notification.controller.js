import { asyncHandler, success } from '../utils/api.js'
import { query } from '../db/pool.js'

export const listNotifications = asyncHandler(async (req, res) => {
  const { rows } = await query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30',
    [req.user.id],
  )
  const unread = (await query('SELECT COUNT(*)::int AS n FROM notifications WHERE user_id = $1 AND is_read = FALSE', [req.user.id])).rows[0].n
  success(res, { items: rows, unread }, 'Notifications loaded')
})

export const markRead = asyncHandler(async (req, res) => {
  await query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id])
  success(res, { id: req.params.id }, 'Notification marked read')
})

export const markAllRead = asyncHandler(async (req, res) => {
  await query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [req.user.id])
  success(res, {}, 'All notifications marked read')
})