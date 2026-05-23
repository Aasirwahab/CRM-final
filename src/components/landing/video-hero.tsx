"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  ChevronDown,
  ArrowUp,
  Star,
  Sparkles,
  Upload,
  Send,
  Menu,
  X,
} from "lucide-react"

const VIDEO_SRC = "/hf_20260329_050842_be71947f-f16e-4a14-810c-06e83d23ddb5.mp4"

// Loop back this many seconds before the natural end so the clip's bright ending
// (the flash) is never reached or shown.
const SKIP_TAIL_SECONDS = 0.55

// Single looping background video. Instead of letting the clip play to its end
// (where the bright flash lives), we jump back to the start a moment early. No
// opacity fades, so nothing dips or blinks — just a continuous loop that never
// reveals the flash.
function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return
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

    // If the video is already ready, play immediately; otherwise wait
    if (video.readyState >= 2) {
      tryPlay()
    } else {
      video.addEventListener("canplay", tryPlay, { once: true })
    }

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate)
      video.removeEventListener("canplay", tryPlay)
    }
  }, [isMounted])

  // Render a matching placeholder div on the server to avoid layout shift,
  // then swap in the real <video> after hydration so attributes never mismatch.
  if (!isMounted) {
    return (
      <div className="pointer-events-none absolute inset-0 z-[1] h-full w-full bg-black" />
    )
  }

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

const NAV_LINKS = [
  { label: "Platform", href: "#how-it-works" },
  { label: "Features", href: "#ai-playground", hasDropdown: true },
  { label: "Calculator", href: "#roi-calculator" },
  { label: "Booking", href: "#booking-showcase" },
  { label: "FAQ", href: "#faq" },
]

export function VideoHero() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-black">
      <VideoBackground />

      {/* Content layer */}
      <div className="relative z-[2] flex min-h-screen flex-col">
        {/* Navigation */}
        <nav className="flex items-center justify-between px-6 py-4 md:px-12 lg:px-[120px]">
          <Link
            href="/"
            className="font-[family-name:var(--font-schibsted-grotesk)] text-2xl font-semibold tracking-[-1.44px] text-black"
          >
            LeadFlow
          </Link>

          <div className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="flex items-center gap-1 font-[family-name:var(--font-schibsted-grotesk)] text-base font-medium tracking-[-0.2px] text-black/80 transition-colors hover:text-black"
              >
                {link.label}
                {link.hasDropdown && <ChevronDown className="size-4" />}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sign-up"
              className="hidden sm:flex h-10 w-[82px] items-center justify-center rounded-full font-[family-name:var(--font-schibsted-grotesk)] text-base font-medium tracking-[-0.2px] text-black transition-colors hover:bg-black/5"
            >
              Sign Up
            </Link>
            <Link
              href="/sign-in"
              className="hidden sm:flex h-10 w-[101px] items-center justify-center rounded-full bg-black font-[family-name:var(--font-schibsted-grotesk)] text-base font-medium tracking-[-0.2px] text-white transition-opacity hover:opacity-90"
            >
              Log In
            </Link>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex lg:hidden size-10 items-center justify-center rounded-full bg-black/10 backdrop-blur-sm text-black transition-colors hover:bg-black/20"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-[72px] left-0 right-0 z-50 mx-4 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border border-black/8 p-6 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-xl px-4 py-3 font-[family-name:var(--font-schibsted-grotesk)] text-base font-medium text-black/80 transition-colors hover:bg-black/5"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-black/8 pt-4 mt-3 flex gap-3">
              <Link
                href="/sign-up"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 flex h-10 items-center justify-center rounded-full border border-black/10 font-[family-name:var(--font-schibsted-grotesk)] text-sm font-medium text-black transition-colors hover:bg-black/5"
              >
                Sign Up
              </Link>
              <Link
                href="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 flex h-10 items-center justify-center rounded-full bg-black font-[family-name:var(--font-schibsted-grotesk)] text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Log In
              </Link>
            </div>
          </div>
        )}

        {/* Hero content */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-[60px]">
          <div className="-mt-[50px] flex flex-col items-center">
            {/* Badge */}
            <div className="mb-[34px] flex items-center gap-2 rounded-full bg-white/80 py-1.5 pl-1.5 pr-4 shadow-sm backdrop-blur-sm">
              <span className="flex items-center gap-1 rounded-full bg-[#0e1311] px-2.5 py-1 text-xs font-medium text-white">
                <Star className="size-3 fill-white" />
                New
              </span>
              <span className="font-[family-name:var(--font-inter)] text-sm font-normal text-black">
                AI lead enrichment, built in
              </span>
            </div>

            {/* Headline */}
            <h1 className="max-w-[900px] text-center font-[family-name:var(--font-fustat)] text-5xl font-bold leading-none tracking-[-2.4px] text-white sm:text-6xl md:text-7xl md:tracking-[-4.8px] lg:text-[80px]">
              Turn Leads Into Revenue
            </h1>

            {/* Subtitle */}
            <p className="mt-[34px] w-full max-w-[736px] text-center font-[family-name:var(--font-fustat)] text-lg font-medium tracking-[-0.4px] text-white/70 md:w-[542px] md:text-xl">
              Upload your lead exports and get AI-powered research, scoring, and
              outreach right away. Work smarter and close deals effortlessly.
            </p>

            {/* LeadFlow AI assistant box */}
            <div className="mt-[44px] w-full max-w-[728px] rounded-[18px] bg-black/24 p-3 shadow-2xl backdrop-blur-md">
              {/* Top row: AI credits */}
              <div className="flex items-center justify-between px-1 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-[family-name:var(--font-schibsted-grotesk)] text-xs font-medium text-white">
                    60/450 AI credits
                  </span>
                  <button className="rounded-full bg-[rgba(90,225,76,0.89)] px-2.5 py-0.5 font-[family-name:var(--font-schibsted-grotesk)] text-xs font-medium text-black transition-opacity hover:opacity-90">
                    Upgrade
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-white" />
                  <span className="font-[family-name:var(--font-schibsted-grotesk)] text-xs font-medium text-white">
                    Powered by Claude
                  </span>
                </div>
              </div>

              {/* Main input area */}
              <div className="flex items-center gap-2 rounded-xl bg-white p-2 shadow-md">
                <input
                  type="text"
                  placeholder="Ask about any lead, company, or deal…"
                  className="flex-1 bg-transparent px-2 font-[family-name:var(--font-schibsted-grotesk)] text-base text-black outline-none placeholder:text-black/60"
                />
                <button
                  aria-label="Ask LeadFlow"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-black text-white transition-opacity hover:opacity-90"
                >
                  <ArrowUp className="size-4" />
                </button>
              </div>

              {/* Bottom row: CRM actions + counter */}
              <div className="flex items-center justify-between px-1 pt-2.5 gap-2">
                <div className="flex items-center gap-1 sm:gap-2">
                  <button className="flex items-center gap-1 sm:gap-1.5 rounded-md bg-[#f8f8f8] px-1.5 py-1 sm:px-2.5 sm:py-1.5 font-[family-name:var(--font-schibsted-grotesk)] text-[10px] sm:text-xs font-medium text-black/80 transition-colors hover:bg-white whitespace-nowrap">
                    <Upload className="size-3 sm:size-3.5" />
                    Import CSV
                  </button>
                  <button className="flex items-center gap-1 sm:gap-1.5 rounded-md bg-[#f8f8f8] px-1.5 py-1 sm:px-2.5 sm:py-1.5 font-[family-name:var(--font-schibsted-grotesk)] text-[10px] sm:text-xs font-medium text-black/80 transition-colors hover:bg-white whitespace-nowrap">
                    <Sparkles className="size-3 sm:size-3.5" />
                    Enrich
                  </button>
                  <button className="flex items-center gap-1 sm:gap-1.5 rounded-md bg-[#f8f8f8] px-1.5 py-1 sm:px-2.5 sm:py-1.5 font-[family-name:var(--font-schibsted-grotesk)] text-[10px] sm:text-xs font-medium text-black/80 transition-colors hover:bg-white whitespace-nowrap">
                    <Send className="size-3 sm:size-3.5" />
                    Outreach
                  </button>
                </div>
                <span className="font-[family-name:var(--font-schibsted-grotesk)] text-[10px] sm:text-xs text-white/70 whitespace-nowrap">
                  0/3,000
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
