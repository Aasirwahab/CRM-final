"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Upload, 
  Check, 
  Shield, 
  Zap, 
  Database, 
  PlusCircle, 
  Trash2,
  Layers,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface Particle {
  id: string
  label: string
  stage: "ingest" | "dedupe" | "route" | "done" | "dropped"
  score?: number
  isDuplicate?: boolean
}

export function PipelineSimulator() {
  const [particles, setParticles] = useState<Particle[]>([])
  const [logs, setLogs] = useState<string[]>(["System initialized. Ready for ingestion."])
  const [stats, setStats] = useState({
    total: 1205,
    duplicates: 42,
    enriched: 1163
  })
  
  const [activeNode, setActiveNode] = useState<"none" | "ingest" | "dedupe" | "route">("none")
  const idCounter = useRef(0)

  // Add a log entry
  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogs(prev => [`[${time}] ${message}`, ...prev.slice(0, 7)])
  }

  // Trigger a new lead ingestion
  const ingestLead = (customLabel?: string) => {
    const domains = ["google.com", "stripe.com", "netflix.com", "microsoft.com", "openai.com", "github.com", "airbnb.com", "uber.com"]
    const label = customLabel || domains[Math.floor(Math.random() * domains.length)]
    const id = `lead_${idCounter.current++}`
    
    const isDuplicate = Math.random() < 0.25 // 25% chance of duplicate
    
    const newLead: Particle = {
      id,
      label,
      stage: "ingest",
      isDuplicate
    }
    
    setParticles(prev => [...prev, newLead])
    addLog(`Ingesting contact source: ${label}`)
    
    // Process through the stages
    // 1. Ingest -> Dedupe
    setTimeout(() => {
      setParticles(prev => prev.map(p => p.id === id ? { ...p, stage: "dedupe" } : p))
      setActiveNode("dedupe")
      addLog(`pg_trgm scanning database for duplicate company patterns: ${label}`)
      
      // 2. Dedupe result
      setTimeout(() => {
        if (isDuplicate) {
          setParticles(prev => prev.map(p => p.id === id ? { ...p, stage: "dropped" } : p))
          setStats(s => ({ ...s, duplicates: s.duplicates + 1 }))
          addLog(`⚠ Duplicate match found (94% similarity). Dropping duplicate: ${label}`)
          
          // Clear dropped particle after a moment
          setTimeout(() => {
            setParticles(prev => prev.filter(p => p.id !== id))
          }, 2000)
        } else {
          // Pass to Route
          setParticles(prev => prev.map(p => p.id === id ? { ...p, stage: "route" } : p))
          setActiveNode("route")
          const score = Math.floor(Math.random() * 45) + 55 // Score 55 - 99
          addLog(`Running Claude Prompt Enrichment & Lead Scoring for ${label}`)
          
          // 3. Route -> Done
          setTimeout(() => {
            setParticles(prev => prev.map(p => p.id === id ? { ...p, stage: "done", score } : p))
            setStats(s => ({ ...s, total: s.total + 1, enriched: s.enriched + 1 }))
            const priority = score >= 85 ? "HOT" : score >= 70 ? "WARM" : "COLD"
            addLog(`✓ Saved to CRM. ${label} scored ${score}/100 (${priority})`)
            
            // Clear done particle after a moment
            setTimeout(() => {
              setParticles(prev => prev.filter(p => p.id !== id))
            }, 3000)
          }, 1500)
        }
      }, 1500)
    }, 1200)
  }

  // Auto loop ingestion
  useEffect(() => {
    const timer = setInterval(() => {
      if (particles.filter(p => p.stage !== "done" && p.stage !== "dropped").length < 4) {
        ingestLead()
      }
    }, 4500)
    
    return () => clearInterval(timer)
  }, [particles])

  // Custom lead handler
  const handleCustomIngest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const domain = formData.get("domain")?.toString().trim()
    if (domain) {
      ingestLead(domain)
      e.currentTarget.reset()
    }
  }

  return (
    <div className="w-full space-y-6">
      
      {/* Node Graph Container */}
      <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-900/60 dark:bg-zinc-950/30 overflow-hidden min-h-[300px] flex flex-col justify-between">
        
        {/* Animated connection lines (background) */}
        <div className="absolute inset-0 top-1/2 -translate-y-1/2 h-[4px] w-[80%] left-[10%] -z-10 overflow-hidden hidden sm:block">
          <svg className="w-full h-full" fill="none">
            <line 
              x1="0%" y1="50%" x2="100%" y2="50%" 
              className="stroke-slate-200 dark:stroke-zinc-800 stroke-[3]"
            />
            <line 
              x1="0%" y1="50%" x2="100%" y2="50%" 
              className="stroke-indigo-500/40 dark:stroke-indigo-400/20 stroke-[3]"
              style={{ strokeDasharray: "15 30" }}
            />
          </svg>
        </div>

        {/* Header bar */}
        <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100 dark:border-zinc-900">
          <div className="flex items-center gap-1.5 font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
            <Layers className="size-3.5 text-indigo-500" />
            Live Ingestion Pipeline Simulator
          </div>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            active
          </span>
        </div>

        {/* Nodes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 py-8 relative">
          
          {/* Node 1: CSV Ingestion Source */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 dark:bg-zinc-900/40 dark:border-zinc-850 dark:text-zinc-400 shadow-sm transition-transform hover:scale-105">
              <Upload className="size-6" />
              <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white">
                <Check className="size-2.5" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">1. Raw CSV Source</p>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500">Streaming import stream</p>
            </div>
          </div>

          {/* Node 2: Trigram Deduplication */}
          <div className="flex flex-col items-center text-center space-y-3">
            <motion.div 
              animate={activeNode === "dedupe" ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.4 }}
              className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border shadow-sm transition-all duration-300 ${
                activeNode === "dedupe" 
                  ? "bg-indigo-50 border-indigo-300 text-indigo-650 dark:bg-indigo-950/40 dark:border-indigo-900/80 dark:text-indigo-400"
                  : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-zinc-900/40 dark:border-zinc-850 dark:text-zinc-400"
              }`}
            >
              <Shield className="size-6" />
              {activeNode === "dedupe" && (
                <span className="absolute inset-0 rounded-2xl bg-indigo-500/10 animate-ping" />
              )}
            </motion.div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">2. pg_trgm Deduplicator</p>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500">Fuzzy similarity check</p>
            </div>
          </div>

          {/* Node 3: Database & Router */}
          <div className="flex flex-col items-center text-center space-y-3">
            <motion.div 
              animate={activeNode === "route" ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.4 }}
              className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border shadow-sm transition-all duration-300 ${
                activeNode === "route" 
                  ? "bg-violet-50 border-violet-300 text-violet-650 dark:bg-violet-950/40 dark:border-violet-900/80 dark:text-violet-400"
                  : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-zinc-900/40 dark:border-zinc-850 dark:text-zinc-400"
              }`}
            >
              <Database className="size-6" />
              {activeNode === "route" && (
                <span className="absolute inset-0 rounded-2xl bg-violet-500/10 animate-ping" />
              )}
            </motion.div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">3. CRM Database</p>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500">Route by priority score</p>
            </div>
          </div>

          {/* Animating Particles Container */}
          <AnimatePresence>
            {particles.map((p) => {
              // Calculate particle positions based on stage
              let leftPos = "15%"
              let colorClasses = "bg-slate-400 dark:bg-zinc-600"
              let icon = null
              
              if (p.stage === "ingest") {
                leftPos = "15%"
              } else if (p.stage === "dedupe") {
                leftPos = "50%"
                colorClasses = p.isDuplicate ? "bg-indigo-600 ring-4 ring-indigo-500/20" : "bg-indigo-550"
              } else if (p.stage === "route") {
                leftPos = "83%"
                colorClasses = "bg-violet-600"
              } else if (p.stage === "done") {
                leftPos = "83%"
                const isHot = p.score && p.score >= 85
                const isWarm = p.score && p.score >= 70
                colorClasses = isHot 
                  ? "bg-rose-500 shadow-rose-500/30 shadow-lg" 
                  : isWarm 
                    ? "bg-amber-500 shadow-amber-500/30 shadow-lg" 
                    : "bg-blue-500 shadow-blue-500/30 shadow-lg"
              } else if (p.stage === "dropped") {
                leftPos = "50%"
                colorClasses = "bg-rose-500 animate-shake"
              }

              return (
                <motion.div
                  key={p.id}
                  layoutId={p.id}
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 pointer-events-none hidden sm:flex`}
                  initial={{ left: "15%", opacity: 0, scale: 0.6 }}
                  animate={{ 
                    left: leftPos, 
                    opacity: p.stage === "dropped" ? [1, 1, 0] : 1,
                    scale: p.stage === "dropped" ? [1, 1.1, 0] : 1
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ 
                    left: { type: "spring", stiffness: 70, damping: 14 },
                    scale: { type: "tween", ease: "easeInOut", duration: 0.5 },
                    opacity: { type: "tween", ease: "easeInOut", duration: 0.5 }
                  }}
                >
                  <div className={`h-4 w-4 rounded-full ${colorClasses} border-2 border-white dark:border-zinc-950 flex items-center justify-center`}>
                    {p.stage === "dropped" && <Trash2 className="size-2 text-white" />}
                    {p.stage === "done" && <Sparkles className="size-2 text-white" />}
                  </div>
                  <span className="rounded-full bg-slate-800/90 dark:bg-zinc-900/90 border border-slate-700 px-2 py-0.5 text-[8px] font-bold text-white shadow-md font-mono whitespace-nowrap">
                    {p.label}
                    {p.score ? ` (${p.score})` : ""}
                  </span>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 border-t border-slate-100 dark:border-zinc-900/60 pt-4 text-left">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 dark:bg-zinc-900/20 dark:border-zinc-850">
            <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-zinc-500 tracking-wide block">Leads Enriched</span>
            <span className="text-sm font-extrabold font-mono text-slate-800 dark:text-zinc-200">{stats.enriched.toLocaleString()}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 dark:bg-zinc-900/20 dark:border-zinc-850">
            <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-zinc-500 tracking-wide block">Duplicates Skipped</span>
            <span className="text-sm font-extrabold font-mono text-indigo-600 dark:text-indigo-400">{stats.duplicates}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 dark:bg-zinc-900/20 dark:border-zinc-850">
            <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-zinc-500 tracking-wide block">Accuracy Lift</span>
            <span className="text-sm font-extrabold font-mono text-emerald-600 dark:text-emerald-450">99.8%</span>
          </div>
        </div>
      </div>

      {/* Control Console */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Terminal/Logs block */}
        <div className="rounded-xl border border-slate-200 bg-[#0f0b1a] p-4 text-left font-mono text-[10px] text-zinc-300 min-h-[140px] flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 border-b border-zinc-900 pb-1.5 mb-2">
            <span>PIPELINE LOGS</span>
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          </div>
          <div className="flex-1 space-y-1.5 overflow-hidden">
            {logs.map((log, i) => (
              <div 
                key={i} 
                className={`truncate ${i === 0 ? "text-indigo-400 font-semibold" : "opacity-60"}`}
              >
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Ingest Console */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-zinc-900 dark:bg-zinc-950/30 flex flex-col justify-between text-left">
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
              <PlusCircle className="size-4 text-indigo-600" />
              Manual Pipeline Ingestion
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-zinc-500 mt-1">
              Test row validations, fuzzy check matching, and priority scoring in real time.
            </p>
          </div>

          <form onSubmit={handleCustomIngest} className="flex gap-2 mt-4">
            <input 
              name="domain"
              type="text" 
              placeholder="e.g. spacex.com" 
              required
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900/20"
            />
            <Button 
              type="submit" 
              size="sm" 
              className="rounded-lg bg-indigo-600 text-[11px] font-bold text-white hover:bg-indigo-700"
            >
              Ingest
            </Button>
          </form>
        </div>
      </div>

    </div>
  )
}
