"use client"

/**
 * Tiny Viber — Chat Panel
 *
 * Main chat interface: message list, input, skill selector, screen context.
 * Uses AI SDK v6 useChat hook for streaming communication with the API route.
 *
 * When a `sessionId` is provided, messages are loaded from Firestore on mount
 * and new messages are persisted after each turn completes.
 */

import { useState, useRef, useEffect, useCallback, useMemo, type FormEvent } from "react"
import { usePathname } from "next/navigation"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { AnimatePresence } from "motion/react"
import { AIChatMessage } from "./AIChatMessage"
import { AIChatInput } from "./AIChatInput"
import { ScreenScanner } from "./ScreenScanner"
import { resolveScreenContext, type ScreenContext } from "./ScreenContextBadge"
import { useAICoderMessages } from "@/hooks/useAICoderHistory"
import { useAuth } from "@/contexts/AuthContext"
import { Sparkle } from "@phosphor-icons/react"
import { TinyFace } from "./TinyFace"
import type { AICoderSkill } from "@/lib/ai-coder/types"
import type { UIMessage } from "ai"

interface AIChatPanelProps {
  skills: AICoderSkill[]
  apiEndpoint?: string
  /** When true, hides the header (used inside the floating widget) */
  embedded?: boolean
  /** Firestore session ID — when provided, messages are loaded/saved */
  sessionId?: string | null
  /** Called when the AI loading state changes (for parent animation) */
  onLoadingChange?: (loading: boolean) => void
}

export function AIChatPanel({
  skills,
  apiEndpoint = "/api/ai-coder/chat",
  embedded = false,
  sessionId = null,
  onLoadingChange,
}: AIChatPanelProps) {
  const { user } = useAuth()
  const pathname = usePathname()
  const [selectedSkillId, setSelectedSkillId] = useState(skills[0]?.id || "")
  const [input, setInput] = useState("")
  const [screenContext, setScreenContext] = useState<ScreenContext | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)

  // ── Firestore persistence ──
  const {
    messages: firestoreMessages,
    loading: firestoreLoading,
    saveMessage,
    upsertMessage,
  } = useAICoderMessages(sessionId)

  // Convert Firestore messages to AI SDK UIMessage format for initialMessages
  const initialMessages = useMemo<UIMessage[]>(() => {
    if (!sessionId || firestoreLoading || firestoreMessages.length === 0) return []

    return firestoreMessages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      parts: msg.parts
        ? (msg.parts as UIMessage["parts"])
        : [{ type: "text" as const, text: msg.content }],
      createdAt: msg.createdAt,
    }))
  }, [sessionId, firestoreLoading, firestoreMessages])

  // Track which assistant messages have been finalized (saved with complete tool outputs).
  // Messages loaded from Firestore are considered finalized.
  const finalizedIds = useRef<Set<string>>(new Set(
    firestoreMessages.map((m) => m.id)
  ))
  useEffect(() => {
    for (const msg of firestoreMessages) {
      finalizedIds.current.add(msg.id)
    }
  }, [firestoreMessages])

  // Refs for stable transport closure
  const skillIdRef = useRef(selectedSkillId)
  const screenContextRef = useRef(screenContext)

  useEffect(() => { skillIdRef.current = selectedSkillId }, [selectedSkillId])
  useEffect(() => { screenContextRef.current = screenContext }, [screenContext])

  // Stable transport instance
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: apiEndpoint,
        headers: async () => {
          const { auth } = await import("@/lib/firebase/config")
          const token = await auth.currentUser?.getIdToken()
          return {
            Authorization: token ? `Bearer ${token}` : "",
          }
        },
        body: () => {
          const ctx = screenContextRef.current
          return {
            skillId: skillIdRef.current,
            ...(ctx && {
              screenContext: {
                screenName: ctx.screenName,
                route: ctx.route,
                description: ctx.description,
              },
            }),
          }
        },
      }),
    [apiEndpoint]
  )

  const {
    messages,
    setMessages,
    sendMessage,
    stop,
    status,
    error,
  } = useChat({
    transport,
    // Seed with persisted messages when session has history
    initialMessages: initialMessages.length > 0 ? initialMessages : undefined,
  })

  // When Firestore messages load after the initial render (async),
  // push them into useChat so chat history is visible on session switch.
  const hasLoadedHistory = useRef(false)
  useEffect(() => {
    if (hasLoadedHistory.current) return
    if (!sessionId || firestoreLoading || initialMessages.length === 0) return
    // Only set if useChat is still empty (initialMessages arrived too late)
    if (messages.length === 0 && initialMessages.length > 0) {
      setMessages(initialMessages)
    }
    hasLoadedHistory.current = true
  }, [sessionId, firestoreLoading, initialMessages, messages.length, setMessages])

  // Refs for save-on-unmount (capture latest values without stale closures)
  // NOTE: These must come AFTER useChat so `messages` is defined
  const messagesRef = useRef(messages)
  const upsertMessageRef = useRef(upsertMessage)
  const sessionIdRef = useRef(sessionId)
  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { upsertMessageRef.current = upsertMessage }, [upsertMessage])
  useEffect(() => { sessionIdRef.current = sessionId }, [sessionId])

  const isLoading = status === "submitted" || status === "streaming"
  const prevStatusRef = useRef(status)

  // Notify parent of loading state changes (for animated icon)
  useEffect(() => {
    onLoadingChange?.(isLoading)
  }, [isLoading, onLoadingChange])

  // ── Helper: extract plain text from message parts ──
  const extractText = (msg: UIMessage) =>
    msg.parts
      ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("\n") || ""

  // ── Helper: upsert an assistant message (idempotent — safe to call multiple times) ──
  const upsertAssistantMsg = useCallback(
    (msg: UIMessage) => {
      if (!sessionId || msg.role !== "assistant") return
      upsertMessage(
        msg.id,
        "assistant",
        extractText(msg),
        msg.parts as unknown[],
      ).then(() => {
        finalizedIds.current.add(msg.id)
      }).catch((err) => {
        console.error("[TinyViber] Failed to upsert assistant message:", err)
      })
    },
    [sessionId, upsertMessage]
  )

  // ── 1. Finalize ALL assistant messages when a turn completes (status → ready) ──
  // This overwrites any partial streaming saves with the final version
  // that includes complete tool outputs.
  useEffect(() => {
    const prevStatus = prevStatusRef.current
    prevStatusRef.current = status

    if (!sessionId) return
    if (status !== "ready") return
    if (prevStatus !== "streaming" && prevStatus !== "submitted") return

    // Upsert every assistant message from this conversation.
    // setDoc is idempotent — already-finalized messages are harmlessly overwritten.
    const assistantMsgs = messages.filter((m) => m.role === "assistant")
    for (const msg of assistantMsgs) {
      upsertAssistantMsg(msg)
    }
  }, [status, messages, sessionId, upsertAssistantMsg])

  // ── 2. Draft-save assistant messages during streaming (crash recovery) ──
  // Saves a snapshot once after 5s of streaming. The turn-complete handler
  // will overwrite this with the final version.
  useEffect(() => {
    if (!sessionId || status !== "streaming") return

    const timer = setTimeout(() => {
      const assistantMsgs = messagesRef.current.filter(
        (m) => m.role === "assistant" && !finalizedIds.current.has(m.id)
      )
      for (const msg of assistantMsgs) {
        upsertMessage(
          msg.id,
          "assistant",
          extractText(msg),
          msg.parts as unknown[],
        ).catch(() => {})
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [sessionId, status, upsertMessage])

  // ── 3. Save on unmount (failsafe when switching sessions or closing) ──
  useEffect(() => {
    return () => {
      if (!sessionIdRef.current) return
      const unfinalized = messagesRef.current.filter(
        (m) => m.role === "assistant" && !finalizedIds.current.has(m.id)
      )
      for (const msg of unfinalized) {
        const textContent = msg.parts
          ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join("\n") || ""
        // Fire-and-forget upsert on unmount — uses setDoc so it won't
        // create duplicates if the message was already draft-saved.
        upsertMessageRef.current(
          msg.id,
          "assistant",
          textContent,
          msg.parts as unknown[],
        ).catch(() => {})
      }
    }
  }, []) // empty deps: only runs on unmount

  /** Stop the Claude stream AND kill any running E2B sandbox */
  const handleStop = useCallback(async () => {
    stop()
    try {
      await fetch("/api/ai-coder/kill", { method: "POST" })
    } catch {
      // Best-effort
    }
  }, [stop])

  // Track whether the user is scrolled near the bottom of the chat.
  // If they've scrolled up to read, we don't force them back down.
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      // "Near bottom" = within 120px of the bottom edge
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 120
    }

    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [])

  // Auto-scroll only when the user is already near the bottom
  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    const text = input.trim()

    // Save user message to Firestore immediately (don't wait for turn to complete)
    if (sessionId) {
      saveMessage("user", text, [{ type: "text", text }]).catch((err) => {
        console.error("[TinyViber] Failed to save user message:", err)
      })
    }

    sendMessage({ text })
    setInput("")
  }

  // ── Screen Context ──

  const handleScanScreen = useCallback(() => {
    if (isScanning) return
    setIsScanning(true)
  }, [isScanning])

  const handleScanComplete = useCallback(() => {
    const ctx = resolveScreenContext(pathname)
    setScreenContext(ctx)
    setIsScanning(false)
  }, [pathname])

  const handleRemoveContext = useCallback(() => {
    setScreenContext(null)
  }, [])

  // Show animated face while Firestore messages are loading
  if (sessionId && firestoreLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <TinyFace animate className="text-2xl text-blue-500" />
        <p className="text-xs text-muted-foreground mt-2">Loading chat...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header — hidden when embedded */}
      {!embedded && (
        <div className="border-b border-border/40 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
              <TinyFace animate={isLoading} className="text-sm text-blue-500" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Tiny Viber</h1>
              <p className="text-xs text-muted-foreground">
                Request code changes with AI assistance
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div ref={scrollContainerRef} className={`flex-1 overflow-y-auto py-4 ${embedded ? "px-4" : "px-6"}`}>
        {messages.length === 0 ? (
          <EmptyState compact={embedded} />
        ) : (
          <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map((message) => (
              <AIChatMessage key={message.id} message={message} />
            ))}

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                <p className="text-sm text-destructive">{error.message}</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <AIChatInput
        input={input}
        skills={skills}
        selectedSkillId={selectedSkillId}
        isLoading={isLoading}
        screenContext={screenContext}
        isScanning={isScanning}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        onSkillChange={setSelectedSkillId}
        onScanScreen={handleScanScreen}
        onRemoveContext={handleRemoveContext}
        onStop={handleStop}
      />

      {/* Full-screen scan overlay */}
      <AnimatePresence>
        {isScanning && <ScreenScanner onComplete={handleScanComplete} />}
      </AnimatePresence>
    </div>
  )
}

// ── Empty State ──

function EmptyState({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
      <div className={`flex items-center justify-center rounded-2xl bg-blue-500/10 ${compact ? "h-12 w-12 mb-3" : "h-16 w-16 mb-4"}`}>
        <Sparkle className={`text-blue-500 ${compact ? "h-6 w-6" : "h-8 w-8"}`} weight="duotone" />
      </div>
      <h2 className={`font-semibold ${compact ? "text-base mb-1" : "text-lg mb-2"}`}>Tiny Viber</h2>
      <p className={`text-muted-foreground ${compact ? "text-xs mb-4" : "text-sm mb-6"}`}>
        {compact
          ? "Describe a change and Tiny Viber will create a pull request."
          : "Describe a change you'd like to make to the codebase. Tiny Viber will plan the change, implement it, and create a pull request for review."
        }
      </p>
      <div className="grid gap-2 w-full">
        <ExamplePrompt text="Add a dark mode toggle to the project cards" />
        <ExamplePrompt text="Fix the spacing on the dashboard header" />
        {!compact && (
          <ExamplePrompt text="Add a new 'Priority' column to the projects table" />
        )}
      </div>
    </div>
  )
}

function ExamplePrompt({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-2.5 text-left text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground cursor-pointer transition-colors">
      &ldquo;{text}&rdquo;
    </div>
  )
}
