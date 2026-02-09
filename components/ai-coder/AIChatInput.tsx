"use client"

/**
 * AI Coder — Chat Input
 *
 * Input area with skill selector, screen context capture button,
 * stop button, and send button.
 */

import { type FormEvent } from "react"
import { AnimatePresence } from "motion/react"
import { Button } from "@/components/ui/button"
import { SkillSelector } from "./SkillSelector"
import { ScreenContextBadge, type ScreenContext } from "./ScreenContextBadge"
import { PaperPlaneRight, Crosshair, Stop } from "@phosphor-icons/react"
import type { AICoderSkill } from "@/lib/ai-coder/types"

interface AIChatInputProps {
  input: string
  skills: AICoderSkill[]
  selectedSkillId: string
  isLoading: boolean
  screenContext: ScreenContext | null
  isScanning: boolean
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  onSkillChange: (skillId: string) => void
  onScanScreen: () => void
  onRemoveContext: () => void
  onStop: () => void
}

export function AIChatInput({
  input,
  skills,
  selectedSkillId,
  isLoading,
  screenContext,
  isScanning,
  onInputChange,
  onSubmit,
  onSkillChange,
  onScanScreen,
  onRemoveContext,
  onStop,
}: AIChatInputProps) {
  // Handle Enter to submit (Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isLoading) {
        const form = e.currentTarget.closest("form")
        if (form) {
          form.requestSubmit()
        }
      }
    }
  }

  return (
    <div className="border-t border-border/40 bg-background p-4">
      {/* Top row: skill selector + scan button */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Skill:</span>
          <SkillSelector
            skills={skills}
            selectedSkillId={selectedSkillId}
            onSkillChange={onSkillChange}
            disabled={isLoading}
          />
          {skills.find((s) => s.id === selectedSkillId)?.requiresApproval && (
            <span className="text-[10px] text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10 px-2 py-0.5 rounded-full">
              Requires review
            </span>
          )}
        </div>

        {/* Scan screen button */}
        <button
          onClick={onScanScreen}
          disabled={isLoading || isScanning}
          className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded-md hover:bg-blue-500/5"
          title="Capture the current screen as context"
        >
          <Crosshair className={`h-3.5 w-3.5 ${isScanning ? "animate-pulse text-blue-500" : ""}`} weight="bold" />
          <span>{isScanning ? "Scanning..." : "Read context"}</span>
        </button>
      </div>

      {/* Screen context badge — shown when context is captured */}
      <AnimatePresence>
        {screenContext && (
          <div className="mb-2.5">
            <ScreenContextBadge context={screenContext} onRemove={onRemoveContext} />
          </div>
        )}
      </AnimatePresence>

      {/* Input form */}
      <form onSubmit={onSubmit} className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            value={input}
            onChange={onInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              screenContext
                ? `Ask about ${screenContext.screenName}...`
                : "Describe the change you'd like to make..."
            }
            disabled={isLoading}
            rows={1}
            className="w-full resize-none rounded-lg border border-border/60 bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 disabled:opacity-50 disabled:cursor-not-allowed min-h-[42px] max-h-[120px]"
            style={{
              height: "auto",
              minHeight: "42px",
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = "auto"
              target.style.height = Math.min(target.scrollHeight, 120) + "px"
            }}
          />
        </div>

        {/* Send or Stop button — swaps based on loading state */}
        {isLoading ? (
          <Button
            type="button"
            size="icon"
            variant="destructive"
            onClick={onStop}
            className="h-[42px] w-[42px] shrink-0"
            title="Stop generation and kill sandbox"
          >
            <Stop className="h-4 w-4" weight="fill" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim()}
            className="h-[42px] w-[42px] shrink-0"
          >
            <PaperPlaneRight className="h-4 w-4" weight="fill" />
          </Button>
        )}
      </form>

      {/* Helper text */}
      <p className="mt-2 text-[10px] text-muted-foreground">
        {isLoading
          ? "Press the stop button to cancel the current operation."
          : `Press Enter to send, Shift+Enter for new line.${screenContext ? " Context from current screen will be included." : ""}`
        }
      </p>
    </div>
  )
}
