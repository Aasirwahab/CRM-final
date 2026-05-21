"use client"

import React, { useState } from "react"
import Link from "next/link"
import { 
  ArrowRight, 
  Upload, 
  Shield, 
  Cpu, 
  UserCheck, 
  Database, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Zap, 
  Activity, 
  Menu, 
  X,
  Sparkles,
  Calendar,
  Video,
  Layers
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Logo } from "@/components/ui/logo"
import { PipelineSimulator } from "@/components/ui/pipeline-simulator"

// Metric Pop animation helper
const AnimatedMetric = ({ value, prefix = "", suffix = "" }: { value: string | number, prefix?: string, suffix?: string }) => {
  return (
    <motion.span
      key={value}
      initial={{ scale: 1.15, opacity: 0.8 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="inline-block"
    >
      {prefix}{value}{suffix}
    </motion.span>
  )
}


export default function HomePage() {
  // Mobile Nav Toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // AI Playground States
  const [activeTier, setActiveTier] = useState<"basic" | "standard" | "deep">("standard")
  const [copiedText, setCopiedText] = useState(false)

  // ROI Calculator States
  const [leadVolume, setLeadVolume] = useState(1000)
  const [dealValue, setDealValue] = useState(5000)

  // FAQ Accordion States
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Booking Showcase States
  const [selectedDate, setSelectedDate] = useState<string>("May 21")
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [bookingName, setBookingName] = useState("")
  const [bookingEmail, setBookingEmail] = useState("")
  const [bookingConfirmed, setBookingConfirmed] = useState(false)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  // Copy Outreach Message
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(true)
    setTimeout(() => setCopiedText(false), 2000)
  }

  // ROI Calculations
  const hoursSaved = Math.round((leadVolume * 15) / 60) // 15 mins saved per lead
  const conversionRateLift = 1.8 // Conservative 1.8% conversion lift
  const extraDeals = Math.round(leadVolume * (conversionRateLift / 100))
  const extraRevenue = extraDeals * dealValue

  // Simulated AI Research Output Data
  const aiTiersData = {
    basic: {
      model: "Claude 4.5 Haiku",
      cost: "~$0.001 per lead",
      speed: "< 2 seconds",
      companyName: "Apex Logistics Solutions",
      summary: "Mid-sized third-party logistics (3PL) provider specializing in refrigerated freight and last-mile cold chain storage.",
      industry: "Logistics & Supply Chain",
      score: "62/100 (Warm)",
      painPoints: [
        "Inefficient route planning leading to driver idle time.",
        "Manual temperature reporting for refrigerated assets."
      ],
      recommendation: "Pitch our cold-chain temperature monitoring module.",
      outreachMessage: "Hi, I noticed Apex specializes in temperature-controlled transport. Many 3PL firms experience up to 12% food spoilage due to manual reporting gaps. We help automate this—would you be open to a quick chat?"
    },
    standard: {
      model: "Claude 4.6 Sonnet",
      cost: "~$0.01 per lead",
      speed: "< 5 seconds",
      companyName: "Apex Logistics Solutions",
      summary: "Leading regional 3PL logistics provider based in Chicago, IL. Operates 5 cold-storage warehouses and runs a fleet of 150 refrigerated trucks. Experiencing high driver turnover and rising insurance costs.",
      industry: "Cold Chain Logistics",
      score: "84/100 (Hot)",
      painPoints: [
        "Manual temperature compliance logging takes 4 hours per trip.",
        "Driver compliance friction leading to high truck-turnover rates.",
        "Lack of API integrations with modern TMS software (MercuryGate)."
      ],
      recommendation: "Present our MercuryGate integration and emphasize automated compliance. Emphasize saving 4 hours of paperwork per trip.",
      outreachMessage: "Subject: Streamlining MercuryGate compliance for Apex\n\nHi Apex Team, I saw you operate cold chain fleets out of Chicago. Many firms struggle with the 4 hours of paperwork required per trip for temperature compliance. LeadFlow integrates directly with MercuryGate to automate this logs filing in real-time, reducing compliance friction. Worth a quick look?"
    },
    deep: {
      model: "Claude 4.6 Sonnet + Web Tools",
      cost: "~$0.05 per lead",
      speed: "< 15 seconds",
      companyName: "Apex Logistics Solutions",
      summary: "Apex Logistics recently expanded their cold storage footprint in Dallas, TX. Public job postings reveal they are actively hiring a 'Director of Supply Chain Integration' to modernize their TMS interfaces. They currently use legacy LogiTech middleware which has documented downtime issues.",
      industry: "Cold Chain Infrastructure",
      score: "95/100 (Very Hot)",
      painPoints: [
        "Legacy LogiTech middleware causes API dropouts, disrupting driver dispatch.",
        "Dallas cold storage facility running at 92% capacity, requiring optimization.",
        "Direct competitor (Lineage Logistics) recently gained regional market share due to faster EDI onboarding."
      ],
      recommendation: "Focus on replacement of LogiTech middleware. Reach out to the Supply Chain VP about our sub-100ms EDI pipeline and API availability. Present case study of 45% faster client onboarding.",
      outreachMessage: "Subject: Replacing LogiTech middleware at Apex\n\nHi Marcus,\n\nI noticed Apex recently expanded into Dallas and is modernizing its supply chain integration stacks. \n\nIf you're still experiencing the API dropouts typical of legacy LogiTech middleware, it might be bottlenecking your new facility's capacity. LeadFlow replaces LogiTech with sub-100ms EDI pipelines, onboarding new shippers 45% faster than legacy setups. \n\nI've compiled a short technical blueprint of how we did this for ColdLink. Can I send it over?\n\nBest,\n[Your Name]"
    }
  }

  // FAQ Data
  const faqs = [
    {
      q: "How does the CSV import pipeline handle large files?",
      a: "Our pipeline is designed for production scale. Uploaded CSVs are stored in private Supabase Storage buckets, and parsed using Trigger.dev v3 background workers in chunks of 100 rows. This prevents API timeouts and allows you to upload files up to 100MB containing over 50,000 leads easily."
    },
    {
      q: "What mechanisms prevent data formula injections?",
      a: "To prevent CSV Formula Injection attacks (which exploit Excel/Google Sheets execution), LeadFlow automatically sanitizes all cell inputs starting with symbols like '=', '+', '-', and '@' by prefixing them with a single quote before database insertion."
    },
    {
      q: "How does the duplicate detection algorithm work?",
      a: "Our multi-tiered deduplication scans incoming records against existing contacts. It checks for exact matching on lowercase email, website domains, and phone numbers. For company names, we use PostgreSQL pg_trgm fuzzy trigram matching to find similar companies above an 80% confidence threshold."
    },
    {
      q: "Are the Claude prompt tokens cached to save cost?",
      a: "Yes. We leverage Anthropic's Prompt Caching API. Since the detailed system prompt and extraction instructions remain identical during a batch import, caching reduces input token expenses by up to 90% and cuts response latency in half."
    },
    {
      q: "Can we set strict spending limits on AI spending?",
      a: "Absolutely. LeadFlow allows organization owners to enforce a daily AI cap (e.g., $10/day). Every AI call is logged in our cost tracker, and calls are instantly blocked once the threshold is crossed, triggering email warnings to the administrator."
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 dark:bg-[#0c0a12] dark:text-zinc-100 overflow-x-hidden">
      
      {/* 1. Transparent Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-slate-50/80 backdrop-blur-md dark:border-zinc-800/40 dark:bg-[#0c0a12]/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Logo iconSize={30} textSize="text-lg" />
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              BETA
            </span>
          </div>

          {/* Desktop Nav */}
          <motion.nav 
            className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-zinc-400"
            initial="initial"
            animate="animate"
            variants={{
              initial: { opacity: 0 },
              animate: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05
                }
              }
            }}
          >
            {[
              { label: "How it Works", href: "#how-it-works" },
              { label: "Interactive AI", href: "#ai-playground" },
              { label: "ROI Calculator", href: "#roi-calculator" },
              { label: "Meeting Booking", href: "#booking-showcase" },
              { label: "Security", href: "#security" },
              { label: "FAQ", href: "#faq" }
            ].map((link) => (
              <motion.div
                key={link.label}
                variants={{
                  initial: { opacity: 0, y: -8 },
                  animate: { opacity: 1, y: 0 }
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <Link href={link.href} className="relative group py-1 hover:text-indigo-650 dark:hover:text-white transition-colors">
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-550 to-violet-555 transition-all duration-300 group-hover:w-full" />
                </Link>
              </motion.div>
            ))}
          </motion.nav>

          {/* CTAs */}
          <motion.div 
            className="hidden md:flex items-center gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            <Link href="/sign-in" className="text-sm font-medium text-slate-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-white transition-colors">
              Sign in
            </Link>
            <Link href="/sign-up">
              <Button size="lg" className="rounded-full bg-[#1b172b] px-6 text-white hover:bg-[#25203d] dark:bg-indigo-600 dark:hover:bg-indigo-700 shadow-md shadow-indigo-500/10">
                Launch App
              </Button>
            </Link>
          </motion.div>

          {/* Mobile menu button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-900 md:hidden"
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>

        {/* Mobile menu panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              className="border-b border-slate-200 bg-slate-50 px-6 py-4 md:hidden dark:border-zinc-800 dark:bg-[#0c0a12]"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <nav className="flex flex-col gap-4 text-sm font-medium text-slate-600 dark:text-zinc-400">
                <Link href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="hover:text-indigo-600 dark:hover:text-white">How it Works</Link>
                <Link href="#ai-playground" onClick={() => setMobileMenuOpen(false)} className="hover:text-indigo-600 dark:hover:text-white">Interactive AI</Link>
                <Link href="#roi-calculator" onClick={() => setMobileMenuOpen(false)} className="hover:text-indigo-600 dark:hover:text-white">ROI Calculator</Link>
                <Link href="#booking-showcase" onClick={() => setMobileMenuOpen(false)} className="hover:text-indigo-600 dark:hover:text-white">Meeting Booking</Link>
                <Link href="#security" onClick={() => setMobileMenuOpen(false)} className="hover:text-indigo-600 dark:hover:text-white">Security</Link>
                <Link href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-indigo-600 dark:hover:text-white">FAQ</Link>
                <div className="h-px bg-slate-200 my-2 dark:bg-zinc-800" />
                <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)} className="hover:text-indigo-600 dark:hover:text-white">Sign in</Link>
                <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full rounded-full bg-[#1b172b] text-white hover:bg-[#25203d] dark:bg-indigo-600">
                    Launch App
                  </Button>
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>      {/* 2. Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Soft Ambient Background Orbs */}
        <motion.div 
          className="absolute top-1/4 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-200/40 blur-[100px] dark:bg-indigo-950/20"
          animate={{
            x: ["-50%", "-40%", "-60%", "-50%"],
            y: [0, 20, -15, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute top-1/3 right-10 -z-10 h-64 w-64 rounded-full bg-violet-200/30 blur-[80px] dark:bg-purple-950/10"
          animate={{
            x: [0, -30, 20, 0],
            y: [0, -20, 30, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <div className="mx-auto max-w-5xl px-6 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.15
                }
              }
            }}
            className="flex flex-col items-center"
          >
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-100/80 px-4 py-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-900/40 dark:text-indigo-300"
            >
              <Sparkles className="size-3.5 fill-indigo-700/10 dark:fill-indigo-300/10" />
              AI-Powered Multi-Tenant CRM
            </motion.div>
            
            <motion.h1 
              variants={{ hidden: { opacity: 0, y: 25 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 text-4xl font-extrabold tracking-tight sm:text-6xl text-slate-900 dark:text-white"
            >
              Where Leads Grow
            </motion.h1>
            
            <motion.p 
              variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.8 }}
              className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-zinc-400"
            >
              Ditch manual enrichment. Upload raw lead exports, deduplicate contacts using fuzzy matching, and trigger automated Claude research with built-in cost guardrails.
            </motion.p>

            <motion.div 
              variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.8 }}
              className="mt-10 flex flex-wrap justify-center gap-4"
            >
              <Link href="/sign-up">
                <Button size="lg" className="rounded-full bg-[#1b172b] px-8 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-[#25203d] dark:bg-indigo-600 dark:hover:bg-indigo-700">
                  Try it now <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline" size="lg" className="rounded-full px-8 text-sm font-semibold border-slate-300 dark:border-zinc-800">
                  Sign In
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Premium UI Mockup Card with Border-Tracing & Floating stats */}
          <motion.div 
            className="relative mt-16 sm:mt-24 overflow-hidden rounded-2xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Border-tracing glowing effect */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-2xl z-20" fill="none">
              <rect
                width="100%"
                height="100%"
                rx="16"
                className="stroke-[2] stroke-indigo-500/25 dark:stroke-indigo-400/20"
                style={{
                  strokeDasharray: "1000",
                }}
              />
              <motion.rect
                width="100%"
                height="100%"
                rx="16"
                className="stroke-[2.5] stroke-indigo-600 dark:stroke-violet-500"
                style={{
                  strokeDasharray: "250 750",
                }}
                animate={{
                  strokeDashoffset: [0, -1000],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </svg>

            {/* Floating stats badges on the sides */}
            <motion.div 
              className="absolute lg:-left-20 xl:-left-28 top-16 z-30 hidden lg:flex items-center gap-3 rounded-2xl bg-white/95 border border-slate-200/80 p-3.5 shadow-xl dark:bg-zinc-900/95 dark:border-zinc-800"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-455">
                <Zap className="size-4.5" />
              </div>
              <div className="text-left text-xs">
                <p className="font-bold text-slate-800 dark:text-zinc-200">Queue Speed</p>
                <p className="text-slate-500 dark:text-zinc-500 font-mono text-[10px]">100 leads / sec</p>
              </div>
            </motion.div>

            <motion.div 
              className="absolute lg:-right-20 xl:-right-28 bottom-20 z-30 hidden lg:flex items-center gap-3 rounded-2xl bg-white/95 border border-slate-200/80 p-3.5 shadow-xl dark:bg-zinc-900/95 dark:border-zinc-800"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-400">
                <DollarSign className="size-4.5" />
              </div>
              <div className="text-left text-xs">
                <p className="font-bold text-slate-800 dark:text-zinc-200">Cost Saved</p>
                <p className="text-slate-500 dark:text-zinc-500 font-mono text-[10px]">89.4% Cached Tokens</p>
              </div>
            </motion.div>

            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-zinc-800/80 dark:bg-zinc-950/50">
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:p-6 dark:border-zinc-900/60 dark:bg-zinc-950/20">
                
                {/* Mockup Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-zinc-800/60">
                  <div className="flex items-center gap-3">
                    <Activity className="size-5 text-indigo-600" />
                    <div className="text-left">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Active Import Batch</h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-500">export_apollo_leads_q2.csv</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Trigger.dev queue active
                    </span>
                    <span className="text-xs font-mono text-slate-500 dark:text-zinc-500">Org Cap: $20.00 max</span>
                  </div>
                </div>

                {/* Mockup Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-b border-slate-200 dark:border-zinc-800/60">
                  <div className="text-left p-3 rounded-lg bg-white border border-slate-200/60 dark:bg-zinc-900/40 dark:border-zinc-800/30">
                    <p className="text-xs font-medium text-slate-500 dark:text-zinc-500">Total Streamed</p>
                    <p className="text-xl font-bold mt-1">4,812 rows</p>
                  </div>
                  <div className="text-left p-3 rounded-lg bg-white border border-slate-200/60 dark:bg-zinc-900/40 dark:border-zinc-800/30">
                    <p className="text-xs font-medium text-slate-500 dark:text-zinc-500">Fuzzy Duplicates Skipped</p>
                    <p className="text-xl font-bold mt-1 text-indigo-600">312 contacts</p>
                  </div>
                  <div className="text-left p-3 rounded-lg bg-white border border-slate-200/60 dark:bg-zinc-900/40 dark:border-zinc-800/30">
                    <p className="text-xs font-medium text-slate-500 dark:text-zinc-500">AI Tokens Cached</p>
                    <p className="text-xl font-bold mt-1 text-emerald-600">89.4% saved</p>
                  </div>
                  <div className="text-left p-3 rounded-lg bg-white border border-slate-200/60 dark:bg-zinc-900/40 dark:border-zinc-800/30">
                    <p className="text-xs font-medium text-slate-500 dark:text-zinc-500">Lead Scoring Engine</p>
                    <p className="text-xl font-bold mt-1">HNSW Index</p>
                  </div>
                </div>

                {/* Mockup Database List Preview */}
                <div className="pt-4 space-y-3">
                  <p className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Recent Enriched Leads</p>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-white/70 border border-slate-100 hover:bg-white dark:bg-zinc-900/20 dark:border-zinc-850 dark:hover:bg-zinc-900/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-rose-500" />
                      <div className="text-left">
                        <span className="text-sm font-semibold">Stark Industries</span>
                        <span className="text-xs text-slate-400 dark:text-zinc-500 block">Energy & Power</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                      <span className="text-xs bg-rose-50 border border-rose-100 px-2 py-0.5 rounded text-rose-700 font-semibold dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400">
                        95/100 · HOT
                      </span>
                      <span className="text-xs text-slate-400 dark:text-zinc-500">Claude Deep Research Completed</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-white/70 border border-slate-100 hover:bg-white dark:bg-zinc-900/20 dark:border-zinc-850 dark:hover:bg-zinc-900/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                      <div className="text-left">
                        <span className="text-sm font-semibold">Oscorp Enterprises</span>
                        <span className="text-xs text-slate-400 dark:text-zinc-500 block">Bio-Tech & Pharma</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                      <span className="text-xs bg-amber-50 border border-amber-100 px-2 py-0.5 rounded text-amber-700 font-semibold dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400">
                        72/100 · WARM
                      </span>
                      <span className="text-xs text-slate-400 dark:text-zinc-500">Claude Standard Research Completed</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-white/70 border border-slate-100 hover:bg-white dark:bg-zinc-900/20 dark:border-zinc-850 dark:hover:bg-zinc-900/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <div className="text-left">
                        <span className="text-sm font-semibold">Wayne Enterprises</span>
                        <span className="text-xs text-slate-400 dark:text-zinc-500 block">Defense & Aviation</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                      <span className="text-xs bg-blue-50 border border-blue-100 px-2 py-0.5 rounded text-blue-700 font-semibold dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-400">
                        45/100 · COLD
                      </span>
                      <span className="text-xs text-slate-400 dark:text-zinc-500">Basic Research Completed</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. The Process Section */}
      <section id="how-it-works" className="border-t border-slate-200 py-24 dark:border-zinc-900">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            
            {/* Left Side: Text + Visual Ingestion Pipe Mockup */}
            <div className="lg:col-span-5 flex flex-col justify-center gap-6">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block mb-2 dark:text-indigo-400">
                  The Ingestion Pipeline
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                  How LeadFlow Works
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                  LeadFlow orchestrates automated, multi-tiered pipeline workers in the background. It cleans data, drops duplicates, enriches details, and scores quality without blocking your main application loop.
                </p>
              </div>
              {/* Interactive Ingestion Flow Graphic */}
              <PipelineSimulator />

              <div className="hidden lg:block">
                <Link href="/sign-up" className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                  Try the import wizard <ArrowRight className="ml-1 size-3.5" />
                </Link>
              </div>
            </div>

            {/* Right Side: Re-designed Premium Cards */}
            <motion.div 
              className="lg:col-span-7 flex flex-col gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
            >
              
              {/* Card 1 */}
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
                }}
                className="group relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-zinc-900 dark:bg-zinc-950/50"
              >
                <div className="absolute top-6 right-6 text-sm font-mono font-bold text-slate-300 dark:text-zinc-800">
                  01
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                    <Upload className="size-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200">Secure Ingestion & Validation</h3>
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed max-w-xl">
                      CSVs are direct-uploaded securely to private storage buckets via temporary signed URLs. Our streaming validators inspect schemas, protect against malicious Excel formula execution, and save custom mapping presets.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Card 2 */}
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
                }}
                className="group relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-zinc-900 dark:bg-zinc-950/50"
              >
                <div className="absolute top-6 right-6 text-sm font-mono font-bold text-slate-300 dark:text-zinc-800">
                  02
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                    <Layers className="size-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200">Trigram Deduplication</h3>
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed max-w-xl">
                      Keep your records clean. LeadFlow filters imports against current leads via multi-column exact checks (email, phone, domain) and runs Postgres `pg_trgm` fuzzy matching to drop duplicate companies.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Card 3 */}
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
                }}
                className="group relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-zinc-900 dark:bg-zinc-950/50"
              >
                <div className="absolute top-6 right-6 text-sm font-mono font-bold text-slate-300 dark:text-zinc-800">
                  03
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                    <Cpu className="size-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200">Rule-Based Immediate Scoring</h3>
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed max-w-xl">
                      Before consuming AI credits, our rule engine instantly scopes contacts based on title authority, company size, and region, scoring quality levels (Hot, Warm, Cold) so you can prioritize outreach dynamically.
                    </p>
                  </div>
                </div>
              </motion.div>

            </motion.div>

          </div>
        </div>
      </section>

      {/* 4. Interactive AI Research Playground */}
      <section id="ai-playground" className="border-t border-slate-200 bg-slate-100/30 py-20 dark:border-zinc-900 dark:bg-[#0c0a12]/20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Claude-Powered Enrichment
            </h2>
            <p className="mt-4 text-slate-600 dark:text-zinc-400 text-sm">
              Toggle the research tiers below to see the quality of enrichment generated by Anthropic's state-of-the-art models.
            </p>
          </div>

          <div className="mt-10 flex justify-center gap-2 rounded-full bg-slate-200/50 p-1 dark:bg-zinc-900/60 max-w-md mx-auto">
            {(["basic", "standard", "deep"] as const).map((tier) => {
              const label = tier === "basic" ? "Basic Research" : tier === "standard" ? "Standard" : "Deep Research"
              const isActive = activeTier === tier
              return (
                <button
                  key={tier}
                  onClick={() => setActiveTier(tier)}
                  className="relative flex-1 rounded-full py-2 text-xs font-semibold transition-colors duration-200 text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-sans cursor-pointer"
                >
                  {isActive && (
                    <motion.span
                      layoutId="activePlaygroundTab"
                      className="absolute inset-0 rounded-full bg-white shadow-sm dark:bg-zinc-800"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className={`relative z-10 ${isActive ? "text-indigo-600 dark:text-white" : ""}`}>
                    {label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Playground Interface */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTier}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-md dark:border-zinc-900 dark:bg-zinc-950/60"
            >
              <div className="flex flex-col md:flex-row gap-6 justify-between border-b border-slate-200 pb-6 dark:border-zinc-900">
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wide">Target Company</span>
                  </div>
                  <h3 className="text-lg font-bold">{aiTiersData[activeTier].companyName}</h3>
                  <span className="inline-block rounded-md bg-indigo-50 border border-indigo-100/60 px-2 py-0.5 text-xs font-medium text-indigo-650 dark:bg-indigo-950/30 dark:border-indigo-900/20 dark:text-indigo-400">
                    {aiTiersData[activeTier].industry}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-6 text-left">
                  <div>
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">LLM Engine</span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{aiTiersData[activeTier].model}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">Avg. Cost</span>
                    <span className="text-xs font-bold">{aiTiersData[activeTier].cost}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">Enriched In</span>
                    <span className="text-xs font-bold">{aiTiersData[activeTier].speed}</span>
                  </div>
                </div>
              </div>

              {/* Research Report Visual fields */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                <div className="lg:col-span-7 space-y-5">
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-400 dark:text-zinc-500 tracking-wider">AI Analysis Summary</h4>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-zinc-300">
                      {aiTiersData[activeTier].summary}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-400 dark:text-zinc-500 tracking-wider">Scoring Category</h4>
                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-100 border px-3 py-1 text-xs font-bold dark:bg-zinc-900 dark:border-zinc-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      {aiTiersData[activeTier].score}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-400 dark:text-zinc-550 tracking-wider">Detected Friction & Pain Points</h4>
                    <ul className="mt-2 space-y-2">
                      {aiTiersData[activeTier].painPoints.map((point, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-slate-600 dark:text-zinc-400">
                          <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-400 dark:text-zinc-550 tracking-wider">Recommended Action</h4>
                    <p className="mt-2 text-sm text-slate-700 dark:text-zinc-300 italic">
                      "{aiTiersData[activeTier].recommendation}"
                    </p>
                  </div>
                </div>

                {/* Outreach message panel */}
                <div className="lg:col-span-5 bg-slate-50 border border-slate-200/50 p-4 rounded-xl flex flex-col justify-between dark:bg-zinc-900/30 dark:border-zinc-850">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3 dark:border-zinc-900">
                      <span className="text-xs font-bold uppercase text-slate-500 dark:text-zinc-400">Outreach Message Draft</span>
                      <button 
                        onClick={() => handleCopy(aiTiersData[activeTier].outreachMessage)}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-650 dark:text-zinc-500 dark:hover:text-white transition-colors"
                      >
                        {copiedText ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                        {copiedText ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-zinc-300">
                      {aiTiersData[activeTier].outreachMessage}
                    </pre>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-zinc-900">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 leading-normal block">
                      *Message generated using organization templates linked to current research parameters.
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* 5. Interactive ROI & Business Impact Calculator */}
      <section id="roi-calculator" className="border-t border-slate-200 py-20 dark:border-zinc-900">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold tracking-tight">
              AI Sales impact Calculator
            </h2>
            <p className="mt-4 text-slate-600 dark:text-zinc-400 text-sm leading-relaxed">
              Find out how much manual research overhead you can cut and the extra revenue potential you can unlock with automated pipelines.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Input Side */}
            <div className="lg:col-span-7 bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between dark:border-zinc-900 dark:bg-zinc-950/40">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <label className="text-sm font-bold text-slate-800 dark:text-zinc-200">Monthly Lead Volume</label>
                    <span className="text-lg font-mono font-bold text-indigo-600 dark:text-indigo-400">{leadVolume.toLocaleString()} leads</span>
                  </div>
                  <input 
                    type="range" 
                    min="100" 
                    max="10000" 
                    step="100"
                    value={leadVolume}
                    onChange={(e) => setLeadVolume(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-800"
                  />
                  <div className="flex justify-between text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
                    <span>100</span>
                    <span>5,000</span>
                    <span>10,000</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <label className="text-sm font-bold text-slate-800 dark:text-zinc-200">Average Closed Deal Value</label>
                    <span className="text-lg font-mono font-bold text-indigo-600 dark:text-indigo-400">${dealValue.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" 
                    min="500" 
                    max="50000" 
                    step="500"
                    value={dealValue}
                    onChange={(e) => setDealValue(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-800"
                  />
                  <div className="flex justify-between text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
                    <span>$500</span>
                    <span>$25,000</span>
                    <span>$50,000</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-slate-200 pt-4 dark:border-zinc-900">
                <p className="text-xs text-slate-500 dark:text-zinc-500 leading-normal">
                  *Calculations assume 15 minutes of manual validation saved per lead, and a conservative conversion lift of 1.8% from structured outreach recommendations.
                </p>
              </div>
            </div>

            {/* Results Card (Premium Violet/Dark container) */}
            <div className="lg:col-span-5 rounded-2xl bg-[#0f0b1a] text-white p-6 flex flex-col justify-between relative overflow-hidden border border-violet-950/20">
              {/* Background radial glow */}
              <div className="absolute -top-1/4 -right-1/4 w-48 h-48 rounded-full bg-violet-600/20 blur-[60px]" />
              
              <div>
                <h3 className="text-xs font-bold text-violet-400 uppercase tracking-widest">Monthly Estimated Value</h3>
                
                <div className="mt-8 space-y-6">
                  {/* Revenue lift */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-950/60 border border-violet-850 text-indigo-400">
                      <DollarSign className="size-6" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-zinc-400 block tracking-wide">Incremental Revenue</span>
                      <span className="text-2xl font-bold text-white tracking-tight">
                        <AnimatedMetric value={extraRevenue.toLocaleString()} prefix="$" />
                      </span>
                    </div>
                  </div>

                  {/* Hours saved */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-950/60 border border-violet-850 text-indigo-400">
                      <Clock className="size-6" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-zinc-400 block tracking-wide">Research Time Saved</span>
                      <span className="text-xl font-bold text-white tracking-tight">
                        <AnimatedMetric value={hoursSaved.toLocaleString()} suffix=" hours" />
                      </span>
                    </div>
                  </div>

                  {/* Deals conversion */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-950/60 border border-violet-850 text-indigo-400">
                      <TrendingUp className="size-6" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-zinc-400 block tracking-wide">Extra Closed Deals</span>
                      <span className="text-xl font-bold text-white tracking-tight">
                        <AnimatedMetric value={extraDeals} prefix="+" suffix=" deals" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-violet-900/40">
                <Link href="/sign-up" className="w-full">
                  <Button className="w-full rounded-full bg-indigo-600 py-6 text-white font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-600/20">
                    Unlock This Growth Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5.5. Google Calendar Meeting Booking Section */}
      <section id="booking-showcase" className="border-t border-slate-200 py-20 dark:border-zinc-900 bg-slate-100/30 dark:bg-[#0c0a12]/20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Copy & Details */}
            <div className="lg:col-span-6 text-left space-y-6">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block mb-2 dark:text-indigo-400">
                  Automated Scheduling
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                  Built-in Booking Pages & Calendar Sync
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                  Stop playing email tag. LeadFlow generates secure, customizable public booking links directly integrated with your Google Calendar availability.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-400">
                    <Calendar className="size-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Real-time OAuth Availability</h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                      Securely sync with your Google account. LeadFlow checks your busy slots dynamically and presents only open slots on your public page, ensuring zero double-bookings.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-400">
                    <Video className="size-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Google Meet Link Creation</h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                      Every confirmed booking automatically generates a calendar event with a distinct Google Meet conference video URL and sends invites to both parties.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-400">
                    <Shield className="size-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Privacy & Security isolated</h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                      Our integration is restricted to check free/busy metrics. We never read or store event descriptions, lists of attendees, or private emails of other calendar bookings.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link href="/sign-up">
                  <Button size="lg" className="rounded-full bg-[#1b172b] px-6 text-white hover:bg-[#25203d] dark:bg-indigo-600 dark:hover:bg-indigo-700">
                    Get Your Booking Link
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column: Interactive Booking Widget Mockup */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg dark:border-zinc-900 dark:bg-zinc-950/70 text-left relative overflow-hidden">
                
                {/* Simulated Header block */}
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4 dark:border-zinc-900">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-550 to-violet-555 flex items-center justify-center text-white text-xs font-bold font-mono">
                    LF
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">LeadFlow Product Demo</h3>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500">30 min • Video Meeting via Google Meet</p>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {!bookingConfirmed ? (
                    <motion.div 
                      key="booking-flow"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      {/* Date tabs */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-550">Select Date</label>
                        <div className="flex gap-2">
                          {[
                            { id: "May 21", label: "Thu, May 21" },
                            { id: "May 22", label: "Fri, May 22" },
                            { id: "May 25", label: "Mon, May 25" }
                          ].map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => { setSelectedDate(d.id); setSelectedTime(null); }}
                              className={`flex-1 rounded-xl py-2 px-1 text-[11px] font-bold border transition-all ${
                                selectedDate === d.id
                                  ? "bg-indigo-50 border-indigo-200 text-indigo-650 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-400"
                                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-zinc-900/20 dark:border-zinc-850 dark:text-zinc-400 dark:hover:bg-zinc-900/40"
                              }`}
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Time slots */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-550">Available Slots</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            "10:00 AM",
                            "11:30 AM",
                            "2:00 PM",
                            "3:30 PM"
                          ].map((time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setSelectedTime(time)}
                              className={`rounded-xl py-2 text-xs font-semibold border transition-all ${
                                selectedTime === time
                                  ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-650/15"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-zinc-900/40 dark:border-zinc-850 dark:text-zinc-300 dark:hover:bg-zinc-900"
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Booking Form Details */}
                      <AnimatePresence initial={false}>
                        {selectedTime && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="space-y-3.5 border-t border-slate-100 pt-4 dark:border-zinc-900 overflow-hidden"
                          >
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500">Your Name</label>
                                <input 
                                  type="text" 
                                  placeholder="John Doe" 
                                  value={bookingName}
                                  onChange={(e) => setBookingName(e.target.value)}
                                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900/20"
                                  required
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500">Email Address</label>
                                <input 
                                  type="email" 
                                  placeholder="john@company.com" 
                                  value={bookingEmail}
                                  onChange={(e) => setBookingEmail(e.target.value)}
                                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900/20"
                                  required
                                />
                              </div>
                            </div>

                            <Button 
                              onClick={() => {
                                if (bookingName && bookingEmail) {
                                  setBookingConfirmed(true);
                                }
                              }}
                              className="w-full rounded-xl bg-indigo-650 py-2.5 text-white font-bold hover:bg-indigo-750 transition-colors shadow-md shadow-indigo-655/10 text-xs"
                            >
                              Confirm Booking for {selectedTime}
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="booking-success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-5 py-4 text-center"
                    >
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                        <Check className="size-6" />
                      </div>
                      <div>
                        <h4 className="text-base font-extrabold text-slate-800 dark:text-zinc-150">Booking Confirmed! 🎉</h4>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                          Invitation details sent to <span className="font-semibold text-slate-850 dark:text-white">{bookingEmail}</span>
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-left space-y-2 dark:border-zinc-900 dark:bg-zinc-950/20 text-xs leading-relaxed max-w-sm mx-auto">
                        <div>
                          <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wide block">Event</span>
                          <span className="font-semibold text-slate-800 dark:text-zinc-200">LeadFlow Product Demo (30m)</span>
                        </div>
                        <div className="border-t border-slate-100 pt-2 dark:border-zinc-900/60">
                          <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wide block">Date / Time</span>
                          <span className="font-semibold text-slate-800 dark:text-zinc-200">{selectedDate}, 2026 at {selectedTime}</span>
                        </div>
                        <div className="border-t border-slate-100 pt-2 dark:border-zinc-900/60">
                          <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wide block">Video Conference Link</span>
                          <span className="font-mono text-[10px] text-indigo-650 dark:text-indigo-400 block break-all font-semibold">
                            meet.google.com/abc-defg-hij
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => {
                          setBookingConfirmed(false);
                          setSelectedTime(null);
                          setBookingName("");
                          setBookingEmail("");
                        }}
                        variant="outline"
                        className="rounded-xl border-slate-200 text-xs text-slate-655 hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
                      >
                        Book Another Demo
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. Technical Security & Infrastructure */}
      <section id="security" className="border-t border-slate-200 bg-slate-100/30 py-20 dark:border-zinc-900 dark:bg-[#0c0a12]/20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Enterprise Data Security
            </h2>
            <p className="mt-4 text-slate-600 dark:text-zinc-400 text-sm">
              We design every component to secure your proprietary client contacts and prevent tenant leaks.
            </p>
          </div>

          <motion.div 
            className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.08
                }
              }
            }}
          >
            {/* Card 1 */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
              }}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-left dark:border-zinc-900 dark:bg-zinc-950/50"
            >
              <Shield className="size-6 text-indigo-650 text-indigo-600" />
              <h3 className="mt-4 text-base font-bold">Postgres RLS Shield</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Row-Level Security (RLS) policies block cross-tenant read/write queries directly at the database engine level, enforcing organization boundaries.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
              }}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-left dark:border-zinc-900 dark:bg-zinc-950/50"
            >
              <Database className="size-6 text-indigo-650 text-indigo-600" />
              <h3 className="mt-4 text-base font-bold">Private Storage Buckets</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Uploaded CSV lists are isolated in private storage vaults. Signed URL paths expire in 10 minutes to secure raw contact directories.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
              }}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-left dark:border-zinc-900 dark:bg-zinc-950/50"
            >
              <Zap className="size-6 text-indigo-655 text-indigo-600" />
              <h3 className="mt-4 text-base font-bold">Trigger.dev Workers</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                All background tasks execute on durable workers with automatic retries. Your import pipelines won't fail due to browser thread terminations.
              </p>
            </motion.div>

            {/* Card 4 */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
              }}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-left dark:border-zinc-900 dark:bg-zinc-950/50"
            >
              <UserCheck className="size-6 text-indigo-650 text-indigo-600" />
              <h3 className="mt-4 text-base font-bold">Dynamic AI Cap limits</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Prevent runaway API bills during mass CSV uploads. Limit billing limits per organization with automated notifications.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 7. FAQ Accordion */}
      <section id="faq" className="border-t border-slate-200 py-20 dark:border-zinc-900">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-slate-600 dark:text-zinc-400 text-sm">
              Got questions about our background architecture or AI processing pipeline? Let's clear them up.
            </p>
          </div>

          <div className="space-y-4 text-left">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index
              return (
                <div 
                  key={index}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all dark:border-zinc-900 dark:bg-zinc-950/30"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="flex w-full items-center justify-between px-6 py-5 text-sm font-semibold hover:bg-slate-50/50 dark:hover:bg-zinc-900/20 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="size-4 text-slate-500" /> : <ChevronDown className="size-4 text-slate-500" />}
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed border-t border-slate-100 pt-3 dark:border-zinc-900/60">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 8. Call to Action Banner */}
      <section className="relative border-t border-slate-200 py-20 dark:border-zinc-900">
        <div className="absolute top-1/2 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-200/20 blur-[100px] dark:bg-indigo-950/10" />
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Upgrade Your Outbound Velocity
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
            Join other growth teams converting raw databases into personalized emails, structured scoring matrices, and closed client accounts.
          </p>
          <div className="mt-10 flex justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="rounded-full bg-[#1b172b] px-8 text-sm font-bold text-white shadow-lg shadow-indigo-950/20 hover:bg-[#25203d] dark:bg-indigo-600 dark:hover:bg-indigo-700">
                Launch LeadFlow CRM
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 9. Premium Footer */}
      <footer className="border-t border-slate-200 bg-white py-16 dark:border-zinc-900/60 dark:bg-[#0c0a12]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
            
            {/* Column 1: Brand Info */}
            <div className="lg:col-span-4 space-y-4 text-left">
              <div className="flex items-center gap-2.5">
                <Logo iconSize={24} textSize="text-base" />
                <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[8px] font-bold text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-400">
                  BETA
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-500 leading-relaxed max-w-sm text-left">
                AI-powered sales CRM designed to process high-volume CSV exports, enrich contact intelligence using Claude, and secure databases with enterprise RLS.
              </p>
              <div className="flex items-center gap-4 text-slate-400 dark:text-zinc-600">
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
                <li><Link href="#how-it-works" className="hover:text-indigo-650 dark:hover:text-white transition-colors">How it Works</Link></li>
                <li><Link href="#ai-playground" className="hover:text-indigo-650 dark:hover:text-white transition-colors">Interactive AI</Link></li>
                <li><Link href="#roi-calculator" className="hover:text-indigo-650 dark:hover:text-white transition-colors">ROI Calculator</Link></li>
                <li><Link href="#booking-showcase" className="hover:text-indigo-650 dark:hover:text-white transition-colors">Meeting Booking</Link></li>
                <li><Link href="#security" className="hover:text-indigo-650 dark:hover:text-white transition-colors">Security Stack</Link></li>
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
              <p className="text-[11px] text-slate-500 leading-relaxed dark:text-zinc-550">
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
