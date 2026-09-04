import { asyncHandler, success } from '../utils/api.js'
import { Errors } from '../utils/errors.js'
import { companyRepo, getCompanyMembers } from '../repositories/company.repository.js'
import { audit } from '../services/audit.service.js'

export const getCompany = asyncHandler(async (req, res) => {
  const companyId = req.params.id || req.user.companyId
  const company = await companyRepo.findById(companyId)
  if (!company) throw Errors.notFound('Company not found')
  if (req.user.companyId && String(company.id) !== String(req.user.companyId)) {
    throw Errors.forbidden('You can only view your own organization')
  }
  const members = await getCompanyMembers(company.id)
  success(res, { ...company, members }, 'Company loaded')
})

export const updateCompany = asyncHandler(async (req, res) => {
  const companyId = req.params.id || req.user.companyId
  if (String(companyId) !== String(req.user.companyId)) throw Errors.forbidden('Cannot modify another organization')
  const body = req.body || {}
  const company = await companyRepo.update(companyId, body)
  await audit(req.user.id, companyId, 'COMPANY_UPDATE', 'company', companyId)
  success(res, company, 'Company updated')
})

export const listCompanyMembers = asyncHandler(async (req, res) => {
  const members = await getCompanyMembers(req.user.companyId)
  success(res, members, 'Members loaded')
})
