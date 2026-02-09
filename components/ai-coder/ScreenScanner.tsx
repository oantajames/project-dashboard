"use client"

/**
 * AI Coder — Screen Scanner
 *
 * Full-screen overlay animation that "scans" the current page.
 * Shows a sweeping line effect, then resolves with the detected screen context.
 */

import { useEffect, useState } from "react"
import { motion } from "motion/react"

interface ScreenScannerProps {
  onComplete: () => void
}

export function ScreenScanner({ onComplete }: ScreenScannerProps) {
  const [phase, setPhase] = useState<"scanning" | "done">("scanning")

  useEffect(() => {
    // Complete the scan after the animation plays
    const timer = setTimeout(() => {
      setPhase("done")
      setTimeout(onComplete, 300)
    }, 1200)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] pointer-events-none"
    >
      {/* Subtle tinted overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-blue-500/[0.03]"
      />

      {/* Scan line — sweeps top to bottom */}
      <motion.div
        initial={{ top: "-4px" }}
        animate={{ top: "100%" }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className="absolute left-0 right-0 h-[3px]"
      >
        {/* Glow line */}
        <div className="absolute inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
        {/* Soft glow trail above the line */}
        <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-b from-transparent to-blue-500/10" />
        {/* Soft glow trail below the line */}
        <div className="absolute inset-x-0 top-[3px] h-12 bg-gradient-to-b from-blue-500/8 to-transparent" />
      </motion.div>

      {/* Corner brackets — appear during scan */}
      <motion.div
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="absolute inset-4"
      >
        {/* Top-left bracket */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-500/50 rounded-tl-sm" />
        {/* Top-right bracket */}
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-500/50 rounded-tr-sm" />
        {/* Bottom-left bracket */}
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-500/50 rounded-bl-sm" />
        {/* Bottom-right bracket */}
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-500/50 rounded-br-sm" />
      </motion.div>

      {/* "Scanning..." label */}
      {phase === "scanning" && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm border border-blue-500/30 rounded-full px-4 py-2 shadow-lg shadow-blue-500/10">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              Reading context...
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
