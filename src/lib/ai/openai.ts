const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

type AIResearchInput = {
  companyName?: string | null
  website?: string | null
  contactName?: string | null
  email?: string | null
  jobTitle?: string | null
  industry?: string | null
  location?: string | null
}

type AIResearchOutput = {
  company_summary: string
  website_analysis: string
  pain_points: string[]
  recommended_offer: string
  lead_score: number
  lead_quality: 'hot' | 'warm' | 'cold'
  outreach_angle: string
  next_best_action: string
  confidence_score: number
}

type AIResult = {
  output: AIResearchOutput
  model: string
  promptTokens: number
  completionTokens: number
  latencyMs: number
}

const SYSTEM_PROMPT = `You are a B2B sales research assistant. Given information about a lead (company, contact, industry), produce a structured analysis to help a sales team prioritize and approach this lead.

Be concise, specific, and actionable. Base your analysis on the data provided — do not make up facts you don't have evidence for. If information is limited, acknowledge that and adjust your confidence score accordingly.

Respond with valid JSON matching this exact schema:
{
  "company_summary": "1-2 sentence summary of what the company likely does (max 280 chars)",
  "website_analysis": "Brief assessment of their web presence and what it signals (max 500 chars)",
  "pain_points": ["up to 3 likely pain points based on industry and role"],
  "recommended_offer": "What service/product angle would resonate (max 200 chars)",
  "lead_score": 0-100,
  "lead_quality": "hot | warm | cold",
  "outreach_angle": "How to approach this lead, referencing their specific situation (max 400 chars)",
  "next_best_action": "The single most important next step (max 200 chars)",
  "confidence_score": 0.0-1.0
}`

function buildUserPrompt(input: AIResearchInput): string {
  const parts: string[] = []
  if (input.companyName) parts.push(`Company: ${input.companyName}`)
  if (input.website) parts.push(`Website: ${input.website}`)
  if (input.contactName) parts.push(`Contact: ${input.contactName}`)
  if (input.email) parts.push(`Email: ${input.email}`)
  if (input.jobTitle) parts.push(`Job Title: ${input.jobTitle}`)
  if (input.industry) parts.push(`Industry: ${input.industry}`)
  if (input.location) parts.push(`Location: ${input.location}`)
  return parts.join('\n')
}

export async function runBasicResearch(input: AIResearchInput): Promise<AIResult> {
  return callOpenAI(input, 'gpt-4o-mini')
}

export async function runStandardResearch(input: AIResearchInput): Promise<AIResult> {
  return callOpenAI(input, 'gpt-4o')
}

async function callOpenAI(input: AIResearchInput, model: string): Promise<AIResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const start = Date.now()

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(input) },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  })

  const latencyMs = Date.now() - start

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenAI API error (${response.status}): ${err}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty response from OpenAI')

  const parsed = JSON.parse(content) as AIResearchOutput

  // Clamp values
  parsed.lead_score = Math.max(0, Math.min(100, parsed.lead_score))
  parsed.confidence_score = Math.max(0, Math.min(1, parsed.confidence_score))
  if (!['hot', 'warm', 'cold'].includes(parsed.lead_quality)) {
    parsed.lead_quality = parsed.lead_score >= 60 ? 'hot' : parsed.lead_score >= 35 ? 'warm' : 'cold'
  }

  return {
    output: parsed,
    model,
    promptTokens: data.usage?.prompt_tokens ?? 0,
    completionTokens: data.usage?.completion_tokens ?? 0,
    latencyMs,
  }
}

// Cost calculation in USD cents (approximate pricing)
export function estimateCostCents(model: string, promptTokens: number, completionTokens: number): number {
  if (model === 'gpt-4o-mini') {
    return (promptTokens * 0.00015 + completionTokens * 0.0006) / 10
  }
  if (model === 'gpt-4o') {
    return (promptTokens * 0.0025 + completionTokens * 0.01) / 10
  }
  return 0
}
