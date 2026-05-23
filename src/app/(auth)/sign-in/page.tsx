'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowRight, Mail, Lock } from 'lucide-react'
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

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message === 'Invalid login credentials') {
        setError('Invalid email or password. If you recently signed up, make sure you verified your email.')
      } else if (error.message === 'Email not confirmed') {
        setError('Your email is not verified. Please check your inbox for the verification code.')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    window.location.href = '/dashboard'
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black font-[family-name:var(--font-inter)] text-white selection:bg-[#5ae14c]/30 flex flex-col justify-between">
      <title>Sign In — LeadFlow CRM</title>
      <VideoBackground />

      {/* Ambient glow overlays to blend the video background */}
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
        <div className="w-full max-w-[390px] rounded-2xl border border-white/10 bg-zinc-950/45 p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="font-[family-name:var(--font-fustat)] text-3xl font-extrabold tracking-tight text-white">
              Welcome back
            </h1>
            <p className="font-[family-name:var(--font-schibsted-grotesk)] text-xs text-white/50">
              Enter your credentials to sign in to your pipeline
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4 text-left">
            {/* Email Field */}
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

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="font-[family-name:var(--font-schibsted-grotesk)] text-[10px] font-bold uppercase tracking-wider text-white/60">
                  Password
                </label>
                <Link
                  href="/reset-password"
                  className="font-[family-name:var(--font-schibsted-grotesk)] text-[11px] font-medium text-[#5ae14c] hover:text-[#3fce32] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
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
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#5ae14c] px-4 text-sm font-bold text-[#0e1311] shadow-lg shadow-[#5ae14c]/10 hover:bg-[#3fce32] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <ArrowRight className="size-4" />}
            </Button>
          </form>

          <p className="text-center text-xs text-white/50">
            Don&apos;t have an account yet?{' '}
            <Link
              href="/sign-up"
              className="font-bold text-[#5ae14c] hover:text-[#3fce32] transition-colors"
            >
              Sign up free
            </Link>
          </p>
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
