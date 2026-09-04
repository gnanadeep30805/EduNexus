import test from 'node:test'
import assert from 'node:assert/strict'
import { authService } from '../src/services/auth.service.js'
import { isGeminiConfigured, generateGeminiText } from '../src/services/gemini.service.js'

test('module roles are isolated', () => {
  assert.equal(authService.moduleMatches('student', 'STUDENT'), true)
  assert.equal(authService.moduleMatches('industry', 'RECRUITER'), true)
  assert.equal(authService.moduleMatches('academia', 'ACADEMIA'), true)
  assert.equal(authService.moduleMatches('student', 'RECRUITER'), false)
  assert.equal(authService.moduleMatches('academia', 'STUDENT'), false)
})

test('Gemini reports configuration state without fabricating output', async () => {
  if (isGeminiConfigured()) return
  await assert.rejects(generateGeminiText('test'), { code: 'SERVICE_UNAVAILABLE' })
})
