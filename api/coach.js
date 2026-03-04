const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b'
const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '')

const SYSTEM_PROMPT = [
  'You are an elite habit-performance coach.',
  'You receive detailed habit-tracking JSON, including trend and streak stats.',
  'Use only provided data; never invent events, metrics, or habit names.',
  'Coach like a real practitioner: diagnose patterns, root causes, and leverage points.',
  'Avoid generic motivation language.',
  'Every important claim must cite evidence with numbers and/or date windows from the payload.',
  'Return strict JSON with this exact shape:',
  '{',
  '  "summary": string,',
  '  "diagnosis": [',
  '    { "pattern": string, "evidence": string, "impact": string }',
  '  ],',
  '  "topHabits": [',
  '    { "habit": string, "reason": string, "focusScore": number }',
  '  ],',
  '  "ifThenSuggestions": [',
  '    { "habit": string, "cue": string, "action": string, "why": string }',
  '  ],',
  '  "fallbackPlans": [',
  '    { "habit": string, "minimumAction": string, "resetRule": string }',
  '  ],',
  '  "todayPlan": [',
  '    { "timeWindow": string, "step": string, "purpose": string }',
  '  ],',
  '  "weeklyExperiment": {',
  '    "name": string,',
  '    "hypothesis": string,',
  '    "execution": string,',
  '    "successMetric": string',
  '  }',
  '}',
  'Use exact habit names from the input when you reference habits.',
  'diagnosis must contain 3 items, each with strong evidence.',
  'topHabits and ifThenSuggestions must each contain 1-3 items.',
  'todayPlan must contain exactly 3 steps.',
  'ifThenSuggestions cues must be context-specific (time/place/trigger), not vague.',
  'impact must be a specific consequence sentence, not labels like "low" or "moderate".',
  'why must explain the behavior mechanism (friction reduction, cue consistency, or reward timing).',
  'todayPlan time windows must be chronological and realistic for one day.',
  'fallback resetRule must be compassionate and recovery-focused, never punitive.',
  'focusScore must be integer 1-10 where 10 is highest leverage for today.',
  'weeklyExperiment successMetric must be measurable within 7 days.',
  'Output only JSON.',
].join('\n')

function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

async function readJsonBody(req) {
  let raw = ''
  for await (const chunk of req) {
    raw += chunk
  }
  if (!raw) return {}
  return JSON.parse(raw)
}

function parseAssistantJson(text) {
  if (typeof text !== 'string') return null
  const trimmed = text.trim()
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  const cleaned = fenceMatch ? fenceMatch[1] : trimmed
  try {
    return JSON.parse(cleaned)
  } catch {
    return null
  }
}

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object') return 'Missing request body.'
  if (!Array.isArray(payload.habits) || payload.habits.length === 0) {
    return 'Request must include at least one habit.'
  }
  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed.' })
  }

  let payload
  try {
    payload = await readJsonBody(req)
  } catch {
    return sendJson(res, 400, { error: 'Invalid JSON body.' })
  }

  const validationError = validatePayload(payload)
  if (validationError) {
    return sendJson(res, 400, { error: validationError })
  }

  try {
    const prompt = `${SYSTEM_PROMPT}\n\nUser habit data JSON:\n${JSON.stringify(payload)}`
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        prompt,
        stream: false,
        format: 'json',
        options: {
          temperature: 0.25,
        },
      }),
    })

    const raw = await response.json()
    if (!response.ok) {
      const isMissingModel = typeof raw?.error === 'string' && raw.error.toLowerCase().includes('not found')
      const message = isMissingModel
        ? `${raw.error}. Run: ollama pull ${DEFAULT_MODEL}`
        : raw?.error || 'Ollama request failed.'
      return sendJson(res, response.status, { error: message })
    }

    const content = raw?.response
    const insight = parseAssistantJson(content)
    if (!insight) {
      return sendJson(res, 502, {
        error: 'AI response could not be parsed as JSON.',
      })
    }

    return sendJson(res, 200, { insight })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    const isConnRefused =
      msg.includes('ECONNREFUSED') ||
      msg.includes('fetch failed') ||
      msg.toLowerCase().includes('connect')
    if (isConnRefused) {
      return sendJson(res, 500, {
        error: `Could not reach Ollama at ${OLLAMA_BASE_URL}. Start Ollama and ensure the server is running.`,
      })
    }
    return sendJson(res, 500, {
      error: 'Failed to generate AI coaching advice.',
    })
  }
}
