import { query } from '../db/pool.js'

export const companyRepo = {
  async findById(id) {
    const { rows } = await query('SELECT * FROM companies WHERE id = $1', [id])
    return rows[0]
  },

  async findForUser(userId) {
    const { rows } = await query(
      `SELECT c.* FROM companies c
       JOIN company_users cu ON cu.company_id = c.id
       WHERE cu.user_id = $1 AND cu.is_active = TRUE
       ORDER BY c.created_at LIMIT 1`,
      [userId],
    )
    return rows[0]
  },

  async create(data) {
    const { rows } = await query(
      `INSERT INTO companies (name, description, industry, website, location, logo, company_size, domains, technology_areas, contact_email, contact_phone, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [data.name, data.description, data.industry, data.website, data.location, data.logo, data.companySize,
        data.domains || [], data.technologyAreas || [], data.contactEmail, data.contactPhone, data.createdBy],
    )
    return rows[0]
  },

  async update(id, data) {
    const { rows } = await query(
      `UPDATE companies SET
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        industry = COALESCE($4, industry),
        website = COALESCE($5, website),
        location = COALESCE($6, location),
        logo = COALESCE($7, logo),
        company_size = COALESCE($8, company_size),
        domains = COALESCE($9, domains),
        technology_areas = COALESCE($10, technology_areas),
        contact_email = COALESCE($11, contact_email),
        contact_phone = COALESCE($12, contact_phone),
        updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, data.name, data.description, data.industry, data.website, data.location, data.logo,
        data.companySize, data.domains, data.technologyAreas, data.contactEmail, data.contactPhone],
    )
    return rows[0]
  },
}

export async function getCompanyMembers(companyId) {
  const { rows } = await query(
    `SELECT cu.id, cu.user_id, cu.role, cu.designation, cu.department, cu.areas_of_hiring, cu.is_active,
            u.full_name, u.email, u.avatar
     FROM company_users cu JOIN users u ON u.id = cu.user_id
     WHERE cu.company_id = $1 ORDER BY cu.created_at`,
    [companyId],
  )
  return rows
}
