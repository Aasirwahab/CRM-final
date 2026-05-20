'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Layers, Mail, ArrowLeft, CheckCircle, Lock, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

  // Common Layout Wrappers
  const layoutStyle = "relative flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0c0a12] p-6 text-slate-900 dark:text-zinc-100 font-sans"
  const orbStyle = "absolute top-1/3 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[100px]"
  const cardStyle = "w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-md dark:border-zinc-900/60 dark:bg-zinc-950/30 text-left"

  if (step === 'done') {
    return (
      <div className={layoutStyle}>
        <title>Success — LeadFlow CRM</title>
        <div className={orbStyle} />

        <div className={cardStyle}>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle className="size-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Password updated</h1>
            <p className="text-sm text-slate-500 dark:text-zinc-550 leading-relaxed">
              Your account password has been reset successfully. You can now use your new credentials to log in.
            </p>
          </div>
          <Link
            href="/sign-in"
            className="flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-650 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-650/10 transition-all hover:opacity-95"
          >
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  if (step === 'newPassword') {
    return (
      <div className={layoutStyle}>
        <title>Set Password — LeadFlow CRM</title>
        <div className={orbStyle} />

        <div className="w-full max-w-sm space-y-8">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md">
                <Layers className="size-4.5" />
              </div>
              <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 bg-clip-text text-transparent">
                LeadFlow
              </span>
            </Link>
          </div>

          <div className={cardStyle}>
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Set new password</h1>
              <p className="text-sm text-slate-500 dark:text-zinc-550 leading-relaxed">
                Please configure your new secure password credentials below.
              </p>
            </div>

            <form onSubmit={handleSetPassword} className="space-y-4">
              
              <div className="space-y-1.5">
                <label htmlFor="newPassword" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-550" />
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    required
                    minLength={8}
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white/70 pl-10 pr-4 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-950/20 placeholder:text-slate-400 dark:placeholder:text-zinc-650 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-550" />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    required
                    minLength={8}
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white/70 pl-10 pr-4 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-950/20 placeholder:text-slate-400 dark:placeholder:text-zinc-650 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-250 bg-rose-50/50 p-3 text-xs leading-relaxed text-rose-650 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-455">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-650 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-650/10 transition-all hover:opacity-95"
              >
                {loading ? 'Updating...' : 'Update password'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'otp') {
    return (
      <div className={layoutStyle}>
        <title>Reset Code — LeadFlow CRM</title>
        <div className={orbStyle} />

        <div className={cardStyle}>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-400">
            <Mail className="size-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Enter reset code</h1>
            <p className="text-sm text-slate-500 dark:text-zinc-550 leading-relaxed">
              We have sent a 6-digit recovery code to <strong className="text-slate-800 dark:text-zinc-200 font-bold">{email}</strong>. Enter it below to unlock password settings.
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="flex justify-between gap-2.5" onPaste={handleOtpPaste}>
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
                  className="h-12 w-12 rounded-xl border border-slate-200 bg-white text-center text-lg font-bold text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white transition-all shadow-sm"
                />
              ))}
            </div>

            {error && (
              <div className="rounded-xl border border-rose-250 bg-rose-50/50 p-3 text-xs leading-relaxed text-rose-650 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-455 animate-shake">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-650 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-650/10 transition-all hover:opacity-95"
            >
              {loading ? 'Verifying...' : 'Verify code'}
            </Button>
          </form>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-zinc-900/60">
            <button
              onClick={() => { setStep('email'); setOtp(['', '', '', '', '', '']); setError(null) }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-zinc-450 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Back
            </button>
            <button
              onClick={handleResendOtp}
              disabled={loading}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
            >
              Resend code
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={layoutStyle}>
      <title>Reset Password — LeadFlow CRM</title>
      <div className={orbStyle} />

      <div className="w-full max-w-sm space-y-8">
        <div className="flex items-center gap-2.5 justify-center">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md">
              <Layers className="size-4.5" />
            </div>
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 bg-clip-text text-transparent">
              LeadFlow
            </span>
          </Link>
        </div>

        <div className={cardStyle}>
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Reset password</h1>
            <p className="text-sm text-slate-500 dark:text-zinc-550 leading-relaxed">
              Enter your email below and we will send you a 6-digit verification code to reset your credentials.
            </p>
          </div>

          <form onSubmit={handleSendOtp} className="space-y-4">
            
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-550" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white/70 pl-10 pr-4 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-950/20 placeholder:text-slate-400 dark:placeholder:text-zinc-650 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-250 bg-rose-50/50 p-3 text-xs leading-relaxed text-rose-650 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-455 animate-shake">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-650 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-650/10 transition-all hover:opacity-95"
            >
              {loading ? 'Sending...' : 'Send reset code'}
            </Button>
          </form>

          <Link href="/sign-in" className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-zinc-450 dark:hover:text-white transition-colors">
            <ArrowLeft className="size-3.5" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
