"use client"

/**
 * AI Coder — Chat Panel
 *
 * Main chat interface: message list, input, skill selector, screen context.
 * Uses AI SDK v6 useChat hook for streaming communication with the API route.
 *
 * The triggerCodeChange tool now creates PRs directly (no preview phase).
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
import { useAuth } from "@/contexts/AuthContext"
import { Robot, Sparkle } from "@phosphor-icons/react"
import type { AICoderSkill } from "@/lib/ai-coder/types"

interface AIChatPanelProps {
  skills: AICoderSkill[]
  apiEndpoint?: string
  /** When true, hides the header (used inside the floating widget) */
  embedded?: boolean
}

export function AIChatPanel({
  skills,
  apiEndpoint = "/api/ai-coder/chat",
  embedded = false,
}: AIChatPanelProps) {
  const { user } = useAuth()
  const pathname = usePathname()
  const [selectedSkillId, setSelectedSkillId] = useState(skills[0]?.id || "")
  const [input, setInput] = useState("")
  const [screenContext, setScreenContext] = useState<ScreenContext | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
    sendMessage,
    stop,
    status,
    error,
  } = useChat({ transport })

  const isLoading = status === "submitted" || status === "streaming"

  /** Stop the Claude stream AND kill any running E2B sandbox */
  const handleStop = useCallback(async () => {
    stop()
    try {
      await fetch("/api/ai-coder/kill", { method: "POST" })
    } catch {
      // Best-effort
    }
  }, [stop])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
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

  return (
    <div className="flex flex-col h-full">
      {/* Header — hidden when embedded */}
      {!embedded && (
        <div className="border-b border-border/40 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
              <Robot className="h-5 w-5 text-blue-500" weight="duotone" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">AI Coder</h1>
              <p className="text-xs text-muted-foreground">
                Request code changes with AI assistance
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className={`flex-1 overflow-y-auto py-4 ${embedded ? "px-4" : "px-6"}`}>
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
      <h2 className={`font-semibold ${compact ? "text-base mb-1" : "text-lg mb-2"}`}>AI Coder</h2>
      <p className={`text-muted-foreground ${compact ? "text-xs mb-4" : "text-sm mb-6"}`}>
        {compact
          ? "Describe a change and AI will create a pull request."
          : "Describe a change you'd like to make to the codebase. The AI will plan the change, implement it in a sandbox, and create a pull request for review."
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
