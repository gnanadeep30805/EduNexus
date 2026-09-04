import { asyncHandler, success } from '../utils/api.js'
import { Errors } from '../utils/errors.js'
import { candidateRepo } from '../repositories/candidate.repository.js'

export const searchCandidates = asyncHandler(async (req, res) => {
  const { search, location, level, interests, available, verified, page = 1, pageSize = 10, sort, skillIds } = req.query
  const list = await candidateRepo.list({
    search, location,
    skillIds: skillIds ? (Array.isArray(skillIds) ? skillIds : [skillIds]) : [],
    interests: interests ? (Array.isArray(interests) ? interests : [interests]) : [],
    available, verified,
    page: Number(page), pageSize: Number(pageSize), sort,
  })
  success(res, list, 'Candidates found')
})

export const getCandidate = asyncHandler(async (req, res) => {
  const student = await candidateRepo.findById(req.params.id)
  if (!student) throw Errors.notFound('Candidate not found')
  if (!student.consent_public_visibility) throw Errors.forbidden('This candidate has not consented to public visibility')

  const skills = await candidateRepo.getSkills(student.id)
  const skillIds = skills.map((s) => s.id)
  const evidence = await candidateRepo.getEvidence(skillIds)

  const skillsWithEvidence = skills.map((s) => ({
    id: s.id, name: s.name, category: s.category, selfLevel: s.self_level,
    verifiedLevel: s.verified_level, yearsExperience: s.years_experience,
    evidence: evidence[s.id] || [],
    hasEvidence: !!(evidence[s.id] || []).length,
  }))

  const [projects, certifications, education, experience] = await Promise.all([
    candidateRepo.getProjects(student.id),
    candidateRepo.getCertifications(student.id),
    candidateRepo.getEducation(student.id),
    candidateRepo.getExperience(student.id),
  ])

  success(res, {
    id: student.id,
    firstName: student.first_name, lastName: student.last_name,
    institutionName: student.institution_name, course: student.course,
    graduationYear: student.graduation_year, location: student.location, bio: student.bio,
    careerInterests: student.career_interests, verificationStatus: student.verification_status,
    internshipAvailability: student.internship_availability, portfolioUrl: student.portfolio_url,
    skills: skillsWithEvidence, projects, certifications, education, experience,
  }, 'Candidate loaded')
})
