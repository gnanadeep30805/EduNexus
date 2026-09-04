import { asyncHandler, success } from '../utils/api.js'
import { query } from '../db/pool.js'

const institutionFilter = (req) => [req.user.institutionId]

export const getDashboard = asyncHandler(async (req, res) => {
  const [institution, students, departments, skills, internships, placements, demand, gaps] = await Promise.all([
    query('SELECT * FROM institutions WHERE id = $1', institutionFilter(req)),
    query('SELECT COUNT(*)::int AS count FROM students WHERE institution_id = $1', institutionFilter(req)),
    query('SELECT COUNT(*)::int AS count FROM departments WHERE institution_id = $1', institutionFilter(req)),
    query(`SELECT COUNT(DISTINCT ss.skill_id)::int AS count FROM student_skills ss JOIN students s ON s.id = ss.student_id WHERE s.institution_id = $1 AND ss.verified_level IS NOT NULL`, institutionFilter(req)),
    query(`SELECT COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active, COUNT(*) FILTER (WHERE status = 'UPCOMING')::int AS upcoming, COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed, COUNT(*) FILTER (WHERE status = 'AT_RISK')::int AS at_risk FROM internship_monitoring im JOIN students s ON s.id = im.student_id WHERE s.institution_id = $1`, institutionFilter(req)),
    query(`SELECT COUNT(*)::int AS joined FROM placement_outcomes po JOIN students s ON s.id = po.student_id WHERE s.institution_id = $1 AND po.joined = TRUE`, institutionFilter(req)),
    query(`SELECT sk.name AS skill, COUNT(DISTINCT os.opportunity_id)::int AS demand, COUNT(DISTINCT ss.student_id)::int AS supply
      FROM skills sk LEFT JOIN opportunity_skills os ON os.skill_id = sk.id
      LEFT JOIN student_skills ss ON ss.skill_id = sk.id
      LEFT JOIN students st ON st.id = ss.student_id AND st.institution_id = $1
      WHERE os.opportunity_id IS NULL OR EXISTS (SELECT 1 FROM opportunities o WHERE o.id = os.opportunity_id AND o.status = 'PUBLISHED')
      GROUP BY sk.id, sk.name ORDER BY demand DESC, supply ASC LIMIT 8`, institutionFilter(req)),
    query(`SELECT sk.name AS skill, COUNT(DISTINCT os.opportunity_id)::int AS demand, COUNT(DISTINCT ss.student_id)::int AS supply,
      CASE WHEN COUNT(DISTINCT os.opportunity_id) >= 4 AND COUNT(DISTINCT ss.student_id) = 0 THEN 'CRITICAL'
           WHEN COUNT(DISTINCT os.opportunity_id) > COUNT(DISTINCT ss.student_id) THEN 'HIGH' ELSE 'LOW' END AS priority
      FROM skills sk LEFT JOIN opportunity_skills os ON os.skill_id = sk.id
      LEFT JOIN student_skills ss ON ss.skill_id = sk.id
      LEFT JOIN students st ON st.id = ss.student_id AND st.institution_id = $1
      GROUP BY sk.id, sk.name HAVING COUNT(DISTINCT os.opportunity_id) > COUNT(DISTINCT ss.student_id)
      ORDER BY demand DESC LIMIT 6`, institutionFilter(req)),
  ])
  const totalStudents = students.rows[0].count
  success(res, {
    institution: institution.rows[0],
    metrics: {
      students: totalStudents,
      departments: departments.rows[0].count,
      verifiedSkills: skills.rows[0].count,
      activeInternships: internships.rows[0].active,
      upcomingInternships: internships.rows[0].upcoming,
      completedInternships: internships.rows[0].completed,
      atRiskInternships: internships.rows[0].at_risk,
      placements: placements.rows[0].joined,
    },
    demand: demand.rows,
    gaps: gaps.rows,
  }, 'Academia dashboard loaded')
})

export const getSkills = asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT sk.id, sk.name, sk.category,
    COUNT(DISTINCT ss.student_id)::int AS student_count,
    COUNT(DISTINCT ss.student_id) FILTER (WHERE ss.verified_level IS NOT NULL)::int AS verified_count,
    ROUND(AVG(CASE ss.self_level WHEN 'BASIC' THEN 1 WHEN 'INTERMEDIATE' THEN 2 WHEN 'ADVANCED' THEN 3 WHEN 'EXPERT' THEN 4 END), 2) AS average_level,
    COUNT(DISTINCT os.opportunity_id)::int AS industry_demand
    FROM skills sk LEFT JOIN student_skills ss ON ss.skill_id = sk.id
    LEFT JOIN students st ON st.id = ss.student_id AND st.institution_id = $1
    LEFT JOIN opportunity_skills os ON os.skill_id = sk.id
    GROUP BY sk.id, sk.name, sk.category ORDER BY student_count DESC, industry_demand DESC`, institutionFilter(req))
  success(res, { items: rows }, 'Institutional skills loaded')
})

export const listStudents = asyncHandler(async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page || '1', 10), 1)
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit || '20', 10), 1), 100)
  const search = `%${req.query.search || ''}%`
  const offset = (page - 1) * limit
  const params = [req.user.institutionId, search, limit, offset]
  const [{ rows }, count] = await Promise.all([
    query(`SELECT s.id, s.first_name, s.last_name, s.course, s.graduation_year, s.location, s.verification_status, d.name AS department,
      COUNT(ss.id)::int AS skill_count, COUNT(ss.id) FILTER (WHERE ss.verified_level IS NOT NULL)::int AS verified_skill_count
      FROM students s LEFT JOIN departments d ON d.id = s.department_id LEFT JOIN student_skills ss ON ss.student_id = s.id
      WHERE s.institution_id = $1 AND concat_ws(' ', s.first_name, s.last_name, s.course) ILIKE $2
      GROUP BY s.id, d.name ORDER BY s.last_name, s.first_name LIMIT $3 OFFSET $4`, params),
    query(`SELECT COUNT(*)::int AS count FROM students s WHERE s.institution_id = $1 AND concat_ws(' ', s.first_name, s.last_name, s.course) ILIKE $2`, [req.user.institutionId, search]),
  ])
  success(res, { items: rows, pagination: { page, limit, total: count.rows[0].count, pages: Math.ceil(count.rows[0].count / limit) } }, 'Students loaded')
})

export const listDepartments = asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT d.id, d.name, d.code, COUNT(DISTINCT s.id)::int AS students,
    COUNT(DISTINCT ss.skill_id)::int AS skills
    FROM departments d LEFT JOIN students s ON s.department_id = d.id LEFT JOIN student_skills ss ON ss.student_id = s.id
    WHERE d.institution_id = $1 GROUP BY d.id ORDER BY d.name`, institutionFilter(req))
  success(res, { items: rows }, 'Departments loaded')
})

export const listInternships = asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT im.*, s.first_name, s.last_name, s.course, c.name AS company, o.title AS role
    FROM internship_monitoring im JOIN students s ON s.id = im.student_id
    LEFT JOIN companies c ON c.id = im.company_id LEFT JOIN opportunities o ON o.id = im.opportunity_id
    WHERE s.institution_id = $1 ORDER BY im.end_date NULLS LAST, im.created_at DESC`, institutionFilter(req))
  success(res, { items: rows }, 'Internships loaded')
})

export const listPlacements = asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT po.*, s.first_name, s.last_name, s.course, c.name AS company
    FROM placement_outcomes po JOIN students s ON s.id = po.student_id LEFT JOIN companies c ON c.id = po.company_id
    WHERE s.institution_id = $1 ORDER BY po.created_at DESC`, institutionFilter(req))
  success(res, { items: rows }, 'Placements loaded')
})

export const listCollaborations = asyncHandler(async (_req, res) => {
  const { rows } = await query(`SELECT id, title, type, description, target_audience, mode, proposed_date, status, contact
    FROM collaborations WHERE status <> 'CANCELLED' ORDER BY proposed_date NULLS LAST, created_at DESC`)
  success(res, { items: rows }, 'Collaborations loaded')
})

export const getInstitution = asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM institutions WHERE id = $1', institutionFilter(req))
  success(res, result.rows[0], 'Institution loaded')
})
