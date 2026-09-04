import { asyncHandler, success } from '../utils/api.js'
import { analyticsRepo } from '../repositories/analytics.repository.js'

export const getDashboard = asyncHandler(async (req, res) => {
  const data = await analyticsRepo.dashboard(req.user.companyId)
  const topSkills = await analyticsRepo.skillDemand(req.user.companyId)
  const skillGaps = await analyticsRepo.skillGaps(req.user.companyId)
  const funnel = await analyticsRepo.funnel(req.user.companyId)
  success(res, {
    ...data,
    topRequiredSkills: topSkills.slice(0, 6),
    skillGaps: skillGaps.slice(0, 6),
    funnel,
  }, 'Dashboard loaded')
})

export const getAnalytics = asyncHandler(async (req, res) => {
  const [demand, gaps, funnel, appsByOpp, skillDist, matchStats] = await Promise.all([
    analyticsRepo.skillDemand(req.user.companyId),
    analyticsRepo.skillGaps(req.user.companyId),
    analyticsRepo.funnel(req.user.companyId),
    analyticsRepo.applicationsByOpportunity(req.user.companyId),
    analyticsRepo.candidateSkillDistribution(req.user.companyId),
    analyticsRepo.matchStats(req.user.companyId),
  ])
  success(res, { demand, gaps, funnel, applicationsByOpportunity: appsByOpp, candidateSkills: skillDist, matches: matchStats }, 'Analytics loaded')
})