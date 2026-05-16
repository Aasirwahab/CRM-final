'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Sparkles, Mail, ArrowLeft, CheckCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'otp' | 'newPassword' | 'done'>('email')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const supabase = createClient()

  function handleOtpChange(index: number, value: string) {
    if (value.length > 1) value = value[value.length - 1]
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const newOtp = [...otp]
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || ''
    }
    setOtp(newOtp)
    const focusIndex = Math.min(pasted.length, 5)
    inputRefs.current[focusIndex]?.focus()
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setStep('otp')
    setLoading(false)
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit code')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'recovery',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setStep('newPassword')
    setLoading(false)
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setStep('done')
    setLoading(false)
  }

  async function handleResendOtp() {
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email)

    if (error) {
      setError(error.message)
    }
    setLoading(false)
  }

  if (step === 'done') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-8 shadow-lg">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
            <CheckCircle className="size-5 text-green-500" />
          </div>
          <h1 className="text-xl font-bold">Password updated</h1>
          <p className="text-sm text-muted-foreground">
            Your password has been reset successfully.
          </p>
          <Link
            href="/sign-in"
            className="flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  if (step === 'newPassword') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="size-3.5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">LeadFlow</span>
          </div>

          <div className="rounded-2xl border bg-card p-8 shadow-lg space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">Set new password</h1>
              <p className="text-sm text-muted-foreground">
                Enter your new password below
              </p>
            </div>

            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium">
                  New password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
                  className="flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  minLength={8}
                  className="flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'otp') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-sm space-y-6 rounded-2xl border bg-card p-8 shadow-lg">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Mail className="size-5 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold">Enter reset code</h1>
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code sent to <strong className="text-foreground">{email}</strong>
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  aria-label={`Digit ${i + 1} of 6`}
                  className="h-12 w-12 rounded-lg border bg-background text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              ))}
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify code'}
            </button>
          </form>

          <div className="flex items-center justify-between">
            <button
              onClick={() => { setStep('email'); setOtp(['', '', '', '', '', '']); setError(null) }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft className="size-3.5" />
              Back
            </button>
            <button
              onClick={handleResendOtp}
              disabled={loading}
              className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
            >
              Resend code
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="size-3.5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">LeadFlow</span>
        </div>

        <div className="rounded-2xl border bg-card p-8 shadow-lg space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Reset password</h1>
            <p className="text-sm text-muted-foreground">
              Enter your email and we&apos;ll send a reset code
            </p>
          </div>

          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send reset code'}
            </button>
          </form>

          <Link href="/sign-in" className="flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="size-3.5" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
