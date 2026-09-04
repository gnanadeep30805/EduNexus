import { asyncHandler, success } from '../utils/api.js'
import { skillService } from '../services/skill.service.js'

export const listSkills = asyncHandler(async (req, res) => {
  const items = await skillService.listSkills(req.query.search)
  success(res, { items }, 'Skills loaded')
})

export const createSkill = asyncHandler(async (req, res) => {
  const { name, category } = req.body || {}
  const resolved = await skillService.resolveSkill(name)
  if (resolved) return success(res, resolved, 'Skill exists')
  const { query } = await import('../db/pool.js')
  const { rows } = await query('INSERT INTO skills (name, category) VALUES ($1, $2) RETURNING *', [name, category])
  success(res, rows[0], 'Skill created', 201)
})