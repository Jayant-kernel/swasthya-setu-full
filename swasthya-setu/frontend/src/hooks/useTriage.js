import { useState, useCallback } from 'react'
import { openai, getTriageSystemPrompt } from '../lib/openai'

export function useTriage() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const runTriage = useCallback(async (symptomText, district) => {
    if (!symptomText || !district) {
      setError('Symptom text and district are required.')
      return null
    }

    // Reject gibberish: must have at least 3 real words (4+ chars each)
    const words = symptomText.trim().split(/\s+/)
    const realWords = words.filter(w => /^[a-zA-Z]{3,}$/.test(w))
    if (symptomText.trim().length < 10 || realWords.length < 2) {
      setError('Please describe the symptoms clearly (e.g. "fever for 3 days, joint pain").')
      return null
    }

    // Reject if too many consecutive consonants — likely keyboard mashing
    if (/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{5,}/.test(symptomText)) {
      setError('Symptoms description does not look valid. Please type real symptoms.')
      return null
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: getTriageSystemPrompt(district),
          },
          {
            role: 'user',
            content: `Patient symptoms: ${symptomText}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 300,
      })

      const raw = response.choices[0]?.message?.content?.trim()

      if (!raw) {
        throw new Error('Empty response from AI model.')
      }

      // Strip markdown code fences if present
      const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      const parsed = JSON.parse(cleaned)

      // Validate shape
      if (
        !parsed.severity ||
        !Array.isArray(parsed.symptoms) ||
        typeof parsed.sickle_cell_risk !== 'boolean' ||
        !parsed.brief
      ) {
        throw new Error('Unexpected response format from AI model.')
      }

      setResult(parsed)
      return parsed
    } catch (err) {
      const msg =
        err?.message || 'Failed to analyze symptoms. Please try again.'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { result, loading, error, runTriage }
}
