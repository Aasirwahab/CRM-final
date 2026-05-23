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
  Sparkles,
  Calendar,
  Video,
  Layers
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { PipelineSimulator } from "@/components/ui/pipeline-simulator"
import { VideoHero } from "@/components/landing/video-hero"
import { SectionHeading } from "@/components/landing/section-heading"

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
    <div className="min-h-screen bg-white font-[family-name:var(--font-inter)] text-black selection:bg-[#5ae14c]/30 overflow-x-hidden">

      <VideoHero />


      {/* 3. The Process Section */}
      <section id="how-it-works" className="border-t border-black/5 bg-gradient-to-b from-white to-[#f5f5f5] py-24 sm:py-28 relative overflow-hidden">
        {/* Subtle decorative accent */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-[#5ae14c]/5 blur-[100px] pointer-events-none" />
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-12">

            {/* Left Side: Text + Visual Ingestion Pipe Mockup */}
            <div className="lg:col-span-5 flex flex-col justify-center gap-8">
              <SectionHeading
                align="left"
                eyebrow="The Ingestion Pipeline"
                title="How LeadFlow Works"
                subtitle="Automated, multi-tiered pipeline workers run in the background — cleaning data, dropping duplicates, enriching details, and scoring quality without ever blocking your app."
              />
              {/* Interactive Ingestion Flow Graphic */}
              <PipelineSimulator />

              <div className="hidden lg:block">
                <Link href="/sign-up" className="inline-flex items-center font-[family-name:var(--font-schibsted-grotesk)] text-sm font-semibold text-black transition-colors hover:text-[#3fce32]">
                  Try the import wizard <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </div>
            </div>

            {/* Right Side: Premium Step Cards */}
            <motion.div
              className="lg:col-span-7 flex flex-col gap-5"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.1 } },
              }}
            >
              {[
                {
                  num: "01",
                  Icon: Upload,
                  title: "Secure Ingestion & Validation",
                  body: "CSVs upload directly to private storage buckets via temporary signed URLs. Streaming validators inspect schemas, block malicious spreadsheet formula execution, and save custom mapping presets.",
                },
                {
                  num: "02",
                  Icon: Layers,
                  title: "Trigram Deduplication",
                  body: "Keep records clean. Imports are filtered against existing leads via multi-column exact checks (email, phone, domain) plus Postgres pg_trgm fuzzy matching to drop duplicate companies.",
                },
                {
                  num: "03",
                  Icon: Cpu,
                  title: "Rule-Based Immediate Scoring",
                  body: "Before spending AI credits, the rule engine scopes contacts by title authority, company size, and region — assigning Hot, Warm, or Cold quality so you can prioritize outreach instantly.",
                },
                {
                  num: "04",
                  Icon: Sparkles,
                  title: "Claude AI Deep Enrichment",
                  body: "High-scoring leads are sent to Anthropic's Claude for deep research — generating company summaries, pain-point analysis, personalized outreach drafts, and priority scores in seconds.",
                },
              ].map(({ num, Icon, title, body }) => (
                <motion.div
                  key={num}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
                  }}
                  className="group relative rounded-2xl border border-black/8 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="absolute right-6 top-6 font-[family-name:var(--font-schibsted-grotesk)] text-sm font-bold text-black/15">
                    {num}
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#5ae14c]/15 text-[#0e1311]">
                      <Icon className="size-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-[family-name:var(--font-fustat)] text-lg font-bold tracking-[-0.4px] text-black">
                        {title}
                      </h3>
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#505050]">
                        {body}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

          </div>
        </div>
      </section>

      {/* 4. Interactive AI Research Playground */}
      <section id="ai-playground" className="border-t border-black/5 bg-[#f8f8f8] py-24 sm:py-28">
        <div className="mx-auto max-w-5xl px-6 lg:px-12">
          <SectionHeading
            eyebrow="Claude-Powered Enrichment"
            title="Research that writes itself"
            subtitle="Toggle the research tiers to see the depth of enrichment LeadFlow generates with Anthropic's Claude models — from a fast pass to deep, web-grounded intelligence."
          />

          <div className="mt-10 flex justify-center gap-1 rounded-full border border-black/8 bg-white p-1 max-w-md mx-auto shadow-sm">
            {(["basic", "standard", "deep"] as const).map((tier) => {
              const label = tier === "basic" ? "Basic Research" : tier === "standard" ? "Standard" : "Deep Research"
              const isActive = activeTier === tier
              return (
                <button
                  key={tier}
                  onClick={() => setActiveTier(tier)}
                  className="relative flex-1 rounded-full py-2 font-[family-name:var(--font-schibsted-grotesk)] text-xs font-semibold tracking-[-0.2px] transition-colors duration-200 text-black/70 hover:text-black cursor-pointer"
                >
                  {isActive && (
                    <motion.span
                      layoutId="activePlaygroundTab"
                      className="absolute inset-0 rounded-full bg-[#0e1311] shadow-sm"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className={`relative z-10 ${isActive ? "text-white" : ""}`}>
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
              className="mt-8 rounded-2xl border border-black/8 bg-white p-6 sm:p-8 shadow-sm"
            >
              <div className="flex flex-col md:flex-row gap-6 justify-between border-b border-black/8 pb-6">
                <div className="space-y-2 text-left">
                  <span className="font-[family-name:var(--font-schibsted-grotesk)] text-[11px] font-semibold uppercase tracking-[0.14em] text-black/40">Target Company</span>
                  <h3 className="font-[family-name:var(--font-fustat)] text-xl font-bold tracking-[-0.6px] text-black">{aiTiersData[activeTier].companyName}</h3>
                  <span className="inline-block rounded-full bg-[#5ae14c]/15 px-3 py-0.5 text-xs font-medium text-[#0e1311]">
                    {aiTiersData[activeTier].industry}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-6 text-left">
                  <div>
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-black/40 block">LLM Engine</span>
                    <span className="text-xs font-bold text-[#0e1311]">{aiTiersData[activeTier].model}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-black/40 block">Avg. Cost</span>
                    <span className="text-xs font-bold text-black">{aiTiersData[activeTier].cost}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-black/40 block">Enriched In</span>
                    <span className="text-xs font-bold text-black">{aiTiersData[activeTier].speed}</span>
                  </div>
                </div>
              </div>

              {/* Research Report Visual fields */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                <div className="lg:col-span-7 space-y-5">
                  <div>
                    <h4 className="font-[family-name:var(--font-schibsted-grotesk)] text-[11px] font-semibold uppercase text-black/40 tracking-[0.14em]">AI Analysis Summary</h4>
                    <p className="mt-2 text-sm leading-relaxed text-[#505050]">
                      {aiTiersData[activeTier].summary}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-[family-name:var(--font-schibsted-grotesk)] text-[11px] font-semibold uppercase text-black/40 tracking-[0.14em]">Scoring Category</h4>
                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-[#f8f8f8] px-3 py-1 text-xs font-bold text-black">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#5ae14c] animate-pulse" />
                      {aiTiersData[activeTier].score}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-[family-name:var(--font-schibsted-grotesk)] text-[11px] font-semibold uppercase text-black/40 tracking-[0.14em]">Detected Friction &amp; Pain Points</h4>
                    <ul className="mt-2 space-y-2">
                      {aiTiersData[activeTier].painPoints.map((point, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-[#505050]">
                          <CheckCircle2 className="size-4 text-[#3fce32] shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-[family-name:var(--font-schibsted-grotesk)] text-[11px] font-semibold uppercase text-black/40 tracking-[0.14em]">Recommended Action</h4>
                    <p className="mt-2 text-sm text-[#505050] italic">
                      &ldquo;{aiTiersData[activeTier].recommendation}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Outreach message panel */}
                <div className="lg:col-span-5 bg-[#f8f8f8] border border-black/8 p-4 rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-black/8 pb-2 mb-3">
                      <span className="font-[family-name:var(--font-schibsted-grotesk)] text-[11px] font-semibold uppercase tracking-[0.14em] text-black/50">Outreach Message Draft</span>
                      <button
                        onClick={() => handleCopy(aiTiersData[activeTier].outreachMessage)}
                        className="flex items-center gap-1 text-xs text-black/40 hover:text-[#3fce32] transition-colors"
                      >
                        {copiedText ? <Check className="size-3 text-[#3fce32]" /> : <Copy className="size-3" />}
                        {copiedText ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed text-[#505050]">
                      {aiTiersData[activeTier].outreachMessage}
                    </pre>
                  </div>
                  <div className="mt-4 pt-3 border-t border-black/8">
                    <span className="text-[10px] text-black/40 leading-normal block">
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
      <section id="roi-calculator" className="border-t border-black/5 bg-gradient-to-b from-white to-[#f5f5f5] py-24 sm:py-28 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] rounded-full bg-[#5ae14c]/5 blur-[100px] pointer-events-none" />
        <div className="mx-auto max-w-5xl px-6 lg:px-12">
          <SectionHeading
            eyebrow="ROI Calculator"
            title="The math on automated pipelines"
            subtitle="See how much manual research overhead you can cut — and the extra revenue you unlock — when LeadFlow runs enrichment for you."
          />

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Input Side */}
            <div className="lg:col-span-7 bg-white border border-black/8 p-7 rounded-2xl flex flex-col justify-between shadow-sm">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <label className="font-[family-name:var(--font-schibsted-grotesk)] text-sm font-semibold text-black">Monthly Lead Volume</label>
                    <span className="text-lg font-mono font-bold text-[#0e1311]">{leadVolume.toLocaleString()} leads</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="10000"
                    step="100"
                    value={leadVolume}
                    onChange={(e) => setLeadVolume(parseInt(e.target.value))}
                    className="w-full accent-[#5ae14c] h-2 bg-black/10 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-semibold text-black/35">
                    <span>100</span>
                    <span>5,000</span>
                    <span>10,000</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <label className="font-[family-name:var(--font-schibsted-grotesk)] text-sm font-semibold text-black">Average Closed Deal Value</label>
                    <span className="text-lg font-mono font-bold text-[#0e1311]">${dealValue.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="50000"
                    step="500"
                    value={dealValue}
                    onChange={(e) => setDealValue(parseInt(e.target.value))}
                    className="w-full accent-[#5ae14c] h-2 bg-black/10 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-semibold text-black/35">
                    <span>$500</span>
                    <span>$25,000</span>
                    <span>$50,000</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-black/8 pt-4">
                <p className="text-xs text-black/45 leading-normal">
                  *Calculations assume 15 minutes of manual validation saved per lead, and a conservative conversion lift of 1.8% from structured outreach recommendations.
                </p>
              </div>
            </div>

            {/* Results Card (light, brand-tinted) */}
            <div className="lg:col-span-5 rounded-2xl border border-[#5ae14c]/30 bg-gradient-to-br from-white to-[#5ae14c]/10 p-7 flex flex-col justify-between relative overflow-hidden shadow-sm">
              {/* Background green glow */}
              <div className="absolute -top-1/4 -right-1/4 w-48 h-48 rounded-full bg-[#5ae14c]/20 blur-[60px]" />

              <div className="relative">
                <h3 className="font-[family-name:var(--font-schibsted-grotesk)] text-[11px] font-semibold uppercase tracking-[0.16em] text-[#3fce32]">Monthly Estimated Value</h3>

                <div className="mt-8 space-y-6">
                  {/* Revenue lift */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5ae14c]/20 border border-[#5ae14c]/30 text-[#0e1311]">
                      <DollarSign className="size-6" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-black/45 block tracking-wide">Incremental Revenue</span>
                      <span className="font-[family-name:var(--font-fustat)] text-2xl font-bold text-black tracking-tight">
                        <AnimatedMetric value={extraRevenue.toLocaleString()} prefix="$" />
                      </span>
                    </div>
                  </div>

                  {/* Hours saved */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5ae14c]/20 border border-[#5ae14c]/30 text-[#0e1311]">
                      <Clock className="size-6" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-black/45 block tracking-wide">Research Time Saved</span>
                      <span className="font-[family-name:var(--font-fustat)] text-xl font-bold text-black tracking-tight">
                        <AnimatedMetric value={hoursSaved.toLocaleString()} suffix=" hours" />
                      </span>
                    </div>
                  </div>

                  {/* Deals conversion */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5ae14c]/20 border border-[#5ae14c]/30 text-[#0e1311]">
                      <TrendingUp className="size-6" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-black/45 block tracking-wide">Extra Closed Deals</span>
                      <span className="font-[family-name:var(--font-fustat)] text-xl font-bold text-black tracking-tight">
                        <AnimatedMetric value={extraDeals} prefix="+" suffix=" deals" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative mt-8 pt-6 border-t border-[#5ae14c]/25">
                <Link
                  href="/sign-up"
                  className="flex w-full h-12 items-center justify-center rounded-full bg-[#5ae14c] font-[family-name:var(--font-schibsted-grotesk)] font-bold text-[#0e1311] shadow-sm transition-colors hover:bg-[#3fce32]"
                >
                  Unlock This Growth Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5.5. Google Calendar Meeting Booking Section */}
      <section id="booking-showcase" className="border-t border-black/5 bg-[#f8f8f8] py-24 sm:py-28">
        <div className="mx-auto max-w-5xl px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left Column: Copy & Details */}
            <div className="lg:col-span-6 text-left space-y-8">
              <SectionHeading
                align="left"
                eyebrow="Automated Scheduling"
                title="Built-in booking pages & calendar sync"
                subtitle="Stop playing email tag. LeadFlow generates secure, customizable public booking links wired directly to your Google Calendar availability."
              />

              <div className="space-y-5">
                {[
                  {
                    Icon: Calendar,
                    title: "Real-time OAuth Availability",
                    body: "Securely sync with your Google account. LeadFlow checks busy slots dynamically and shows only open times on your public page — zero double-bookings.",
                  },
                  {
                    Icon: Video,
                    title: "Google Meet Link Creation",
                    body: "Every confirmed booking generates a calendar event with a unique Google Meet conference link and sends invites to both parties automatically.",
                  },
                  {
                    Icon: Shield,
                    title: "Privacy & Security Isolated",
                    body: "Our integration only checks free/busy metrics. We never read or store event descriptions, attendee lists, or private details from your other bookings.",
                  },
                ].map(({ Icon, title, body }) => (
                  <div key={title} className="flex gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5ae14c]/15 text-[#0e1311]">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h4 className="font-[family-name:var(--font-fustat)] text-base font-bold tracking-[-0.3px] text-black">{title}</h4>
                      <p className="mt-1 text-sm text-[#505050] leading-relaxed">
                        {body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Link
                  href="/sign-up"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[#5ae14c] px-7 font-[family-name:var(--font-schibsted-grotesk)] text-sm font-semibold text-[#0e1311] shadow-md shadow-[#5ae14c]/25 transition-colors hover:bg-[#3fce32]"
                >
                  Get Your Booking Link
                </Link>
              </div>
            </div>

            {/* Right Column: Interactive Booking Widget Mockup */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm text-left relative overflow-hidden">

                {/* Simulated Header block */}
                <div className="flex items-center gap-3 border-b border-black/8 pb-4 mb-4">
                  <div className="h-10 w-10 rounded-full bg-[#0e1311] flex items-center justify-center text-white text-xs font-bold font-[family-name:var(--font-schibsted-grotesk)]">
                    LF
                  </div>
                  <div>
                    <h3 className="font-[family-name:var(--font-fustat)] text-base font-bold tracking-[-0.3px] text-black">LeadFlow Product Demo</h3>
                    <p className="text-[11px] text-black/40">30 min • Video Meeting via Google Meet</p>
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
                        <label className="font-[family-name:var(--font-schibsted-grotesk)] text-[10px] uppercase font-semibold tracking-[0.12em] text-black/40">Select Date</label>
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
                                  ? "bg-[#5ae14c]/15 border-[#5ae14c]/40 text-[#0e1311]"
                                  : "bg-[#f8f8f8] border-black/8 text-black/55 hover:bg-black/[0.04]"
                              }`}
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Time slots */}
                      <div className="space-y-1.5">
                        <label className="font-[family-name:var(--font-schibsted-grotesk)] text-[10px] uppercase font-semibold tracking-[0.12em] text-black/40">Available Slots</label>
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
                                  ? "bg-[#5ae14c] border-[#5ae14c] text-[#0e1311] shadow-sm"
                                  : "bg-white border-black/10 text-black/70 hover:bg-[#f8f8f8]"
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
                            className="space-y-3.5 border-t border-black/8 pt-4 overflow-hidden"
                          >
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="font-[family-name:var(--font-schibsted-grotesk)] text-[9px] uppercase font-semibold tracking-[0.12em] text-black/40">Your Name</label>
                                <input
                                  type="text"
                                  placeholder="John Doe"
                                  value={bookingName}
                                  onChange={(e) => setBookingName(e.target.value)}
                                  className="w-full rounded-lg border border-black/10 bg-[#f8f8f8] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#5ae14c]"
                                  required
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="font-[family-name:var(--font-schibsted-grotesk)] text-[9px] uppercase font-semibold tracking-[0.12em] text-black/40">Email Address</label>
                                <input
                                  type="email"
                                  placeholder="john@company.com"
                                  value={bookingEmail}
                                  onChange={(e) => setBookingEmail(e.target.value)}
                                  className="w-full rounded-lg border border-black/10 bg-[#f8f8f8] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#5ae14c]"
                                  required
                                />
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                if (bookingName && bookingEmail) {
                                  setBookingConfirmed(true);
                                }
                              }}
                              className="w-full rounded-xl bg-[#0e1311] py-2.5 font-[family-name:var(--font-schibsted-grotesk)] text-white font-bold hover:bg-black transition-colors text-xs"
                            >
                              Confirm Booking for {selectedTime}
                            </button>
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
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#5ae14c]/20 text-[#0e1311]">
                        <Check className="size-6" />
                      </div>
                      <div>
                        <h4 className="font-[family-name:var(--font-fustat)] text-lg font-bold tracking-[-0.4px] text-black">Booking Confirmed!</h4>
                        <p className="text-xs text-black/50 mt-1">
                          Invitation details sent to <span className="font-semibold text-black">{bookingEmail}</span>
                        </p>
                      </div>

                      <div className="rounded-xl border border-black/8 bg-[#f8f8f8] p-4 text-left space-y-2 text-xs leading-relaxed max-w-sm mx-auto">
                        <div>
                          <span className="font-[family-name:var(--font-schibsted-grotesk)] font-semibold text-black/40 uppercase text-[9px] tracking-[0.12em] block">Event</span>
                          <span className="font-semibold text-black">LeadFlow Product Demo (30m)</span>
                        </div>
                        <div className="border-t border-black/8 pt-2">
                          <span className="font-[family-name:var(--font-schibsted-grotesk)] font-semibold text-black/40 uppercase text-[9px] tracking-[0.12em] block">Date / Time</span>
                          <span className="font-semibold text-black">{selectedDate}, 2026 at {selectedTime}</span>
                        </div>
                        <div className="border-t border-black/8 pt-2">
                          <span className="font-[family-name:var(--font-schibsted-grotesk)] font-semibold text-black/40 uppercase text-[9px] tracking-[0.12em] block">Video Conference Link</span>
                          <span className="font-mono text-[10px] text-[#3fce32] block break-all font-semibold">
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
                        className="rounded-xl border-black/15 text-xs text-black/60 hover:bg-[#f8f8f8]"
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
      <section id="security" className="border-t border-black/5 bg-gradient-to-b from-white to-[#f5f5f5] py-24 sm:py-28 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[#5ae14c]/5 blur-[100px] pointer-events-none" />
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <SectionHeading
            eyebrow="Enterprise Security"
            title="Built to protect your data"
            subtitle="Every component is designed to secure your proprietary client contacts and prevent cross-tenant leaks."
          />

          <motion.div
            className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } },
            }}
          >
            {[
              {
                Icon: Shield,
                title: "Postgres RLS Shield",
                body: "Row-Level Security policies block cross-tenant read/write queries directly at the database engine, enforcing organization boundaries.",
              },
              {
                Icon: Database,
                title: "Private Storage Buckets",
                body: "Uploaded CSV lists are isolated in private storage vaults. Signed URLs expire in 10 minutes to secure raw contact directories.",
              },
              {
                Icon: Zap,
                title: "Trigger.dev Workers",
                body: "Background tasks run on durable workers with automatic retries. Import pipelines never fail from browser thread terminations.",
              },
              {
                Icon: UserCheck,
                title: "Dynamic AI Cap Limits",
                body: "Prevent runaway API bills during mass uploads. Set per-organization spending limits with automated notifications.",
              },
            ].map(({ Icon, title, body }) => (
              <motion.div
                key={title}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
                }}
                className="group rounded-2xl border border-black/8 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#5ae14c]/15 text-[#0e1311]">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 font-[family-name:var(--font-fustat)] text-lg font-bold tracking-[-0.3px] text-black">{title}</h3>
                <p className="mt-2 text-sm text-[#505050] leading-relaxed">
                  {body}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 7. FAQ Accordion */}
      <section id="faq" className="border-t border-black/5 bg-[#f8f8f8] py-20">
        <div className="mx-auto max-w-4xl px-6">
          <SectionHeading
            eyebrow="FAQ"
            title="Frequently Asked Questions"
            subtitle="Got questions about our background architecture or AI processing pipeline? Let's clear them up."
          />

          <div className="mt-12 space-y-4 text-left">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-black/8 bg-white overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="flex w-full items-center justify-between px-6 py-5 font-[family-name:var(--font-fustat)] text-sm font-semibold text-black hover:bg-black/[0.02] transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="size-4 text-black/40" /> : <ChevronDown className="size-4 text-black/40" />}
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
                        <div className="px-6 pb-5 font-[family-name:var(--font-inter)] text-sm text-[#505050] leading-relaxed border-t border-black/5 pt-3">
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
      <section className="border-t border-black/5 py-28 relative overflow-hidden" style={{ backgroundColor: "#0e1311" }}>
        {/* Decorative glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#5ae14c]/8 blur-[120px] pointer-events-none" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <span className="mb-4 inline-block font-[family-name:var(--font-schibsted-grotesk)] text-xs font-semibold uppercase tracking-[0.18em] text-[#5ae14c]">
            Get Started
          </span>
          <h2 className="max-w-3xl mx-auto font-[family-name:var(--font-fustat)] text-4xl font-bold leading-[1.05] tracking-[-1.6px] text-white sm:text-5xl">
            Upgrade Your Outbound Velocity
          </h2>
          <p className="mt-5 max-w-2xl mx-auto font-[family-name:var(--font-fustat)] text-lg font-medium leading-relaxed tracking-[-0.2px] text-white/50">
            Join other growth teams converting raw databases into personalized emails, structured scoring matrices, and closed client accounts.
          </p>
          <div className="mt-10 flex justify-center">
            <Link
              href="/sign-up"
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#5ae14c] px-8 text-sm font-bold text-[#0e1311] shadow-lg shadow-[#5ae14c]/25 transition-colors hover:bg-[#3fce32]"
            >
              Launch LeadFlow CRM
            </Link>
          </div>
        </div>
      </section>

      {/* 9. Premium Footer */}
      <footer className="border-t border-black/8 bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">

            {/* Column 1: Brand Info */}
            <div className="lg:col-span-4 space-y-4 text-left">
              <div className="flex items-center gap-2.5">
                <span className="font-[family-name:var(--font-schibsted-grotesk)] text-lg font-semibold tracking-[-1px] text-black">
                  LeadFlow
                </span>
                <span className="rounded-full bg-[#5ae14c]/15 px-1.5 py-0.5 text-[8px] font-bold text-[#3fce32]">
                  BETA
                </span>
              </div>
              <p className="text-xs text-[#505050] leading-relaxed max-w-sm text-left">
                AI-powered sales CRM designed to process high-volume CSV exports, enrich contact intelligence using Claude, and secure databases with enterprise RLS.
              </p>
              <div className="flex items-center gap-4 text-black/30">
                <Link href="#" className="hover:text-black transition-colors">
                  <svg className="size-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </Link>
                <Link href="#" className="hover:text-black transition-colors">
                  <svg className="size-4 fill-current" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                </Link>
                <Link href="#" className="hover:text-black transition-colors">
                  <svg className="size-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </Link>
              </div>
            </div>

            {/* Column 2: Product */}
            <div className="lg:col-span-2 space-y-3.5 text-left">
              <h4 className="font-[family-name:var(--font-schibsted-grotesk)] text-xs font-bold uppercase tracking-wider text-black">Product</h4>
              <ul className="space-y-2 text-xs text-[#505050]">
                <li><Link href="#how-it-works" className="hover:text-black transition-colors">How it Works</Link></li>
                <li><Link href="#ai-playground" className="hover:text-black transition-colors">Interactive AI</Link></li>
                <li><Link href="#roi-calculator" className="hover:text-black transition-colors">ROI Calculator</Link></li>
                <li><Link href="#booking-showcase" className="hover:text-black transition-colors">Meeting Booking</Link></li>
                <li><Link href="#security" className="hover:text-black transition-colors">Security Stack</Link></li>
              </ul>
            </div>

            {/* Column 3: Company */}
            <div className="lg:col-span-2 space-y-3.5 text-left">
              <h4 className="font-[family-name:var(--font-schibsted-grotesk)] text-xs font-bold uppercase tracking-wider text-black">Company</h4>
              <ul className="space-y-2 text-xs text-[#505050]">
                <li><Link href="#" className="hover:text-black transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-black transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-black transition-colors">Press Kit</Link></li>
                <li><Link href="#" className="hover:text-black transition-colors">Customers</Link></li>
              </ul>
            </div>

            {/* Column 4: Resources */}
            <div className="lg:col-span-2 space-y-3.5 text-left">
              <h4 className="font-[family-name:var(--font-schibsted-grotesk)] text-xs font-bold uppercase tracking-wider text-black">Resources</h4>
              <ul className="space-y-2 text-xs text-[#505050]">
                <li><Link href="#" className="hover:text-black transition-colors">Developer Docs</Link></li>
                <li><Link href="#" className="hover:text-black transition-colors">API Reference</Link></li>
                <li><Link href="#" className="hover:text-black transition-colors">Trigger Status</Link></li>
                <li><Link href="#" className="hover:text-black transition-colors">Security Trust</Link></li>
              </ul>
            </div>

            {/* Column 5: Newsletter/Subscribe */}
            <div className="lg:col-span-2 space-y-3.5 text-left">
              <h4 className="font-[family-name:var(--font-schibsted-grotesk)] text-xs font-bold uppercase tracking-wider text-black">Stay Updated</h4>
              <p className="text-[11px] text-[#505050] leading-relaxed">
                Subscribe to receive pipeline blueprints and product upgrades.
              </p>
              <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-1.5">
                <input
                  type="email"
                  placeholder="name@email.com"
                  className="w-full rounded-md border border-black/10 bg-[#f8f8f8] px-2 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#5ae14c]"
                  required
                />
                <button
                  type="submit"
                  className="rounded-md bg-[#0e1311] p-2 text-white hover:bg-black transition-colors"
                >
                  <ArrowRight className="size-3" />
                </button>
              </form>
            </div>

          </div>

          <div className="mt-12 pt-8 border-t border-black/8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-[11px] text-black/40">
              © {new Date().getFullYear()} LeadFlow Inc. All rights reserved.
            </p>
            <div className="flex gap-6 text-[11px] text-[#505050]">
              <Link href="/privacy" className="hover:text-black hover:underline transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-black hover:underline transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
