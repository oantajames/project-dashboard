"use client"

/**
 * Tiny Viber — Floating Chat Widget
 *
 * Intercom-style floating button that expands into a chat panel.
 *
 * States:
 * - Collapsed: round button in bottom-right corner
 * - Compact: standard 420x600 chat panel
 * - Expanded: near-fullscreen single-pane layout
 *
 * Sessions are persisted to Firestore. Reopening the widget restores
 * the last active session. A "New Chat" button starts a fresh session.
 */

import { useState, useCallback, useEffect } from "react"
import { AnimatePresence, motion } from "motion/react"
import { X, ArrowsOut, ArrowsIn, Plus, GearSix, ClockCounterClockwise, ChatCircleDots } from "@phosphor-icons/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AIChatPanel } from "./AIChatPanel"
import { SettingsPanel } from "./SettingsPanel"
import { TinyFace } from "./TinyFace"
import { useAICoderSessions } from "@/hooks/useAICoderHistory"
import { useAuth } from "@/contexts/AuthContext"
import config from "@/ai-coder.config"

export function AIChatWidget() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isAIWorking, setIsAIWorking] = useState(false)

  // ── Session Management ──
  const { sessions, createSession } = useAICoderSessions()
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [isCreatingSession, setIsCreatingSession] = useState(false)

  // Auto-select the most recent session on load, or create one on first open
  useEffect(() => {
    if (activeSessionId) return // already have a session
    if (sessions.length > 0) {
      setActiveSessionId(sessions[0].id) // most recent
    }
  }, [sessions, activeSessionId])

  /** Create a new session when the widget first opens (if none exist) */
  const ensureSession = useCallback(async () => {
    if (activeSessionId || isCreatingSession) return
    setIsCreatingSession(true)
    try {
      const id = await createSession(undefined, "New chat")
      if (id) setActiveSessionId(id)
    } catch (err) {
      console.error("[TinyViber] Failed to create session:", err)
    } finally {
      setIsCreatingSession(false)
    }
  }, [activeSessionId, isCreatingSession, createSession])

  /** Handle opening the widget */
  const handleOpen = useCallback(() => {
    setIsOpen(true)
    setHasUnread(false)
    // Ensure a session exists
    if (!activeSessionId && sessions.length === 0) {
      ensureSession()
    }
  }, [activeSessionId, sessions.length, ensureSession])

  /** Start a new chat session */
  const handleNewChat = useCallback(async () => {
    setIsCreatingSession(true)
    try {
      const id = await createSession(undefined, "New chat")
      if (id) setActiveSessionId(id)
    } catch (err) {
      console.error("[TinyViber] Failed to create session:", err)
    } finally {
      setIsCreatingSession(false)
    }
  }, [createSession])

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
                  <TinyFace animate={isAIWorking} className="text-xs text-blue-500" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold leading-none">Tiny Viber</h2>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Request code changes
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* New Chat */}
                <button
                  onClick={handleNewChat}
                  disabled={isCreatingSession}
                  className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                  title="New chat"
                >
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </button>

                {/* Session history */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted transition-colors"
                      title="Chat history"
                    >
                      <ClockCounterClockwise className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel className="text-xs">Recent Chats</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {sessions.length === 0 ? (
                      <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                        No previous chats
                      </div>
                    ) : (
                      sessions.slice(0, 10).map((session) => (
                        <DropdownMenuItem
                          key={session.id}
                          onClick={() => setActiveSessionId(session.id)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <ChatCircleDots className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs truncate">
                              {session.title || "Untitled chat"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatRelativeTime(session.updatedAt)}
                            </p>
                          </div>
                          {session.id === activeSessionId && (
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                          )}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Settings */}
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted transition-colors"
                  title="Settings"
                >
                  <GearSix className="h-4 w-4 text-muted-foreground" />
                </button>

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
              {/* Panel rendered below, outside AnimatePresence */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel — kept mounted so useChat state survives open/close.
          Rendered in a portal-style fixed div that sits behind the panel shell. */}
      {activeSessionId && (
        <div
          className={
            isOpen
              ? isExpanded
                ? "fixed inset-4 z-50 pt-[57px] rounded-2xl overflow-hidden pointer-events-auto"
                : "fixed bottom-24 right-6 z-50 w-[420px] h-[600px] max-h-[calc(100vh-120px)] pt-[57px] rounded-2xl overflow-hidden pointer-events-auto"
              : "fixed -left-[9999px] w-0 h-0 overflow-hidden pointer-events-none opacity-0"
          }
          style={!isExpanded && isOpen ? { maxWidth: "calc(100vw - 32px)" } : undefined}
        >
          <AIChatPanel
            key={activeSessionId}
            skills={config.skills}
            embedded
            sessionId={activeSessionId}
            onLoadingChange={setIsAIWorking}
          />
        </div>
      )}

      {/* Floating action button */}
      <motion.button
        onClick={() => {
          if (isOpen) {
            setIsOpen(false)
          } else {
            handleOpen()
          }
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
              key="face"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <TinyFace animate={isAIWorking} className="text-xs text-white" />
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

      {/* Settings dialog */}
      <SettingsPanel open={showSettings} onOpenChange={setShowSettings} />
    </>
  )
}

// ── Helpers ──

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHr = Math.floor(diffMs / 3_600_000)
  const diffDay = Math.floor(diffMs / 86_400_000)

  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}
