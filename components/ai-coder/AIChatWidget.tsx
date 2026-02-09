"use client"

/**
 * AI Coder — Floating Chat Widget
 *
 * Intercom-style floating button that expands into a chat panel.
 *
 * States:
 * - Collapsed: round button in bottom-right corner
 * - Compact: standard 420x600 chat panel
 * - Expanded: near-fullscreen single-pane layout
 *
 * The triggerCodeChange tool creates PRs directly — no preview pane needed.
 */

import { useState, useCallback } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Robot, X, ArrowsOut, ArrowsIn } from "@phosphor-icons/react"
import { AIChatPanel } from "./AIChatPanel"
import { useAuth } from "@/contexts/AuthContext"
import config from "@/ai-coder.config"

export function AIChatWidget() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // TODO: Re-enable owner-only restriction once auth is fixed
  // if (!user || user.role !== "owner") return null

  /** Toggle between compact and expanded layout */
  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  // ── Dynamic panel sizing ──
  const panelClasses = isExpanded
    ? "fixed inset-4 z-50 rounded-2xl border border-border/60 bg-background shadow-2xl shadow-black/15 overflow-hidden flex flex-col"
    : "fixed bottom-24 right-6 z-50 w-[420px] h-[600px] max-h-[calc(100vh-120px)] rounded-2xl border border-border/60 bg-background shadow-2xl shadow-black/10 overflow-hidden flex flex-col"

  return (
    <>
      {/* Overlay — dims background when chat is open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={`fixed inset-0 z-40 ${isExpanded ? "bg-black/40" : "bg-black/20 md:hidden"}`}
            onClick={() => {
              if (!isExpanded) setIsOpen(false)
            }}
          />
        )}
      </AnimatePresence>

      {/* Chat panel — compact or expanded */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={panelClasses}
            style={!isExpanded ? { maxWidth: "calc(100vw - 32px)" } : undefined}
          >
            {/* Widget header */}
            <div className="flex items-center justify-between border-b border-border/40 px-4 py-3 bg-background shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                  <Robot className="h-4.5 w-4.5 text-blue-500" weight="duotone" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold leading-none">AI Coder</h2>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Request code changes
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Expand / collapse toggle */}
                <button
                  onClick={toggleExpanded}
                  className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted transition-colors"
                  title={isExpanded ? "Compact view" : "Expand view"}
                >
                  {isExpanded ? (
                    <ArrowsIn className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ArrowsOut className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {/* Close */}
                <button
                  onClick={() => {
                    setIsOpen(false)
                    if (isExpanded) setIsExpanded(false)
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Chat panel fills remaining height */}
            <div className="flex-1 overflow-hidden">
              <AIChatPanel
                skills={config.skills}
                embedded
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating action button */}
      <motion.button
        onClick={() => {
          setIsOpen(!isOpen)
          setHasUnread(false)
        }}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full shadow-lg shadow-blue-500/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          width: isOpen ? 48 : 56,
          height: isOpen ? 48 : 56,
          backgroundColor: isOpen ? "var(--muted)" : "rgb(59, 130, 246)",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-5 w-5 text-muted-foreground" weight="bold" />
            </motion.div>
          ) : (
            <motion.div
              key="robot"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Robot className="h-6 w-6 text-white" weight="fill" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unread indicator */}
        {hasUnread && !isOpen && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-white" />
          </span>
        )}
      </motion.button>
    </>
  )
}
