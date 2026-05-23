'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'

const VIDEO_SRC = "/hf_20260329_050842_be71947f-f16e-4a14-810c-06e83d23ddb5.mp4"
const SKIP_TAIL_SECONDS = 0.55

function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onTimeUpdate = () => {
      if (
        Number.isFinite(video.duration) &&
        video.duration - video.currentTime <= SKIP_TAIL_SECONDS
      ) {
        video.currentTime = 0
      }
    }

    const tryPlay = () => {
      video.play().catch(() => {
        // Autoplay may be blocked by browser policy — silent fallback
      })
    }

    video.addEventListener("timeupdate", onTimeUpdate)

    if (video.readyState >= 2) {
      tryPlay()
    } else {
      video.addEventListener("canplay", tryPlay, { once: true })
    }

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate)
      video.removeEventListener("canplay", tryPlay)
    }
  }, [])

  return (
    <video
      ref={videoRef}
      src={VIDEO_SRC}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full object-cover"
    />
  )
}

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

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black font-[family-name:var(--font-inter)] text-white selection:bg-[#5ae14c]/30 flex flex-col justify-between">
      <title>
        {step === 'email' && 'Reset Password — LeadFlow CRM'}
        {step === 'otp' && 'Reset Code — LeadFlow CRM'}
        {step === 'newPassword' && 'Set Password — LeadFlow CRM'}
        {step === 'done' && 'Success — LeadFlow CRM'}
      </title>
      <VideoBackground />

      {/* Ambient overlay */}
      <div className="absolute inset-0 z-[2] bg-gradient-to-b from-black/50 via-transparent to-black/85 pointer-events-none" />
      <div className="absolute inset-0 z-[2] bg-black/40 pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-[3] flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo iconSize={30} textSize="text-lg" textColor="text-white" theme="green" />
          </Link>
          <span className="rounded-full bg-[#5ae14c]/10 px-2 py-0.5 text-[9px] font-bold text-[#5ae14c] border border-[#5ae14c]/20">
            BETA
          </span>
        </div>
        <Link
          href="/"
          className="rounded-full border border-white/10 bg-black/30 px-4 py-1.5 text-xs font-semibold tracking-[-0.2px] text-white/80 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white"
        >
          &larr; Back to Site
        </Link>
      </header>

      {/* Center card section */}
      <main className="relative z-[3] flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-[390px] rounded-2xl border border-white/10 bg-zinc-950/45 p-8 shadow-2xl backdrop-blur-xl space-y-6 text-left">
          {step === 'done' && (
            <div className="space-y-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5ae14c]/10 text-[#5ae14c] border border-[#5ae14c]/20">
                <CheckCircle className="size-5" />
              </div>
              <div className="space-y-2">
                <h1 className="font-[family-name:var(--font-fustat)] text-2xl font-extrabold tracking-tight text-white">Password updated</h1>
                <p className="text-xs text-white/50 leading-relaxed">
                  Your account password has been reset successfully. You can now use your new credentials to log in.
                </p>
              </div>
              <Link
                href="/sign-in"
                className="flex h-11 w-full items-center justify-center rounded-xl bg-[#5ae14c] px-4 text-sm font-bold text-[#0e1311] shadow-lg shadow-[#5ae14c]/10 hover:bg-[#3fce32] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                Sign In
              </Link>
            </div>
          )}

          {step === 'newPassword' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="font-[family-name:var(--font-fustat)] text-2xl font-extrabold tracking-tight text-white">Set new password</h1>
                <p className="text-xs text-white/50 leading-relaxed">
                  Configure your new secure password credentials below.
                </p>
              </div>

              <form onSubmit={handleSetPassword} className="space-y-4">
                {/* Password field */}
                <div className="space-y-1.5">
                  <label htmlFor="newPassword" className="font-[family-name:var(--font-schibsted-grotesk)] text-[10px] font-bold uppercase tracking-wider text-white/60">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      required
                      minLength={8}
                      className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-[#5ae14c] focus:outline-none focus:ring-1 focus:ring-[#5ae14c] transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Confirm password field */}
                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="font-[family-name:var(--font-schibsted-grotesk)] text-[10px] font-bold uppercase tracking-wider text-white/60">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      required
                      minLength={8}
                      className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-[#5ae14c] focus:outline-none focus:ring-1 focus:ring-[#5ae14c] transition-all duration-200"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs leading-relaxed text-rose-300">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#5ae14c] px-4 text-sm font-bold text-[#0e1311] shadow-lg shadow-[#5ae14c]/10 hover:bg-[#3fce32] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5ae14c]/10 text-[#5ae14c] border border-[#5ae14c]/20">
                <Mail className="size-5" />
              </div>
              <div className="space-y-2">
                <h1 className="font-[family-name:var(--font-fustat)] text-2xl font-extrabold tracking-tight text-white">Enter reset code</h1>
                <p className="text-xs text-white/50 leading-relaxed">
                  We sent a 6-digit recovery code to <strong className="text-white font-bold">{email}</strong>. Enter it below to unlock password settings.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
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
                      className="h-11 w-11 rounded-xl border border-white/10 bg-white/5 text-center text-lg font-bold text-white focus:border-[#5ae14c] focus:outline-none focus:ring-1 focus:ring-[#5ae14c] transition-all"
                    />
                  ))}
                </div>

                {error && (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs leading-relaxed text-rose-300 animate-shake">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#5ae14c] px-4 text-sm font-bold text-[#0e1311] shadow-lg shadow-[#5ae14c]/10 hover:bg-[#3fce32] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </Button>
              </form>

              <div className="flex items-center justify-between border-t border-white/5 pt-4">
                <button
                  onClick={() => { setStep('email'); setOtp(['', '', '', '', '', '']); setError(null) }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white/50 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="size-3.5" />
                  Back
                </button>
                <button
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-xs font-bold text-[#5ae14c] hover:text-[#3fce32] transition-colors cursor-pointer"
                >
                  Resend code
                </button>
              </div>
            </div>
          )}

          {step === 'email' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="font-[family-name:var(--font-fustat)] text-2xl font-extrabold tracking-tight text-white font-[family-name:var(--font-fustat)]">Reset password</h1>
                <p className="text-xs text-white/50 leading-relaxed">
                  Enter your email below and we will send you a 6-digit verification code to reset your credentials.
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="font-[family-name:var(--font-schibsted-grotesk)] text-[10px] font-bold uppercase tracking-wider text-white/60">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-[#5ae14c] focus:outline-none focus:ring-1 focus:ring-[#5ae14c] transition-all duration-200"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs leading-relaxed text-rose-300 animate-shake">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#5ae14c] px-4 text-sm font-bold text-[#0e1311] shadow-lg shadow-[#5ae14c]/10 hover:bg-[#3fce32] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                >
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </Button>
              </form>

              <div className="pt-2 border-t border-white/5 flex justify-center">
                <Link href="/sign-in" className="flex items-center gap-1.5 text-xs font-bold text-white/50 hover:text-white transition-colors">
                  <ArrowLeft className="size-3.5" />
                  Back to sign in
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-[3] flex flex-col sm:flex-row items-center justify-between px-6 py-6 md:px-12 text-xs text-white/45 gap-2 border-t border-white/5 bg-black/20 backdrop-blur-sm">
        <p>&copy; {new Date().getFullYear()} LeadFlow CRM. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
        </div>
      </footer>
    </div>
  )
}
