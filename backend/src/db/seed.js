import bcrypt from 'bcryptjs'
import { query, pool } from './pool.js'

async function seed() {
  console.log('Seeding EduNexus demo data...')

  const passwordHash = await bcrypt.hash('Password@123', 10)

  async function findOrCreateUser({ full_name, email, role }) {
    const existing = await query('SELECT * FROM users WHERE lower(email) = lower($1)', [email])
    if (existing.rows[0]) return existing.rows[0]
    return insert('users', { full_name, email, password_hash: passwordHash, role })
  }

  async function findOrCreateCompany(details) {
    const existing = await query('SELECT * FROM companies WHERE lower(name) = lower($1)', [details.name])
    if (existing.rows[0]) return existing.rows[0]
    return insert('companies', details)
  }

  async function findOrCreateInstitution(details) {
    const existing = await query('SELECT * FROM institutions WHERE lower(name) = lower($1)', [details.name])
    if (existing.rows[0]) return existing.rows[0]
    return insert('institutions', details)
  }

  async function ensureInstitutionUser(institutionId, userId, role) {
    const existing = await query('SELECT * FROM institution_users WHERE institution_id = $1 AND user_id = $2', [institutionId, userId])
    if (existing.rows[0]) return existing.rows[0]
    return insert('institution_users', { institution_id: institutionId, user_id: userId, role, is_active: true })
  }

  async function ensureDepartment(institutionId, name, code) {
    const existing = await query('SELECT * FROM departments WHERE institution_id = $1 AND lower(code) = lower($2)', [institutionId, code])
    if (existing.rows[0]) return existing.rows[0]
    return insert('departments', { institution_id: institutionId, name, code })
  }

  async function ensureRecord(table, data, matchColumns = []) {
    if (!matchColumns.length) {
      const existing = await query(`SELECT * FROM ${table} LIMIT 1`)
      if (existing.rows[0]) return existing.rows[0]
      return insert(table, data)
    }
    const where = matchColumns.map((column, index) => `${column} = $${index + 1}`).join(' AND ')
    const values = matchColumns.map((column) => data[column])
    const existing = await query(`SELECT * FROM ${table} WHERE ${where} LIMIT 1`, values)
    if (existing.rows[0]) return existing.rows[0]
    return insert(table, data)
  }

  // --- Users ---
  const recruiterUser = await findOrCreateUser({
    full_name: 'Priya Sharma', email: 'priya@technova.com', role: 'RECRUITER',
  })
  const adminUser = await findOrCreateUser({
    full_name: 'Rahul Verma', email: 'rahul@technova.com', role: 'RECRUITER',
  })
  const academicUser = await findOrCreateUser({
    full_name: 'Aisha Iyer', email: 'aisha@iiit.ac.in', role: 'ACADEMIA',
  })

  // --- Company ---
  const company = await findOrCreateCompany({
    name: 'TechNova Solutions', description: 'Full-service product engineering company building scalable cloud-native platforms for finance, healthcare and e-commerce clients.',
    industry: 'Software & IT Services', website: 'https://technova.example.com', location: 'Bengaluru, Karnataka',
    logo: '', company_size: '201-500', domains: ['FinTech', 'HealthTech', 'E-Commerce'],
    technology_areas: ['Java', 'Spring Boot', 'React', 'Node.js', 'Python', 'AWS', 'PostgreSQL'],
    contact_email: 'careers@technova.com', contact_phone: '+91 80 4000 1234', created_by: recruiterUser.id,
    verification_status: 'VERIFIED',
  })

  // --- Academy institution ---
  const institution = await findOrCreateInstitution({
    name: 'IIIT Hyderabad', description: 'Premier research and engineering institution focused on computer science, AI, and industry-ready talent.',
    website: 'https://iiit.ac.in', location: 'Hyderabad, Telangana', institution_type: 'UNIVERSITY',
    verification_status: 'VERIFIED',
  })
  await ensureInstitutionUser(institution.id, academicUser.id, 'INSTITUTION_ADMIN')

  const departments = {
    CSE: await ensureDepartment(institution.id, 'Computer Science and Engineering', 'CSE'),
    ECE: await ensureDepartment(institution.id, 'Electronics and Communication Engineering', 'ECE'),
    DS: await ensureDepartment(institution.id, 'Data Science', 'DS'),
    IT: await ensureDepartment(institution.id, 'Information Technology', 'IT'),
  }

  await ensureRecord('company_users', {
    company_id: company.id, user_id: recruiterUser.id, role: 'COMPANY_ADMIN',
    designation: 'Talent Acquisition Lead', department: 'Human Resources',
    areas_of_hiring: ['Backend Engineering', 'Data Engineering', 'Frontend'],
  }, ['company_id', 'user_id'])
  await ensureRecord('company_users', {
    company_id: company.id, user_id: adminUser.id, role: 'HIRING_MANAGER',
    designation: 'Engineering Manager', department: 'Engineering',
    areas_of_hiring: ['Backend Engineering', 'Platform'],
  }, ['company_id', 'user_id'])

  await ensureRecord('recruiters', {
    user_id: recruiterUser.id, company_id: company.id, designation: 'Talent Acquisition Lead',
    department: 'Human Resources', areas_of_hiring: ['Backend Engineering', 'Data Engineering'],
  }, ['user_id', 'company_id'])

  // --- Skills ---
  const skills = {
    Java: { name: 'Java', category: 'Programming Language' },
    'Spring Boot': { name: 'Spring Boot', category: 'Framework' },
    SQL: { name: 'SQL', category: 'Database' },
    'REST APIs': { name: 'REST APIs', category: 'Architecture' },
    Docker: { name: 'Docker', category: 'DevOps' },
    Git: { name: 'Git', category: 'DevOps' },
    React: { name: 'React', category: 'Frontend' },
    'Node.js': { name: 'Node.js', category: 'Backend' },
    Python: { name: 'Python', category: 'Programming Language' },
    AWS: { name: 'AWS', category: 'Cloud' },
    PostgreSQL: { name: 'PostgreSQL', category: 'Database' },
    Redis: { name: 'Redis', category: 'Database' },
    Kubernetes: { name: 'Kubernetes', category: 'DevOps' },
    Tailwind: { name: 'Tailwind CSS', category: 'Frontend' },
    Typescript: { name: 'TypeScript', category: 'Programming Language' },
    JavaScript: { name: 'JavaScript', category: 'Programming Language' },
    'Machine Learning': { name: 'Machine Learning', category: 'AI / ML' },
    Pandas: { name: 'Pandas', category: 'Data Science' },
    Spark: { name: 'Apache Spark', category: 'Data Engineering' },
  }
  const skillIds = {}
  for (const [key, s] of Object.entries(skills)) {
    const existing = await query('SELECT id FROM skills WHERE lower(name) = lower($1)', [s.name])
    if (existing.rows[0]) {
      skillIds[key] = existing.rows[0].id
      continue
    }
    const r = await insert('skills', s)
    skillIds[key] = r.id
  }
  await ensureRecord('skill_aliases', { skill_id: skillIds.JavaScript, alias: 'JS' }, ['alias'])
  await ensureRecord('skill_aliases', { skill_id: skillIds.JavaScript, alias: 'Javascript' }, ['alias'])
  await ensureRecord('skill_aliases', { skill_id: skillIds.JavaScript, alias: 'Java Script' }, ['alias'])

  // --- Opportunities ---
  const backRole = await insert('opportunities', {
    company_id: company.id, title: 'Backend Developer', type: 'JOB', role_title: 'Backend Developer',
    description: 'Design and build resilient REST APIs and microservices powering our core product suite. Work closely with data and platform teams.',
    responsibilities: 'Build REST APIs; design database schemas; optimise query performance; participate in code reviews; own services end to end.',
    eligibility: 'Relevant degree in Computer Science or related field. 0-2 years of backend experience. Strong problem-solving skills.',
    location: 'Bengaluru / Remote', work_mode: 'REMOTE', duration: 'Full-time', salary: '₹8 - 14 LPA',
    selection_process: 'Technical screen, coding assessment, panel interview, HR round.',
    openings: 3, status: 'PUBLISHED', application_deadline: '2026-10-30', contact: 'careers@technova.com',
    created_by: recruiterUser.id, published_at: new Date(),
  })
  const frontRole = await insert('opportunities', {
    company_id: company.id, title: 'Frontend Developer', type: 'JOB', role_title: 'Frontend Developer',
    description: 'Craft delightful, accessible React interfaces for our analytics and collaboration products.',
    responsibilities: 'Build React components; implement design system; collaborate with designers; ensure accessibility; optimise performance.',
    eligibility: 'Relevant degree. 0-2 years frontend experience with React. Understanding of modern CSS and testing.',
    location: 'Hyderabad / Remote', work_mode: 'HYBRID', duration: 'Full-time', salary: '₹7 - 12 LPA',
    selection_process: 'Portfolio review, coding assessment, technical interview.',
    openings: 2, status: 'PUBLISHED', application_deadline: '2026-11-15', contact: 'careers@technova.com',
    created_by: recruiterUser.id, published_at: new Date(),
  })
  const internship = await insert('opportunities', {
    company_id: company.id, title: 'Software Engineering Intern', type: 'INTERNSHIP', role_title: 'Software Engineering Intern',
    description: 'Hands-on internship building production features alongside our engineering squads.',
    responsibilities: 'Implement features; write tests; learn from mentors; document your work; ship real code.',
    eligibility: 'Final year B.Tech/B.E. Computer Science or allied branches. Strong programming fundamentals.',
    location: 'Remote', work_mode: 'REMOTE', duration: '6 months', stipend: '₹25,000 / month',
    selection_process: 'Coding assessment, technical interview.',
    openings: 5, status: 'PUBLISHED', application_deadline: '2026-09-30', contact: 'internships@technova.com',
    created_by: recruiterUser.id, published_at: new Date(),
  })
  const mlRole = await insert('opportunities', {
    company_id: company.id, title: 'AI / ML Engineer', type: 'JOB', role_title: 'AI / ML Engineer',
    description: 'Build and deploy ML models and skill-intelligence pipelines for our platform.',
    responsibilities: 'Build ML pipelines; work on embeddings; integrate LLMs; evaluate model performance; deploy to production.',
    eligibility: 'Relevant degree. Strong Python and ML fundamentals. Experience with LLMs preferred.',
    location: 'Bengaluru', work_mode: 'ONSITE', duration: 'Full-time', salary: '₹12 - 20 LPA',
    selection_process: 'Technical screen, ML assessment, panel interview.',
    openings: 2, status: 'PUBLISHED', application_deadline: '2026-11-01', contact: 'careers@technova.com',
    created_by: recruiterUser.id, published_at: new Date(),
  })

  // --- Opportunity skills ---
  const oppSkills = [
    [backRole.id, 'Java', 'ADVANCED', 'MANDATORY', 2],
    [backRole.id, 'Spring Boot', 'INTERMEDIATE', 'MANDATORY', 1],
    [backRole.id, 'SQL', 'INTERMEDIATE', 'MANDATORY', 1],
    [backRole.id, 'REST APIs', 'INTERMEDIATE', 'MANDATORY', 1],
    [backRole.id, 'Docker', 'BASIC', 'PREFERRED', 0.5],
    [backRole.id, 'Git', 'INTERMEDIATE', 'PREFERRED', 1],
    [frontRole.id, 'React', 'INTERMEDIATE', 'MANDATORY', 1],
    [frontRole.id, 'Tailwind', 'BASIC', 'PREFERRED', 0.5],
    [frontRole.id, 'Git', 'INTERMEDIATE', 'PREFERRED', 1],
    [frontRole.id, 'REST APIs', 'INTERMEDIATE', 'MANDATORY', 1],
    [internship.id, 'Java', 'BASIC', 'PREFERRED', 0],
    [internship.id, 'Python', 'BASIC', 'PREFERRED', 0],
    [internship.id, 'Git', 'BASIC', 'MANDATORY', 0],
    [internship.id, 'SQL', 'BASIC', 'PREFERRED', 0],
    [mlRole.id, 'Python', 'ADVANCED', 'MANDATORY', 2],
    [mlRole.id, 'Machine Learning', 'INTERMEDIATE', 'MANDATORY', 1],
    [mlRole.id, 'SQL', 'INTERMEDIATE', 'PREFERRED', 1],
    [mlRole.id, 'Pandas', 'INTERMEDIATE', 'PREFERRED', 1],
    [mlRole.id, 'Docker', 'BASIC', 'PREFERRED', 0.5],
  ]
  for (const [oid, key, lvl, prio, yrs] of oppSkills) {
    await ensureRecord('opportunity_skills', {
      opportunity_id: oid, skill_id: skillIds[key], required_level: lvl, priority: prio, years_experience: yrs,
    }, ['opportunity_id', 'skill_id'])
  }

  // --- Students / candidates ---
  const candidates = [
    { full_name: 'Aarav Kulkarni', email: 'aarav.k@student.edu', first: 'Aarav', last: 'Kulkarni', inst: 'IIT Bombay', course: 'B.Tech Computer Science', grad: 2026, loc: 'Mumbai', bio: 'Backend enthusiast with strong Java and Spring Boot skills.', interests: ['Backend Engineering', 'Platform'], skills: { Java: 'ADVANCED', 'Spring Boot': 'INTERMEDIATE', SQL: 'INTERMEDIATE', 'REST APIs': 'INTERMEDIATE', Docker: 'BASIC', Git: 'INTERMEDIATE' }, proj: ['E-commerce order service', 'REST API gateway'], cert: ['Oracle Java SE Certified', 'AWS Cloud Practitioner'], exp: [{ org: 'Acme Labs', role: 'Backend Intern', start: '2025-05-01', end: '2025-08-01', skills: ['Java', 'Spring Boot'] }] },
    { full_name: 'Meera Shah', email: 'meera.s@student.edu', first: 'Meera', last: 'Shah', inst: 'NIT Trichy', course: 'B.Tech Data Science', grad: 2026, loc: 'Pune', bio: 'Data engineer focused on building scalable pipelines and ML models.', interests: ['Data Engineering', 'AI / ML'], skills: { Java: 'BASIC', Python: 'ADVANCED', SQL: 'INTERMEDIATE', 'Machine Learning': 'INTERMEDIATE', Pandas: 'INTERMEDIATE', 'REST APIs': 'INTERMEDIATE' }, proj: ['Spark ETL pipeline', 'Fraud detection model'], cert: ['TensorFlow Developer'], exp: [{ org: 'DataWorks', role: 'Data Science Intern', start: '2025-06-01', end: '2025-09-01', skills: ['Python', 'SQL'] }] },
    { full_name: 'Rohan Nair', email: 'rohan.n@student.edu', first: 'Rohan', last: 'Nair', inst: 'BITS Pilani', course: 'B.E. Computer Science', grad: 2027, loc: 'Bengaluru', bio: 'Frontend developer who loves building clean interfaces with React.', interests: ['Frontend Engineering', 'Product'], skills: { React: 'INTERMEDIATE', 'REST APIs': 'INTERMEDIATE', Git: 'INTERMEDIATE', Tailwind: 'BASIC', 'Node.js': 'INTERMEDIATE' }, proj: ['Analytics dashboard', 'Design system library'], cert: ['Meta Frontend Developer'], exp: [{ org: 'PixelWorks', role: 'Frontend Intern', start: '2025-01-01', end: '2025-04-01', skills: ['React'] }] },
    { full_name: 'Ishita Reddy', email: 'ishita.r@student.edu', first: 'Ishita', last: 'Reddy', inst: 'IIIT Hyderabad', course: 'B.Tech CSE', grad: 2026, loc: 'Hyderabad', bio: 'Full-stack engineer with a passion for distributed systems and Go.', interests: ['Backend Engineering', 'Systems'], skills: { Java: 'INTERMEDIATE', SQL: 'INTERMEDIATE', 'REST APIs': 'INTERMEDIATE', Docker: 'INTERMEDIATE', 'Node.js': 'ADVANCED', Git: 'INTERMEDIATE' }, proj: ['Distributed task queue', 'real-time chat'], cert: ['Docker Essentials'], exp: [{ org: 'CloudPeak', role: 'Platform Intern', start: '2025-07-01', end: '2025-10-01', skills: ['Docker', 'Node.js'] }] },
    { full_name: 'Kabir Malhotra', email: 'kabir.m@student.edu', first: 'Kabir', last: 'Malhotra', inst: 'DTU Delhi', course: 'B.Tech CSE', grad: 2026, loc: 'Delhi', bio: 'ML engineer building production-grade models with MLOps.', interests: ['AI / ML', 'Data Science'], skills: { Python: 'ADVANCED', 'Machine Learning': 'ADVANCED', Pandas: 'INTERMEDIATE', SQL: 'INTERMEDIATE', Docker: 'BASIC', Git: 'INTERMEDIATE' }, proj: ['NLP document classifier', 'Recommendation engine'], cert: ['Deep Learning Specialization'], exp: [{ org: 'CogniSoft', role: 'ML Intern', start: '2025-05-01', end: '2025-08-01', skills: ['Python', 'Machine Learning'] }] },
    { full_name: 'Sana Qureshi', email: 'sana.q@student.edu', first: 'Sana', last: 'Qureshi', inst: 'VIT Vellore', course: 'B.Tech IT', grad: 2026, loc: 'Chennai', bio: 'Full-stack developer focused on React, Node and cloud-native apps.', interests: ['Frontend Engineering', 'Backend Engineering'], skills: { Java: 'BASIC', React: 'ADVANCED', 'Node.js': 'INTERMEDIATE', 'REST APIs': 'INTERMEDIATE', Git: 'INTERMEDIATE', SQL: 'INTERMEDIATE' }, proj: ['E-commerce storefront', 'REST API for social app'], cert: ['Responsive Web Design'], exp: [{ org: 'WebGenie', role: 'Frontend Intern', start: '2025-02-01', end: '2025-05-01', skills: ['React'] }] },
    { full_name: 'Dev Patel', email: 'dev.p@student.edu', first: 'Dev', last: 'Patel', inst: 'Nirma University', course: 'B.Tech CSE', grad: 2027, loc: 'Ahmedabad', bio: 'Aspiring backend engineer learning Java, Spring and SQL.', interests: ['Backend Engineering'], skills: { Java: 'INTERMEDIATE', 'Spring Boot': 'BASIC', SQL: 'INTERMEDIATE', Git: 'BASIC' }, proj: ['Student management system'], cert: [], exp: [] },
    { full_name: 'Ananya Iyer', email: 'ananya.i@student.edu', first: 'Ananya', last: 'Iyer', inst: 'Anna University', course: 'B.E. CSE', grad: 2026, loc: 'Coimbatore', bio: 'Data science student who enjoys SQL and building dashboards.', interests: ['Data Science', 'Product Analytics'], skills: { Python: 'INTERMEDIATE', SQL: 'ADVANCED', Pandas: 'INTERMEDIATE', 'Machine Learning': 'BASIC', Git: 'BASIC' }, proj: ['Sales analytics dashboard'], cert: ['SQL for Data Science'], exp: [{ org: 'InsightLabs', role: 'Data Analyst Intern', start: '2025-06-01', end: '2025-08-01', skills: ['SQL', 'Python'] }] },
  ]

  const studentRecords = []
  for (const c of candidates) {
    const user = await findOrCreateUser({ full_name: c.full_name, email: c.email, role: 'STUDENT' })
    const departmentKey = /data science|analytics/i.test(c.course) ? 'DS' : /it|information technology/i.test(c.course) ? 'IT' : /electronics|ece/i.test(c.course) ? 'ECE' : 'CSE'
    const student = await insert('students', {
      user_id: user.id, first_name: c.first, last_name: c.last, institution_name: c.inst, course: c.course,
      graduation_year: c.grad, location: c.loc, bio: c.bio, career_interests: c.interests,
      internship_availability: true, verification_status: 'INSTITUTION_VERIFIED', consent_public_visibility: true,
      institution_id: institution.id, department_id: departments[departmentKey].id,
    })
    const sss = {}
    for (const [key, lvl] of Object.entries(c.skills)) {
      const ss = await insert('student_skills', {
        student_id: student.id, skill_id: skillIds[key], self_level: lvl, verified_level: lvl, years_experience: 1,
      })
      sss[key] = ss.id
      if (c.proj.length || c.cert.length) {
        const evidenceTypes = []
        if (c.proj.length) evidenceTypes.push('PROJECT')
        if (c.cert.length) evidenceTypes.push('CERTIFICATION')
        if (c.exp.length) evidenceTypes.push('INTERNSHIP')
        for (const et of evidenceTypes.slice(0, 2)) {
          await insert('student_skill_evidence', {
            student_skill_id: ss.id, evidence_type: et,
            title: et === 'PROJECT' ? c.proj[0] : et === 'CERTIFICATION' ? c.cert[0] : c.exp[0].role,
            description: `Evidence demonstrating ${key} proficiency.`, is_verified: true, verified_by: c.inst,
          })
        }
      }
    }
    for (const p of c.proj) {
      await insert('student_projects', { student_id: student.id, title: p, description: 'A project demonstrating practical skills.', project_url: 'https://portfolio.example.com' })
    }
    for (const cert of c.cert) {
      await insert('student_certifications', { student_id: student.id, name: cert, issuer: 'Verified Certifier', issue_date: '2025-06-01' })
    }
    for (const e of c.exp) {
      const exp = await insert('student_experience', { student_id: student.id, organization: e.org, role: e.role, start_date: e.start, end_date: e.end, description: 'Internship experience.' })
      void exp
    }
    studentRecords.push({ student, user, skills: c.skills })
  }

  // --- Applications across opportunities ---
  const appSpecs = [
    { opp: backRole.id, cand: 0, status: 'INTERVIEW' }, // Aarav
    { opp: backRole.id, cand: 3, status: 'SHORTLISTED' }, // Ishita
    { opp: backRole.id, cand: 6, status: 'UNDER_REVIEW' }, // Dev
    { opp: frontRole.id, cand: 2, status: 'SHORTLISTED' }, // Rohan
    { opp: frontRole.id, cand: 5, status: 'UNDER_REVIEW' }, // Sana
    { opp: mlRole.id, cand: 1, status: 'SELECTED' }, // Meera
    { opp: mlRole.id, cand: 4, status: 'INTERVIEW' }, // Kabir
    { opp: internship.id, cand: 6, status: 'APPLIED' }, // Dev
    { opp: internship.id, cand: 7, status: 'UNDER_REVIEW' }, // Ananya
  ]
  const applications = []
  for (const spec of appSpecs) {
    const candidate = studentRecords[spec.cand]
    const app = await ensureRecord('applications', {
      opportunity_id: spec.opp, student_id: candidate.student.id, company_id: company.id, status: spec.status,
      applied_at: new Date(),
    }, ['opportunity_id', 'student_id'])
    await ensureRecord('application_status_history', { application_id: app.id, to_status: spec.status, changed_by: recruiterUser.id }, ['application_id', 'to_status'])
    applications.push({ ...spec, app, candidate })
  }

  // --- Interviews ---
  await ensureRecord('interviews', {
    company_id: company.id, application_id: applications[0].app.id, opportunity_id: backRole.id,
    student_id: applications[0].candidate.student.id, interviewer_id: recruiterUser.id,
    round_number: 1, round_name: 'Technical Round', scheduled_at: new Date(Date.now() + 86400000),
    mode: 'ONLINE', status: 'SCHEDULED',
  }, ['company_id', 'application_id', 'round_number'])
  await ensureRecord('interviews', {
    company_id: company.id, application_id: applications[6].app.id, opportunity_id: mlRole.id,
    student_id: applications[6].candidate.student.id, interviewer_id: recruiterUser.id,
    round_number: 1, round_name: 'Technical Round', scheduled_at: new Date(Date.now() + 2 * 86400000),
    mode: 'ONLINE', status: 'SCHEDULED',
  }, ['company_id', 'application_id', 'round_number'])

  // --- Offer for selected Meera ---
  const offerApp = applications.find((a) => a.cand === 1)
  const offer = await ensureRecord('offers', {
    company_id: company.id, application_id: offerApp.app.id, opportunity_id: mlRole.id,
    student_id: offerApp.candidate.student.id, role_title: 'AI / ML Engineer', compensation: '₹14 LPA',
    offer_date: '2026-09-01', joining_date: '2026-12-01', status: 'SENT',
  }, ['application_id'])
  await ensureRecord('placement_outcomes', {
    offer_id: offer.id, application_id: offerApp.app.id, student_id: offerApp.candidate.student.id,
    company_id: company.id, joined: true, joined_at: '2026-12-01', role_title: 'AI / ML Engineer', compensation: '₹14 LPA',
  }, ['application_id'])

  // --- Role requirements (skill demand) ---
  const roleBack = await ensureRecord('role_requirements', {
    company_id: company.id, role_title: 'Backend Developer', description: 'Build and maintain resilient backend services.',
    years_experience_min: 0, years_experience_max: 2, education: 'Relevant degree', location: 'Bengaluru / Remote',
  }, ['company_id', 'role_title'])
  await ensureRecord('industry_skill_demands', { company_id: company.id, opportunity_id: backRole.id, skill_id: skillIds.Java, required_level: 'ADVANCED', priority: 'MANDATORY' }, ['company_id', 'opportunity_id', 'skill_id'])
  await ensureRecord('industry_skill_demands', { company_id: company.id, opportunity_id: backRole.id, skill_id: skillIds['Spring Boot'], required_level: 'INTERMEDIATE', priority: 'MANDATORY' }, ['company_id', 'opportunity_id', 'skill_id'])
  await ensureRecord('industry_skill_demands', { company_id: company.id, opportunity_id: backRole.id, skill_id: skillIds.SQL, required_level: 'INTERMEDIATE', priority: 'MANDATORY' }, ['company_id', 'opportunity_id', 'skill_id'])
  await ensureRecord('industry_skill_demands', { company_id: company.id, opportunity_id: backRole.id, skill_id: skillIds.Docker, required_level: 'BASIC', priority: 'PREFERRED' }, ['company_id', 'opportunity_id', 'skill_id'])
  await ensureRecord('industry_skill_demands', { company_id: company.id, opportunity_id: backRole.id, skill_id: skillIds.AWS, required_level: 'BASIC', priority: 'PREFERRED' }, ['company_id', 'opportunity_id', 'skill_id'])

  // --- Collaborations ---
  await ensureRecord('collaborations', {
    company_id: company.id, title: 'Backend Engineering Roadmap Workshop', type: 'WORKSHOP',
    description: 'Hands-on workshop on modern backend development for final year students.',
    target_audience: 'Final year B.Tech CSE', location: 'Online', mode: 'ONLINE', status: 'PROPOSED',
    contact: 'academia@technova.com',
  }, ['company_id', 'title'])
  await ensureRecord('collaborations', {
    company_id: company.id, title: 'Industry Guest Lecture on Skill Intelligence', type: 'GUEST_LECTURE',
    description: 'Guest lecture on how AI maps industry demand to student skill development.',
    target_audience: 'All students', status: 'PROPOSED',
  }, ['company_id', 'title'])

  // --- Matching weights ---
  await ensureRecord('matching_weights', {
    skill_compatibility: 35, skill_evidence: 20, assessment: 15, experience: 10,
    career_preference: 10, eligibility: 5, stated_preferences: 5,
  }, ['skill_compatibility', 'skill_evidence'])

  console.log('Seeding complete.')
  await pool.end()
}

async function insert(table, data) {
  const keys = Object.keys(data)
  const values = keys.map((k) => data[k])
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
  const { rows } = await query(
    `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
    values,
  )
  return rows[0]
}

seed().catch((error) => {
  console.error('Seed error:', error)
  process.exit(1)
})
