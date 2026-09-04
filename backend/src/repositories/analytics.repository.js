import { query } from '../db/pool.js'

export const analyticsRepo = {
  async dashboard(companyId) {
    const metrics = { activeOpportunities: 0, applications: 0, shortlisted: 0, interviews: 0, offers: 0, hired: 0 }

    const opp = await query(
      "SELECT COUNT(*)::int AS n FROM opportunities WHERE company_id = $1 AND status = 'PUBLISHED'",
      [companyId],
    )
    metrics.activeOpportunities = opp.rows[0].n

    const apps = await query('SELECT COUNT(*)::int AS n FROM applications WHERE company_id = $1', [companyId])
    metrics.applications = apps.rows[0].n

    const short = await query(
      "SELECT COUNT(*)::int AS n FROM applications WHERE company_id = $1 AND status IN ('SHORTLISTED','ASSESSMENT','INTERVIEW','SELECTED')",
      [companyId],
    )
    metrics.shortlisted = short.rows[0].n

    const intv = await query(
      "SELECT COUNT(*)::int AS n FROM interviews WHERE company_id = $1 AND status = 'SCHEDULED'",
      [companyId],
    )
    metrics.interviews = intv.rows[0].n

    const off = await query("SELECT COUNT(*)::int AS n FROM offers WHERE company_id = $1", [companyId])
    metrics.offers = off.rows[0].n

    const hired = await query(
      `SELECT COUNT(*)::int AS n FROM placement_outcomes WHERE company_id = $1 AND joined = TRUE`,
      [companyId],
    )
    metrics.hired = hired.rows[0].n

    const recentApps = await query(
      `SELECT a.id, s.first_name, s.last_name, o.title AS opportunity_title, a.status, a.applied_at
       FROM applications a JOIN students s ON s.id = a.student_id
       JOIN opportunities o ON o.id = a.opportunity_id
       WHERE a.company_id = $1 ORDER BY a.applied_at DESC LIMIT 6`,
      [companyId],
    )

    const upcomingInterviews = await query(
      `SELECT i.id, i.scheduled_at, i.mode, i.status, s.first_name, s.last_name, o.title AS opportunity_title
       FROM interviews i JOIN students s ON s.id = i.student_id
       JOIN opportunities o ON o.id = i.opportunity_id
       WHERE i.company_id = $1 AND i.status = 'SCHEDULED' AND i.scheduled_at >= NOW()
       ORDER BY i.scheduled_at ASC LIMIT 6`,
      [companyId],
    )

    return { metrics, recentApplications: recentApps.rows, upcomingInterviews: upcomingInterviews.rows }
  },

  async skillDemand(companyId) {
    const { rows } = await query(
      `SELECT s.name AS skill, COUNT(os.id)::int AS opportunity_count,
              COUNT(*) FILTER (WHERE os.priority = 'MANDATORY')::int AS mandatory_count
       FROM opportunity_skills os
       JOIN skills s ON s.id = os.skill_id
       JOIN opportunities o ON o.id = os.opportunity_id
       WHERE o.company_id = $1 AND o.status IN ('PUBLISHED','PENDING_REVIEW','PAUSED')
       GROUP BY s.name ORDER BY opportunity_count DESC`,
      [companyId],
    )
    return rows
  },

  async skillGaps(companyId) {
    const { rows } = await query(
      `SELECT s.name AS skill,
              COUNT(DISTINCT os.opportunity_id)::int AS demand,
              COUNT(CASE WHEN ss.id IS NULL THEN 1 END)::int AS missing
       FROM opportunity_skills os
       JOIN skills s ON s.id = os.skill_id
       JOIN opportunities o ON o.id = os.opportunity_id
       LEFT JOIN student_skills ss ON ss.skill_id = os.skill_id
       WHERE o.company_id = $1 AND o.status = 'PUBLISHED'
       GROUP BY s.name
       ORDER BY demand DESC`,
      [companyId],
    )
    return rows
  },

  async funnel(companyId) {
    const stages = ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED']
    const out = []
    for (const stage of stages) {
      const r = await query(
        'SELECT COUNT(*)::int AS n FROM applications WHERE company_id = $1 AND status = $2',
        [companyId, stage],
      )
      out.push({ stage, count: r.rows[0].n })
    }
    return out
  },

  async applicationsByOpportunity(companyId) {
    const { rows } = await query(
      `SELECT o.title, COUNT(a.id)::int AS applications
       FROM opportunities o LEFT JOIN applications a ON a.opportunity_id = o.id
       WHERE o.company_id = $1
       GROUP BY o.id, o.title ORDER BY applications DESC`,
      [companyId],
    )
    return rows
  },

  async candidateSkillDistribution(companyId) {
    const { rows } = await query(
      `SELECT s.name AS skill, COUNT(ss.id)::int AS candidates
       FROM skills s
       JOIN student_skills ss ON ss.skill_id = s.id
       GROUP BY s.name ORDER BY candidates DESC LIMIT 12`,
    )
    return rows
  },

  async matchStats(companyId) {
    const { rows } = await query(
      `SELECT strength, COUNT(*)::int AS count FROM matches
       WHERE company_id = $1 GROUP BY strength`,
      [companyId],
    )
    return rows
  },
}
