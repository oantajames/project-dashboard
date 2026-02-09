"use client"

/**
 * Tiny Viber — Animated Face Icon
 *
 * The brand icon for Tiny Viber. Renders a kaomoji-style face.
 *
 * - Static (default): shows {•‿•}
 * - Animated: cycles through a curated set of faces with bracket variations,
 *   creating a playful "thinking" effect when the AI is working.
 */

import { useState, useEffect, useCallback } from "react"

// ── Face Parts ──

const EYES = ["•", "◉", "◈", "●"]
const MOUTHS = ["‿", "ᴗ", "◡", "_", "ω"]
const BRACKETS: [string, string][] = [
  ["(", ")"],
  ["[", "]"],
  ["{", "}"],
  ["<", ">"],
]

/** The default static face */
const DEFAULT_FACE = "{•‿•}"

/** Build a face string from parts */
function buildFace(
  eyes: string,
  mouth: string,
  brackets: [string, string]
): string {
  return `${brackets[0]}${eyes}${mouth}${eyes}${brackets[1]}`
}

/** Generate a random face different from the current one */
function randomFace(current: string): string {
  let face = current
  // Keep generating until we get something different
  let attempts = 0
  while (face === current && attempts < 10) {
    const eyes = EYES[Math.floor(Math.random() * EYES.length)]
    const mouth = MOUTHS[Math.floor(Math.random() * MOUTHS.length)]
    const brackets = BRACKETS[Math.floor(Math.random() * BRACKETS.length)]
    face = buildFace(eyes, mouth, brackets)
    attempts++
  }
  return face
}

// ── Component ──

interface TinyFaceProps {
  /** Enable cycling animation (use when AI is working) */
  animate?: boolean
  /** Animation speed in ms (default: 600) */
  interval?: number
  /** Font size class (default: "text-sm") */
  className?: string
}

export function TinyFace({
  animate = false,
  interval = 600,
  className = "text-sm",
}: TinyFaceProps) {
  const [face, setFace] = useState(DEFAULT_FACE)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const cycleFace = useCallback(() => {
    setIsTransitioning(true)
    // Fade out, swap, fade in
    setTimeout(() => {
      setFace((prev) => randomFace(prev))
      setIsTransitioning(false)
    }, 120)
  }, [])

  useEffect(() => {
    if (!animate) {
      // Reset to default when animation stops
      setFace(DEFAULT_FACE)
      setIsTransitioning(false)
      return
    }

    // Start with a random face immediately
    setFace(randomFace(DEFAULT_FACE))

    const timer = setInterval(cycleFace, interval)
    return () => clearInterval(timer)
  }, [animate, interval, cycleFace])

  return (
    <span
      className={`inline-flex items-center justify-center font-mono leading-none select-none ${className}`}
      style={{
        opacity: isTransitioning ? 0.3 : 1,
        transition: "opacity 120ms ease-in-out",
      }}
      aria-label="Tiny Viber"
    >
      {face}
    </span>
  )
}
