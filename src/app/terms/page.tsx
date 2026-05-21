"use client"

import React, { useState } from "react"
import Link from "next/link"
import { 
  FileText, 
  Info, 
  UserPlus, 
  ShieldAlert, 
  Database, 
  Brain, 
  Link2,
  Server, 
  CreditCard, 
  LogOut, 
  Scale, 
  Bell, 
  Mail,
  Menu,
  X,
  ArrowRight,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-900/60 dark:bg-zinc-950/30 transition-all hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
          <Icon className="h-5 w-5 text-indigo-650 dark:text-indigo-400" />
        </div>
        <h2 className="text-base font-bold text-slate-800 dark:text-zinc-200 m-0">{title}</h2>
      </div>
      <div className="mt-4 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed space-y-3">{children}</div>
    </div>
  )
}

export default function TermsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 dark:bg-[#0c0a12] dark:text-zinc-100">
      <title>Terms of Service — LeadFlow CRM</title>

      {/* 1. Transparent Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-slate-50/80 backdrop-blur-md dark:border-zinc-800/40 dark:bg-[#0c0a12]/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Logo iconSize={30} textSize="text-lg" />
            </Link>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-400">
              BETA
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-zinc-400">
            <Link href="/#how-it-works" className="hover:text-indigo-650 dark:hover:text-white transition-colors">How it Works</Link>
            <Link href="/#ai-playground" className="hover:text-indigo-650 dark:hover:text-white transition-colors">Interactive AI</Link>
            <Link href="/#roi-calculator" className="hover:text-indigo-650 dark:hover:text-white transition-colors">ROI Calculator</Link>
            <Link href="/#security" className="hover:text-indigo-650 dark:hover:text-white transition-colors">Security</Link>
            <Link href="/#faq" className="hover:text-indigo-650 dark:hover:text-white transition-colors">FAQ</Link>
          </nav>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-slate-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-white transition-colors">
              Sign in
            </Link>
            <Link href="/sign-up">
              <Button size="lg" className="rounded-full bg-[#1b172b] px-6 text-white hover:bg-[#25203d] dark:bg-indigo-600 dark:hover:bg-indigo-700">
                Launch App
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-900 md:hidden"
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 md:hidden dark:border-zinc-800 dark:bg-[#0c0a12]">
            <nav className="flex flex-col gap-4 text-sm font-medium text-slate-600 dark:text-zinc-400">
              <Link href="/#how-it-works" onClick={() => setMobileMenuOpen(false)} className="hover:text-indigo-650 dark:hover:text-white">How it Works</Link>
              <Link href="/#ai-playground" onClick={() => setMobileMenuOpen(false)} className="hover:text-indigo-650 dark:hover:text-white">Interactive AI</Link>
              <Link href="/#roi-calculator" onClick={() => setMobileMenuOpen(false)} className="hover:text-indigo-650 dark:hover:text-white">ROI Calculator</Link>
              <Link href="/#security" onClick={() => setMobileMenuOpen(false)} className="hover:text-indigo-650 dark:hover:text-white">Security</Link>
              <Link href="/#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-indigo-650 dark:hover:text-white">FAQ</Link>
              <div className="h-px bg-slate-200 my-2 dark:bg-zinc-800" />
              <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)} className="hover:text-indigo-650 dark:hover:text-white">Sign in</Link>
              <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full rounded-full bg-[#1b172b] text-white hover:bg-[#25203d] dark:bg-indigo-600">
                  Launch App
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content Area with Ambient Background Orbs */}
      <main className="relative overflow-hidden py-16 lg:py-24">
        {/* Soft Ambient Background Orbs */}
        <div className="absolute top-1/4 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-200/40 blur-[100px] dark:bg-indigo-950/20" />
        <div className="absolute top-1/3 right-10 -z-10 h-64 w-64 rounded-full bg-violet-200/30 blur-[80px] dark:bg-purple-950/10" />

        <div className="mx-auto max-w-4xl px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 no-underline hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            &larr; Back to Home
          </Link>

          <div className="mt-8 mb-12 text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-100/80 px-4 py-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-900/40 dark:text-indigo-300">
              <FileText className="h-3.5 w-3.5 fill-indigo-700/10 dark:fill-indigo-300/10" />
              Terms of Service
            </div>
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-5xl text-slate-900 dark:text-white">
              Terms of Service
            </h1>
            <p className="mt-3 text-sm text-slate-500 dark:text-zinc-500">
              Last updated: May 12, 2026
            </p>
          </div>

          <div className="space-y-6 text-left">
            <Section icon={Info} title="Acceptance of Terms">
              <p>
                By accessing or using LeadFlow CRM (&quot;the Service&quot;), you agree to be bound by these
                Terms of Service. If you do not agree, do not use the Service.
              </p>
            </Section>

            <Section icon={Info} title="Description of Service">
              <p>
                LeadFlow CRM is a multi-tenant AI-powered sales CRM that provides lead management,
                pipeline tracking, AI research, CSV import, task management, deal tracking,
                project management, and booking page features with Google Calendar integration.
              </p>
            </Section>

            <Section icon={UserPlus} title="Account Registration">
              <ul className="list-none p-0 m-0 space-y-2">
                {[
                  "You must provide accurate and complete registration information",
                  "You are responsible for maintaining the security of your account credentials",
                  "You must be at least 18 years old to use the Service",
                  "One person or organization may not maintain multiple free accounts",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-650 dark:bg-indigo-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section icon={ShieldAlert} title="Acceptable Use Policy">
              <p>You agree <strong className="text-slate-800 dark:text-white font-semibold">not</strong> to:</p>
              <ul className="list-none p-0 m-0 space-y-2">
                {[
                  "Use the Service for any illegal or unauthorized purpose",
                  "Upload malicious files, spam content, or data that violates others' privacy",
                  "Attempt to bypass rate limits, security measures, or access controls",
                  "Reverse engineer, decompile, or disassemble the Service",
                  "Use the AI features to generate harmful, misleading, or abusive content",
                  "Scrape or bulk-extract data from the Service",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section icon={Database} title="Data Ownership">
              <p>
                You <strong className="text-slate-800 dark:text-white font-semibold">retain ownership</strong> of all data you upload
                to the Service (leads, contacts, notes, files). We do not claim ownership of your data.
                You grant us a limited license to process your data solely for providing the Service.
              </p>
            </Section>

            <Section icon={Brain} title="AI Features & Usage Limits">
              <ul className="list-none p-0 m-0 space-y-2">
                {[
                  "AI research results are generated by third-party models and may contain inaccuracies",
                  "AI features are subject to daily usage caps based on platform load and limits",
                  "You are responsible for verifying AI-generated insights before acting on them",
                  "We are not liable for decisions made based on AI-generated content",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-650 dark:bg-indigo-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section icon={Link2} title="Third-Party Integrations">
              <p>
                The Service integrates with third-party services including Google Calendar. By connecting
                your Google account, you authorize LeadFlow CRM to access your calendar availability and
                create events on your behalf for the purpose of managing bookings.
              </p>
              <div className="rounded-lg bg-indigo-50/50 border border-indigo-100 p-3 text-[11px] leading-relaxed dark:bg-indigo-950/20 dark:border-indigo-900/30">
                You may revoke this access at any time from Settings. Our use of Google user data
                complies with the{' '}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-650 hover:text-indigo-705 dark:text-indigo-450 underline font-semibold"
                >
                  Google API Services User Data Policy
                </a>
                . See our{' '}
                <Link href="/privacy" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-350 underline">
                  Privacy Policy
                </Link>{' '}
                for full details.
              </div>
            </Section>

            <Section icon={Server} title="Service Availability & SLAs">
              <p>
                We strive for high availability but do not guarantee uninterrupted service. We may
                perform scheduled maintenance with advance notice. We are not liable for downtime
                caused by factors beyond our control.
              </p>
            </Section>

            <Section icon={CreditCard} title="Billing & Plans">
              <p>
                The free tier includes limited features and usage caps. Billing terms are specified at the time of upgrading your account limits. Refunds are handled on a case-by-case basis through support.
              </p>
            </Section>

            <Section icon={LogOut} title="Termination of Service">
              <p>
                We may suspend or terminate your account if you violate these terms. You may delete
                your account at any time from Settings. Upon termination, your data will be permanently deleted
                within 90 days.
              </p>
            </Section>

            <Section icon={Scale} title="Limitation of Liability">
              <p>
                The Service is provided &quot;as is&quot; without warranties of any kind. We are not liable for
                any indirect, incidental, or consequential damages arising from your use of the Service.
                Our total liability is limited to the amount paid to us in the 12 months prior to the claim.
              </p>
            </Section>

            <Section icon={Bell} title="Changes to Terms">
              <p>
                We may update these terms from time to time. Continued use of the Service after changes
                constitutes acceptance of the new terms.
              </p>
            </Section>

            <Section icon={Mail} title="Contact & Legal inquiries">
              <p>
                For questions about these terms, contact us at{' '}
                <a href="mailto:webvoxelstudio.uk@gmail.com" className="text-indigo-650 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-355 underline font-semibold">
                  webvoxelstudio.uk@gmail.com
                </a>
              </p>
            </Section>
          </div>
        </div>
      </main>

      {/* 9. Premium Footer */}
      <footer className="border-t border-slate-200 bg-white py-16 dark:border-zinc-900/60 dark:bg-[#0c0a12]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
            
            {/* Column 1: Brand Info */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-2.5">
                <Logo iconSize={24} textSize="text-base" />
                <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[8px] font-bold text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-400">
                  BETA
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-500 leading-relaxed max-w-sm text-left">
                AI-powered sales CRM designed to process high-volume CSV exports, enrich contact intelligence using Claude, and secure databases with enterprise RLS.
              </p>
              <div className="flex items-center gap-4 text-slate-400 dark:text-zinc-650">
                <Link href="#" className="hover:text-indigo-650 dark:hover:text-white transition-colors">
                  <svg className="size-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </Link>
                <Link href="#" className="hover:text-indigo-650 dark:hover:text-white transition-colors">
                  <svg className="size-4 fill-current" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                </Link>
                <Link href="#" className="hover:text-indigo-650 dark:hover:text-white transition-colors">
                  <svg className="size-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </Link>
              </div>
            </div>

            {/* Column 2: Product */}
            <div className="lg:col-span-2 space-y-3.5 text-left">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-300">Product</h4>
              <ul className="space-y-2 text-xs text-slate-500 dark:text-zinc-550">
                <li><Link href="/#how-it-works" className="hover:text-indigo-650 dark:hover:text-white transition-colors">How it Works</Link></li>
                <li><Link href="/#ai-playground" className="hover:text-indigo-650 dark:hover:text-white transition-colors">Interactive AI</Link></li>
                <li><Link href="/#roi-calculator" className="hover:text-indigo-650 dark:hover:text-white transition-colors">ROI Calculator</Link></li>
                <li><Link href="/#security" className="hover:text-indigo-650 dark:hover:text-white transition-colors">Security Stack</Link></li>
              </ul>
            </div>

            {/* Column 3: Company */}
            <div className="lg:col-span-2 space-y-3.5 text-left">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-300">Company</h4>
              <ul className="space-y-2 text-xs text-slate-500 dark:text-zinc-550">
                <li><Link href="#" className="hover:text-indigo-650 dark:hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-indigo-650 dark:hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-indigo-650 dark:hover:text-white transition-colors">Press Kit</Link></li>
                <li><Link href="#" className="hover:text-indigo-650 dark:hover:text-white transition-colors">Customers</Link></li>
              </ul>
            </div>

            {/* Column 4: Resources */}
            <div className="lg:col-span-2 space-y-3.5 text-left">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-300">Resources</h4>
              <ul className="space-y-2 text-xs text-slate-500 dark:text-zinc-550">
                <li><Link href="#" className="hover:text-indigo-650 dark:hover:text-white transition-colors">Developer Docs</Link></li>
                <li><Link href="#" className="hover:text-indigo-650 dark:hover:text-white transition-colors">API Reference</Link></li>
                <li><Link href="#" className="hover:text-indigo-650 dark:hover:text-white transition-colors">Trigger Status</Link></li>
                <li><Link href="#" className="hover:text-indigo-650 dark:hover:text-white transition-colors">Security Trust</Link></li>
              </ul>
            </div>

            {/* Column 5: Newsletter/Subscribe */}
            <div className="lg:col-span-2 space-y-3.5 text-left">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-300">Stay Updated</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed dark:text-zinc-555">
                Subscribe to receive pipeline blueprints and product upgrades.
              </p>
              <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-1.5">
                <input 
                  type="email" 
                  placeholder="name@email.com" 
                  className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-2 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900/40"
                  required
                />
                <button 
                  type="submit"
                  className="rounded-md bg-indigo-600 p-2 text-white hover:bg-indigo-700 transition-colors"
                >
                  <ArrowRight className="size-3" />
                </button>
              </form>
            </div>

          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 dark:border-zinc-900/60">
            <p className="text-[11px] text-slate-400 dark:text-zinc-650">
              © {new Date().getFullYear()} LeadFlow Inc. All rights reserved.
            </p>
            <div className="flex gap-6 text-[11px] text-slate-500 dark:text-zinc-500">
              <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
              <Link href="/terms" className="hover:underline">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
