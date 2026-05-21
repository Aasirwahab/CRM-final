'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'

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
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0c0a12] text-slate-900 dark:text-zinc-100 font-sans">
      <title>Sign In — LeadFlow CRM</title>

      {/* Left panel - branding */}
      <div className="relative hidden w-1/2 flex-col justify-between p-12 lg:flex overflow-hidden border-r border-slate-200/50 dark:border-zinc-850/20 bg-gradient-to-br from-[#0c0a12] via-[#120e24] to-[#0c0a12] text-white">
        {/* Soft Glow Orbs */}
        <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 -z-10 h-64 w-64 rounded-full bg-violet-600/15 blur-[120px]" />

        {/* Header Block */}
        <div className="flex items-center gap-2.5">
          <Link href="/" className="dark flex items-center gap-2.5">
            <Logo iconSize={30} textSize="text-lg" />
          </Link>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[9px] font-bold text-indigo-400 border border-zinc-700/50">
            BETA
          </span>
        </div>

        {/* Feature/Value block */}
        <div className="space-y-6 max-w-md text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-950/40 border border-indigo-900/30 px-3.5 py-1 text-xs font-medium text-indigo-300">
            <ShieldCheck className="size-3.5 text-indigo-400" />
            Enterprise-grade RLS Security
          </div>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
            Your AI-powered <br />
            <span className="bg-gradient-to-r from-indigo-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
              sales CRM pipeline
            </span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            Import leads from CSV spreadsheets, analyze them using Claude model integrations, track pipelines dynamically, and let automation handles customer intelligence outreach.
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

      {/* Right panel - form */}
      <div className="relative flex flex-1 items-center justify-center p-8">
        {/* Mobile Background Orb */}
        <div className="absolute top-1/3 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-200/20 blur-[90px] dark:bg-indigo-950/10 lg:hidden" />

        <div className="w-full max-w-sm space-y-8">
          
          {/* Mobile logo */}
          <div className="flex items-center justify-between lg:hidden">
            <Link href="/">
              <Logo iconSize={30} textSize="text-lg" />
            </Link>
            <Link href="/" className="text-xs text-slate-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-white transition-colors">
              &larr; Back
            </Link>
          </div>

          <div className="space-y-2 text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Welcome back
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-500">
              Enter your organization credentials to sign in
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-5 text-left">
            
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
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                  Password
                </label>
                <Link href="/reset-password" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-550" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white/70 pl-10 pr-4 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-950/20 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-xs leading-relaxed text-rose-600 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-450 animate-shake">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-650 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-650/10 transition-all hover:opacity-95 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <ArrowRight className="size-4" />}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 dark:text-zinc-500">
            Don&apos;t have an account yet?{' '}
            <Link href="/sign-up" className="font-bold text-indigo-600 hover:text-indigo-705 dark:text-indigo-400 dark:hover:text-indigo-350 transition-colors">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
