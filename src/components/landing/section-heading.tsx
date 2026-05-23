import { type ReactNode } from "react"

interface SectionHeadingProps {
  eyebrow?: string
  title: ReactNode
  subtitle?: ReactNode
  align?: "center" | "left"
  className?: string
}

// Shared heading for landing sections so every section inherits the hero's
// typographic system: Schibsted Grotesk eyebrow, Fustat display title, and a
// muted Fustat intro line.
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className = "",
}: SectionHeadingProps) {
  const alignment =
    align === "center" ? "items-center text-center" : "items-start text-left"

  return (
    <div className={`flex flex-col ${alignment} ${className}`}>
      {eyebrow && (
        <span className="mb-4 font-[family-name:var(--font-schibsted-grotesk)] text-xs font-semibold uppercase tracking-[0.18em] text-[#3fce32]">
          {eyebrow}
        </span>
      )}
      <h2 className="max-w-3xl font-[family-name:var(--font-fustat)] text-4xl font-bold leading-[1.05] tracking-[-1.6px] text-black sm:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-5 max-w-2xl font-[family-name:var(--font-fustat)] text-lg font-medium leading-relaxed tracking-[-0.2px] text-[#505050] ${
            align === "center" ? "mx-auto" : ""
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
