import { asyncHandler, success } from '../utils/api.js'
import { Errors } from '../utils/errors.js'
import { query } from '../db/pool.js'
import { generateMatches } from '../services/matching.service.js'
import { candidateRepo } from '../repositories/candidate.repository.js'
import { audit } from '../services/audit.service.js'
import { applicationRepo } from '../repositories/application.repository.js'
import { explainMatch } from '../services/gemini.service.js'

export const generateForOpportunity = asyncHandler(async (req, res) => {
  const opp = (await query('SELECT * FROM opportunities WHERE id = $1', [req.params.id])).rows[0]
  if (!opp) throw Errors.notFound('Opportunity not found')
  if (String(opp.company_id) !== String(req.user.companyId)) throw Errors.forbidden('Cannot access another organization\'s opportunity')

  const students = (await query('SELECT id FROM students')).rows
  const matches = await generateMatches(opp.id, req.user.companyId, students)

  const results = []
  for (const m of matches) {
    const student = (await query('SELECT * FROM students WHERE id = $1', [m.student_id])).rows[0]
    results.push({
      id: m.id, score: m.score, strength: m.strength,
      explanation: m.explanation,
      candidate: { id: student.id, firstName: student.first_name, lastName: student.last_name, institutionName: student.institution_name, location: student.location, course: student.course },
    })
  }
  results.sort((a, b) => b.score - a.score)
  await audit(req.user.id, req.user.companyId, 'MATCH_GENERATE', 'opportunity', opp.id)
  success(res, { opportunity: { id: opp.id, title: opp.title }, matches: results }, 'Candidate matches generated')
})

export const listMatches = asyncHandler(async (req, res) => {
  const { opportunityId } = req.query
  const params = [req.user.companyId]
  let where = 'm.company_id = $1'
  if (opportunityId) { params.push(opportunityId); where += ` AND m.opportunity_id = $${params.length}` }
  const { rows } = await query(
    `SELECT m.id, m.opportunity_id, m.student_id, m.score, m.strength, m.explanation, m.matching_skills, m.missing_skills, m.created_at,
            o.title AS opportunity_title, s.first_name, s.last_name, s.institution_name, s.location, s.course
     FROM matches m
     JOIN opportunities o ON o.id = m.opportunity_id
     JOIN students s ON s.id = m.student_id
     WHERE ${where} ORDER BY m.score DESC`,
    params,
  )
  success(res, { items: rows }, 'Matches loaded')
})

export const listMatchCandidates = asyncHandler(async (req, res) => {
  const opp = (await query('SELECT * FROM opportunities WHERE id = $1', [req.params.id])).rows[0]
  if (!opp) throw Errors.notFound('Opportunity not found')
  if (String(opp.company_id) !== String(req.user.companyId)) throw Errors.forbidden('Cannot access another organization\'s opportunity')

  const { rows } = await query(
    `SELECT m.id, m.student_id, m.score, m.strength, m.explanation, m.matching_skills, m.missing_skills,
            s.first_name, s.last_name, s.institution_name, s.location, s.course, s.verification_status
     FROM matches m JOIN students s ON s.id = m.student_id
     WHERE m.opportunity_id = $1 ORDER BY m.score DESC`,
    [req.params.id],
  )
  success(res, { opportunity: { id: opp.id, title: opp.title }, items: rows }, 'Match candidates loaded')
})

export const getMatch = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM matches WHERE id = $1', [req.params.id])
  const match = rows[0]
  if (!match) throw Errors.notFound('Match not found')
  if (String(match.company_id) !== String(req.user.companyId)) throw Errors.forbidden('Cannot access another organization\'s match')
  const student = await candidateRepo.findById(match.student_id)
  const apps = await query('SELECT * FROM applications WHERE opportunity_id = $1 AND student_id = $2', [match.opportunity_id, match.student_id])
  success(res, {
    ...match,
    candidate: {
      id: student.id, firstName: student.first_name, lastName: student.last_name,
      institutionName: student.institution_name, location: student.location, course: student.course,
      verificationStatus: student.verification_status, careerInterests: student.career_interests,
    },
    application: apps.rows[0] || null,
  }, 'Match loaded')
})

export const generateMatchExplanation = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM matches WHERE id = $1', [req.params.id])
  const match = rows[0]
  if (!match) throw Errors.notFound('Match not found')
  if (String(match.company_id) !== String(req.user.companyId)) throw Errors.forbidden('Cannot access another organization\'s match')
  const explanation = await explainMatch(match)
  await audit(req.user.id, req.user.companyId, 'MATCH_AI_EXPLANATION', 'match', match.id)
  success(res, { matchId: match.id, explanation, provider: 'gemini', model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' }, 'AI explanation generated')
})

export const shortlistFromMatch = asyncHandler(async (req, res) => {
  const match = (await query('SELECT * FROM matches WHERE id = $1', [req.params.id])).rows[0]
  if (!match) throw Errors.notFound('Match not found')
  if (String(match.company_id) !== String(req.user.companyId)) throw Errors.forbidden('Cannot access another organization\'s match')

  const existing = await query('SELECT * FROM applications WHERE opportunity_id = $1 AND student_id = $2', [match.opportunity_id, match.student_id])
  let application = existing.rows[0]
  if (!application) {
    application = await applicationRepo.create(match.opportunity_id, match.student_id, match.company_id)
  }
  const updated = await applicationRepo.updateStatus(application.id, 'SHORTLISTED', req.user.id, 'Shortlisted from AI match')
  await audit(req.user.id, req.user.companyId, 'CANDIDATE_SHORTLIST', 'application', application.id, { matchId: match.id })
  success(res, updated, 'Candidate shortlisted')
})
