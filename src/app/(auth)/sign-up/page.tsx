'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Layers, Mail, ArrowRight, ArrowLeft, ShieldCheck, User, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
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

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setOtpSent(true)
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
      type: 'signup',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    window.location.href = '/dashboard'
  }

  async function handleResendOtp() {
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    })

    if (error) {
      setError(error.message)
    }
    setLoading(false)
  }

  if (otpSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0c0a12] p-6 text-slate-900 dark:text-zinc-100 font-sans">
        <title>Verify Email — LeadFlow CRM</title>
        
        {/* Soft Background Orb */}
        <div className="absolute top-1/3 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[100px]" />

        <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-md dark:border-zinc-900/60 dark:bg-zinc-950/30 text-left">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-400">
            <Mail className="size-5" />
          </div>
          
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Verify your email</h1>
            <p className="text-sm text-slate-500 dark:text-zinc-550 leading-relaxed">
              We have sent a 6-digit verification code to <strong className="text-slate-800 dark:text-zinc-200 font-bold">{email}</strong>. Enter it below to activate your account.
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
              <div className="rounded-xl border border-rose-250 bg-rose-50/50 p-3 text-xs leading-relaxed text-rose-650 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-450 animate-shake">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-650 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-650/10 transition-all hover:opacity-95"
            >
              {loading ? 'Verifying...' : 'Verify account'}
            </Button>
          </form>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-zinc-900/60">
            <button
              onClick={() => { setOtpSent(false); setOtp(['', '', '', '', '', '']); setError(null) }}
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
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0c0a12] text-slate-900 dark:text-zinc-100 font-sans">
      <title>Sign Up — LeadFlow CRM</title>

      {/* Left panel */}
      <div className="relative hidden w-1/2 flex-col justify-between p-12 lg:flex overflow-hidden border-r border-slate-200/50 dark:border-zinc-850/20 bg-gradient-to-br from-[#0c0a12] via-[#120e24] to-[#0c0a12] text-white">
        {/* Soft Glow Orbs */}
        <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 -z-10 h-64 w-64 rounded-full bg-violet-600/15 blur-[120px]" />

        {/* Header Block */}
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-md">
              <Layers className="size-4.5" />
            </div>
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              LeadFlow
            </span>
          </Link>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[9px] font-bold text-indigo-400 border border-zinc-700/50">
            BETA
          </span>
        </div>

        {/* Feature block */}
        <div className="space-y-6 max-w-md text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-950/40 border border-indigo-900/30 px-3.5 py-1 text-xs font-medium text-indigo-300">
            <ShieldCheck className="size-3.5 text-indigo-400" />
            Free 14-day trial period
          </div>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
            Start closing deals <br />
            <span className="bg-gradient-to-r from-indigo-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
              faster with AI
            </span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            Create your workspace in seconds. Streamline contact records, configure automatic tasks, sync events directly to Google Meet calendars, and leverage Claude outreach scripts.
          </p>
        </div>

        {/* Footer block */}
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <p>&copy; {new Date().getFullYear()} LeadFlow CRM. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="relative flex flex-1 items-center justify-center p-8">
        {/* Mobile Background Orb */}
        <div className="absolute top-1/3 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-200/20 blur-[90px] dark:bg-indigo-950/10 lg:hidden" />

        <div className="w-full max-w-sm space-y-8">
          
          {/* Mobile logo */}
          <div className="flex items-center justify-between lg:hidden">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md">
                <Layers className="size-4.5" />
              </div>
              <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 bg-clip-text text-transparent">
                LeadFlow
              </span>
            </Link>
            <Link href="/" className="text-xs text-slate-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-white transition-colors">
              &larr; Back
            </Link>
          </div>

          <div className="space-y-2 text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Create account
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-500">
              Start managing leads with intelligence
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4 text-left">
            
            {/* Name Field */}
            <div className="space-y-1.5">
              <label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-550" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Smith"
                  required
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white/70 pl-10 pr-4 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-950/20 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Email Field */}
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
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white/70 pl-10 pr-4 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-950/20 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-550" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white/70 pl-10 pr-4 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-950/20 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-250 bg-rose-50/50 p-3 text-xs leading-relaxed text-rose-650 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-450">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-650 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-650/10 transition-all hover:opacity-95"
            >
              {loading ? 'Creating account...' : 'Create Account'}
              {!loading && <ArrowRight className="size-4" />}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 dark:text-zinc-500">
            Already have an account?{' '}
            <Link href="/sign-in" className="font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-305 transition-colors">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
