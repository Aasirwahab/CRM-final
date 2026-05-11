type LeadData = {
  email?: string | null
  phone?: string | null
  website?: string | null
  job_title?: string | null
  linkedin_url?: string | null
  industry?: string | null
  location?: string | null
  is_decision_maker?: boolean
  company_name?: string | null
}

type ScoreResult = {
  score: number
  quality: 'hot' | 'warm' | 'cold'
  reasons: string[]
}

const DECISION_MAKER_KEYWORDS = [
  'ceo', 'cto', 'cfo', 'coo', 'cmo', 'founder', 'co-founder',
  'owner', 'president', 'director', 'vp', 'vice president',
  'head of', 'chief', 'partner', 'managing',
]

export function scoreLeadRule(data: LeadData): ScoreResult {
  let score = 0
  const reasons: string[] = []

  // Has email (+15)
  if (data.email) {
    score += 15
    reasons.push('Has email')
    // Business email vs free email (+5)
    const freeProviders = ['gmail', 'yahoo', 'hotmail', 'outlook', 'aol', 'icloud']
    const domain = data.email.split('@')[1]?.toLowerCase() ?? ''
    if (domain && !freeProviders.some(p => domain.includes(p))) {
      score += 5
      reasons.push('Business email domain')
    }
  }

  // Has phone (+10)
  if (data.phone) {
    score += 10
    reasons.push('Has phone number')
  }

  // Has website (+10)
  if (data.website) {
    score += 10
    reasons.push('Has website')
  }

  // Has LinkedIn (+10)
  if (data.linkedin_url) {
    score += 10
    reasons.push('Has LinkedIn profile')
  }

  // Has job title (+10)
  if (data.job_title) {
    score += 10
    reasons.push('Has job title')

    // Decision maker title (+15)
    const titleLower = data.job_title.toLowerCase()
    if (DECISION_MAKER_KEYWORDS.some(k => titleLower.includes(k))) {
      score += 15
      reasons.push('Decision maker title')
    }
  }

  // Is decision maker flag (+10)
  if (data.is_decision_maker) {
    score += 10
    reasons.push('Marked as decision maker')
  }

  // Has company name (+5)
  if (data.company_name) {
    score += 5
    reasons.push('Has company name')
  }

  // Has industry (+5)
  if (data.industry) {
    score += 5
    reasons.push('Has industry data')
  }

  // Has location (+5)
  if (data.location) {
    score += 5
    reasons.push('Has location data')
  }

  // Clamp to 0-100
  score = Math.min(100, Math.max(0, score))

  // Determine quality
  let quality: 'hot' | 'warm' | 'cold'
  if (score >= 60) {
    quality = 'hot'
  } else if (score >= 35) {
    quality = 'warm'
  } else {
    quality = 'cold'
  }

  return { score, quality, reasons }
}
