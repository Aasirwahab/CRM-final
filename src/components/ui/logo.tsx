"use client"

import React from "react"
import { motion } from "framer-motion"

interface LogoProps {
  className?: string
  iconSize?: number
  showText?: boolean
  textSize?: string
  textColor?: string
  theme?: 'purple' | 'green'
}

export function Logo({
  className = "",
  iconSize = 36,
  showText = true,
  textSize = "text-xl",
  textColor,
  theme = 'purple',
}: LogoProps) {
  const isGreen = theme === 'green'

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <motion.div
        className="relative flex items-center justify-center cursor-pointer"
        style={{ width: iconSize, height: iconSize }}
        whileHover="hover"
        initial="initial"
        animate="animate"
      >
        <svg
          viewBox="0 0 50 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 w-full h-full"
        >
          <defs>
            {/* Purple Gradients */}
            <linearGradient id="lf-logo-grad-1-purple" x1="12" y1="12" x2="34" y2="34" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
            <linearGradient id="lf-logo-grad-2-purple" x1="38" y1="38" x2="16" y2="16" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>

            {/* Green Gradients */}
            <linearGradient id="lf-logo-grad-1-green" x1="12" y1="12" x2="34" y2="34" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3fce32" />
              <stop offset="100%" stopColor="#5ae14c" />
            </linearGradient>
            <linearGradient id="lf-logo-grad-2-green" x1="38" y1="38" x2="16" y2="16" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#5ae14c" />
            </linearGradient>
          </defs>

          {/* Left Leaf Segment */}
          <motion.path
            d="M 16 34 C 10 28, 10 18, 16 12 C 22 6, 30 10, 34 16 L 16 34 Z"
            fill={isGreen ? "url(#lf-logo-grad-1-green)" : "url(#lf-logo-grad-1-purple)"}
            variants={{
              initial: { scale: 0.8, opacity: 0, rotate: -15 },
              animate: { scale: 1, opacity: 1, rotate: 0 },
              hover: { rotate: -8, scale: 1.05 }
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />

          {/* Right Leaf Segment */}
          <motion.path
            d="M 34 16 C 40 22, 40 32, 34 38 C 28 44, 20 40, 16 34 L 34 16 Z"
            fill={isGreen ? "url(#lf-logo-grad-2-green)" : "url(#lf-logo-grad-2-purple)"}
            opacity="0.95"
            variants={{
              initial: { scale: 0.8, opacity: 0, rotate: 15 },
              animate: { scale: 1, opacity: 1, rotate: 0 },
              hover: { rotate: 8, scale: 1.05 }
            }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          />

          {/* Center Connection Node */}
          <motion.circle
            cx="25"
            cy="25"
            r="3.5"
            fill="#ffffff"
            variants={{
              initial: { scale: 0 },
              animate: { scale: 1 },
              hover: { scale: 1.25 }
            }}
            transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.4 }}
          />
        </svg>
      </motion.div>

      {showText && (
        <span
          className={`${textSize} font-extrabold tracking-tight ${textColor || ""}`}
          style={textColor ? undefined : {
            background: isGreen 
              ? "linear-gradient(to right, #3fce32, #5ae14c, #10b981)"
              : "linear-gradient(to right, #4f46e5, #6d28d9, #7c3aed)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          LeadFlow
        </span>
      )}
    </div>
  )
}
