import { describe, it, expect } from 'vitest'
import { scoreLeadRule } from '../scoring'

describe('scoreLeadRule', () => {
  it('returns cold with score 0 for empty data', () => {
    const result = scoreLeadRule({})
    expect(result.score).toBe(0)
    expect(result.quality).toBe('cold')
    expect(result.reasons).toHaveLength(0)
  })

  it('gives +15 for email', () => {
    const result = scoreLeadRule({ email: 'test@gmail.com' })
    expect(result.score).toBe(15)
    expect(result.reasons).toContain('Has email')
  })

  it('gives +5 bonus for business email', () => {
    const result = scoreLeadRule({ email: 'test@acme.com' })
    expect(result.score).toBe(20) // 15 + 5
    expect(result.reasons).toContain('Business email domain')
  })

  it('does not give business email bonus for gmail', () => {
    const result = scoreLeadRule({ email: 'test@gmail.com' })
    expect(result.score).toBe(15)
    expect(result.reasons).not.toContain('Business email domain')
  })

  it('gives +10 for phone', () => {
    const result = scoreLeadRule({ phone: '+1234567890' })
    expect(result.score).toBe(10)
    expect(result.reasons).toContain('Has phone number')
  })

  it('gives +10 for website', () => {
    const result = scoreLeadRule({ website: 'https://acme.com' })
    expect(result.score).toBe(10)
    expect(result.reasons).toContain('Has website')
  })

  it('gives +10 for LinkedIn', () => {
    const result = scoreLeadRule({ linkedin_url: 'https://linkedin.com/in/test' })
    expect(result.score).toBe(10)
    expect(result.reasons).toContain('Has LinkedIn profile')
  })

  it('gives +10 for job title', () => {
    const result = scoreLeadRule({ job_title: 'Engineer' })
    expect(result.score).toBe(10)
    expect(result.reasons).toContain('Has job title')
  })

  it('gives +15 bonus for decision maker title', () => {
    const result = scoreLeadRule({ job_title: 'CEO' })
    expect(result.score).toBe(25) // 10 + 15
    expect(result.reasons).toContain('Decision maker title')
  })

  it('detects decision maker keywords case-insensitively', () => {
    const titles = ['ceo', 'CTO', 'Head of Sales', 'VP Engineering', 'Co-Founder']
    for (const title of titles) {
      const result = scoreLeadRule({ job_title: title })
      expect(result.reasons).toContain('Decision maker title')
    }
  })

  it('gives +10 for is_decision_maker flag', () => {
    const result = scoreLeadRule({ is_decision_maker: true })
    expect(result.score).toBe(10)
    expect(result.reasons).toContain('Marked as decision maker')
  })

  it('gives +5 for company name', () => {
    const result = scoreLeadRule({ company_name: 'Acme Inc' })
    expect(result.score).toBe(5)
  })

  it('gives +5 for industry', () => {
    const result = scoreLeadRule({ industry: 'SaaS' })
    expect(result.score).toBe(5)
  })

  it('gives +5 for location', () => {
    const result = scoreLeadRule({ location: 'New York' })
    expect(result.score).toBe(5)
  })

  it('classifies score >= 60 as hot', () => {
    // email(20) + phone(10) + website(10) + job_title(25=CEO) + company(5) = 70
    const result = scoreLeadRule({
      email: 'ceo@acme.com',
      phone: '+1234567890',
      website: 'https://acme.com',
      job_title: 'CEO',
      company_name: 'Acme',
    })
    expect(result.quality).toBe('hot')
    expect(result.score).toBeGreaterThanOrEqual(60)
  })

  it('classifies score 35-59 as warm', () => {
    // email(20) + phone(10) + company(5) = 35
    const result = scoreLeadRule({
      email: 'test@acme.com',
      phone: '+1234567890',
      company_name: 'Acme',
    })
    expect(result.quality).toBe('warm')
    expect(result.score).toBeGreaterThanOrEqual(35)
    expect(result.score).toBeLessThan(60)
  })

  it('classifies score < 35 as cold', () => {
    // phone(10) + company(5) = 15
    const result = scoreLeadRule({
      phone: '+1234567890',
      company_name: 'Acme',
    })
    expect(result.quality).toBe('cold')
    expect(result.score).toBeLessThan(35)
  })

  it('clamps score to 100 max', () => {
    // All fields: email(20) + phone(10) + website(10) + linkedin(10) + job_title(25) + dm(10) + company(5) + industry(5) + location(5) = 100
    const result = scoreLeadRule({
      email: 'ceo@acme.com',
      phone: '+1234567890',
      website: 'https://acme.com',
      linkedin_url: 'https://linkedin.com/in/ceo',
      job_title: 'CEO',
      is_decision_maker: true,
      company_name: 'Acme',
      industry: 'SaaS',
      location: 'SF',
    })
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('ignores null/undefined fields', () => {
    const result = scoreLeadRule({
      email: null,
      phone: undefined,
      website: null,
    })
    expect(result.score).toBe(0)
  })
})
