import { query } from '../db/pool.js'
import { Errors } from '../utils/errors.js'

export const LEVELS = ['BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']

export const skillService = {
  async resolveSkill(input) {
    const term = String(input || '').trim()
    if (!term) return null
    const exact = await query('SELECT * FROM skills WHERE lower(name) = lower($1)', [term])
    if (exact.rows[0]) return exact.rows[0]

    const alias = await query(
      `SELECT s.* FROM skill_aliases a JOIN skills s ON s.id = a.skill_id
       WHERE lower(a.alias) = lower($1)`,
      [term],
    )
    if (alias.rows[0]) return alias.rows[0]

    const fuzzy = await query('SELECT * FROM skills WHERE lower(name) ILIKE $1 LIMIT 1', [`%${term}%`])
    return fuzzy.rows[0] || null
  },

  async listSkills(search) {
    if (search) {
      const { rows } = await query(
        `SELECT DISTINCT s.* FROM skills s
         LEFT JOIN skill_aliases a ON a.skill_id = s.id
         WHERE lower(s.name) ILIKE $1 OR lower(a.alias) ILIKE $1
         ORDER BY s.name LIMIT 30`,
        [`%${search}%`],
      )
      return rows
    }
    const { rows } = await query('SELECT * FROM skills ORDER BY name')
    return rows
  },

  async resolveMany(inputs) {
    const resolved = []
    for (const item of inputs) {
      const skill = await this.resolveSkill(item.skill || item.name || item)
      if (!skill) throw Errors.badRequest(`Unknown skill: ${item.skill || item.name || item}`)
      resolved.push({ ...item, skillId: skill.id, skillName: skill.name })
    }
    return resolved
  },
}
