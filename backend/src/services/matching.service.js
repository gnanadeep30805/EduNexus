import { query } from '../db/pool.js'
import { candidateRepo } from '../repositories/candidate.repository.js'

const LEVEL_ORDER = { BASIC: 1, INTERMEDIATE: 2, ADVANCED: 3, EXPERT: 4 }

async function getWeights() {
  const { rows } = await query('SELECT * FROM matching_weights ORDER BY updated_at DESC LIMIT 1')
  if (rows[0]) return rows[0]
  return { skill_compatibility: 35, skill_evidence: 20, assessment: 15, experience: 10, career_preference: 10, eligibility: 5, stated_preferences: 5 }
}

async function getOpportunitySkills(opportunityId) {
  const { rows } = await query(
    `SELECT os.skill_id, os.required_level, os.priority, os.years_experience, s.name, s.category
     FROM opportunity_skills os JOIN skills s ON s.id = os.skill_id
     WHERE os.opportunity_id = $1`,
    [opportunityId],
  )
  return rows
}

async function getOpportunity(opportunityId) {
  const { rows } = await query('SELECT * FROM opportunities WHERE id = $1', [opportunityId])
  return rows[0]
}

function evidenceScore(skill, studentSkill, evidence) {
  let score = 0.5
  if (studentSkill.verified_level) score += 0.15
  const evidenceList = evidence[studentSkill.id] || []
  if (evidenceList.length) score += Math.min(0.35, evidenceList.length * 0.15)
  return score
}

export async function computeMatch(opportunityId, studentId) {
  const weights = await getWeights()
  const opportunity = await getOpportunity(opportunityId)
  if (!opportunity) return null

  const reqSkills = await getOpportunitySkills(opportunityId)
  const student = await candidateRepo.findById(studentId)
  if (!student) return null

  const studentSkills = await candidateRepo.getSkills(studentId)
  const studentSkillIds = studentSkills.map((s) => s.id)
  const evidence = await candidateRepo.getEvidence(studentSkillIds)
  const studentSkillsBySkillId = new Map(studentSkills.map((s) => [s.skill_id, s]))
  const sSkill = new Map(studentSkills.map((s) => [s.skill_id, s]))

  // Skill compatibility
  const matchingSkills = []
  const missingSkills = []
  let skillCompSum = 0
  for (const req of reqSkills) {
    const ss = sSkill.get(req.skill_id)
    if (ss) {
      const reqLevel = LEVEL_ORDER[req.required_level] || 2
      const candLevel = LEVEL_ORDER[ss.self_level] || 1
      const ratio = Math.min(1, candLevel / reqLevel)
      matchingSkills.push({
        skill: req.name, skillId: req.skill_id, requiredLevel: req.required_level,
        candidateLevel: ss.self_level, priority: req.priority, matchRatio: ratio,
      })
      skillCompSum += ratio
    } else {
      missingSkills.push({ skill: req.name, skillId: req.skill_id, requiredLevel: req.required_level, priority: req.priority })
    }
  }
  const skillCompatibility = reqSkills.length ? skillCompSum / reqSkills.length : 0

  // Skill evidence
  let evidenceSum = 0
  const evidenceCount = matchingSkills.filter((m) => evidence[sSkill.get(m.skillId)?.id]?.length).length
  evidenceSum = matchingSkills.length ? evidenceCount / matchingSkills.length : 0

  // Assessment proxy from verified levels
  const verifiedCount = studentSkills.filter((s) => s.verified_level).length
  const assessment = studentSkills.length ? verifiedCount / studentSkills.length : 0

  // Experience proxy from work history + years_experience
  const exp = await candidateRepo.getExperience(studentId)
  const expYears = exp.length ? Math.min(5, exp.length) : 0
  const experience = Math.min(1, expYears / 2)

  // Career preference
  const interests = student.career_interests || []
  const interestMatch = interests.length ? 0.7 : 0.3
  const opportunityRole = (opportunity.role_title || opportunity.title || '').toLowerCase()
  const roleMatch = interests.some((i) => opportunityRole.includes(i.toLowerCase()))
  const careerPreference = roleMatch ? 0.85 : interestMatch

  // Eligibility (location / education proxy)
  const eligible = opportunity.status === 'PUBLISHED' ? 0.9 : 0.5
  const eligibility = eligible

  // Stated preferences (internship availability)
  const statedPreferences = student.internship_availability ? 0.8 : 0.5

  const rawScore =
    skillCompatibility * Number(weights.skill_compatibility) +
    evidenceSum * Number(weights.skill_evidence) +
    assessment * Number(weights.assessment) +
    experience * Number(weights.experience) +
    careerPreference * Number(weights.career_preference) +
    eligibility * Number(weights.eligibility) +
    statedPreferences * Number(weights.stated_preferences)

  const score = Math.round(Math.min(100, Math.max(0, rawScore)) * 100) / 100
  const strength = score >= 75 ? 'STRONG' : score >= 55 ? 'GOOD' : score >= 35 ? 'MODERATE' : 'WEAK'

  // Build explanation
  const reasons = []
  if (skillCompatibility >= 0.6) reasons.push(`Strong skill alignment (${Math.round(skillCompatibility * 100)}%)`)
  if (evidenceCount > 0) reasons.push(`${evidenceCount} skill(s) backed by verified evidence`)
  if (assessment >= 0.5) reasons.push('Skills supported by verified assessment levels')
  if (exp.length) reasons.push(`Relevant work experience (${exp.length} internship/role)`)
  if (roleMatch) reasons.push('Career interest aligned with the opportunity')

  const gaps = missingSkills.map((m) => ({ skill: m.skill, requiredLevel: m.requiredLevel, priority: m.priority }))

  const explanation = {
    score,
    strength,
    reasons,
    gaps,
    weights: {
      skillCompatibility: Number(weights.skill_compatibility),
      skillEvidence: Number(weights.skill_evidence),
      assessment: Number(weights.assessment),
      experience: Number(weights.experience),
      careerPreference: Number(weights.career_preference),
      eligibility: Number(weights.eligibility),
      statedPreferences: Number(weights.stated_preferences),
    },
    components: {
      skillCompatibility: Math.round(skillCompatibility * 100),
      skillEvidence: Math.round(evidenceSum * 100),
      assessment: Math.round(assessment * 100),
      experience: Math.round(experience * 100),
      careerPreference: Math.round(careerPreference * 100),
      eligibility: Math.round(eligibility * 100),
      statedPreferences: Math.round(statedPreferences * 100),
    },
  }

  return { matchingSkills, missingSkills, explanation }
}

export async function generateMatches(opportunityId, companyId, students) {
  const results = []
  for (const student of students) {
    const match = await computeMatch(opportunityId, student.id)
    if (!match) continue
    const { rows } = await query(
      `INSERT INTO matches (opportunity_id, student_id, company_id, score, strength, explanation, matching_skills, missing_skills)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (opportunity_id, student_id) DO UPDATE
       SET score = EXCLUDED.score, strength = EXCLUDED.strength,
           explanation = EXCLUDED.explanation, matching_skills = EXCLUDED.matching_skills,
           missing_skills = EXCLUDED.missing_skills
       RETURNING *`,
      [opportunityId, student.id, companyId, match.explanation.score, match.explanation.strength,
        JSON.stringify(match.explanation), JSON.stringify(match.matchingSkills), JSON.stringify(match.missingSkills)],
    )
    results.push(rows[0])
  }
  return results
}
