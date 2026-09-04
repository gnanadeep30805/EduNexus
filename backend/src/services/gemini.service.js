import { config } from '../config.js'
import { Errors } from '../utils/errors.js'

export function isGeminiConfigured() {
  return Boolean(config.geminiApiKey)
}

export async function generateGeminiText(prompt) {
  if (!isGeminiConfigured()) {
    throw Errors.serviceUnavailable('Gemini AI is not configured. Set GEMINI_API_KEY in backend/.env.')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), config.geminiTimeoutMs)
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.geminiModel)}:generateContent?key=${encodeURIComponent(config.geminiApiKey)}`
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(result.error?.message || `Gemini request failed with status ${response.status}`)
    const text = result.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim()
    if (!text) throw new Error('Gemini returned an empty response')
    return text
  } catch (error) {
    if (error.name === 'AbortError') throw Errors.serviceUnavailable('Gemini request timed out. Please try again.')
    if (error.code) throw error
    throw Errors.serviceUnavailable(`Gemini analysis unavailable: ${error.message}`)
  } finally {
    clearTimeout(timeout)
  }
}

export async function explainMatch(match) {
  const prompt = [
    'You are EduNexus skill intelligence assistant. Explain this candidate match for a human recruiter.',
    'Do not make a hiring decision. Do not infer protected attributes. Return concise plain text with: Match summary, Evidence, Strengths, Skill gaps, Review note.',
    `Match data: ${JSON.stringify({ score: match.score, strength: match.strength, explanation: match.explanation, matchingSkills: match.matching_skills, missingSkills: match.missing_skills })}`,
  ].join('\n')
  return generateGeminiText(prompt)
}
