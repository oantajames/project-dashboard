"use client"

/**
 * AI Coder — Chat Message
 *
 * Renders a single chat message. For assistant messages, detects tool
 * invocations and renders appropriate inline components (PRStatusCard,
 * PipelineTimeline) alongside regular text content.
 *
 * AI SDK v6 tool parts have the shape:
 * { type: "tool-${toolName}", toolCallId, state, input, output }
 */

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PRStatusCard } from "./PRStatusCard"
import { LivePRStatusCard } from "./LivePRStatusCard"
import { PipelineTimeline } from "./PipelineTimeline"
import { PlanCard, type PlanItem } from "./PlanCard"
import { User, ListChecks } from "@phosphor-icons/react"
import { TinyFace } from "./TinyFace"
import type { UIMessage } from "ai"

interface AIChatMessageProps {
  message: UIMessage
}

export function AIChatMessage({ message }: AIChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className={isUser ? "bg-primary/10" : "bg-blue-500/10"}>
          {isUser ? (
            <User className="h-4 w-4 text-primary" />
          ) : (
            <TinyFace className="text-[10px] text-blue-500" />
          )}
        </AvatarFallback>
      </Avatar>

      {/* Message content */}
      <div className={`flex-1 space-y-2 ${isUser ? "text-right" : ""}`}>
        {/* Label */}
        <p className="text-xs text-muted-foreground">
          {isUser ? "You" : "Tiny Viber"}
        </p>

        {/* Render message parts */}
        <div className={`space-y-2 ${isUser ? "flex flex-col items-end" : ""}`}>
          {message.parts.map((part, index) => {
            // Text parts
            if (part.type === "text") {
              if (!part.text) return null
              return (
                <div
                  key={index}
                  className={`rounded-lg px-4 py-2.5 text-sm leading-relaxed max-w-[85%] ${
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-foreground"
                  }`}
                >
                  {part.text.split("\n").map((line, i) => (
                    <p key={i} className={i > 0 ? "mt-1.5" : ""}>
                      {line}
                    </p>
                  ))}
                </div>
              )
            }

            // Tool invocation parts
            if (typeof part.type === "string" && part.type.startsWith("tool-")) {
              return renderToolPart(part as ToolPartData, index)
            }

            return null
          })}
        </div>
      </div>
    </div>
  )
}

// ── Tool Part Types ──

interface ToolPartData {
  type: string
  toolCallId: string
  state: string
  input?: unknown
  output?: unknown
  errorText?: string
}

// ── Tool Part Renderer ──

function renderToolPart(part: ToolPartData, index: number) {
  const toolName = part.type.replace("tool-", "")
  const { state, output, errorText } = part

  // Tool is still running — show appropriate progress indicator
  if (state === "input-streaming" || state === "input-available" || state === "approval-requested") {
    if (toolName === "triggerCodeChange") {
      // Pass toolCallId so PipelineTimeline can subscribe to real-time progress
      return <PipelineTimeline key={index} status="validating" requestId={part.toolCallId} />
    }
    if (toolName === "createPlan") {
      return (
        <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <ListChecks className="h-4 w-4 text-blue-500 animate-pulse" weight="duotone" />
          <span>Creating plan...</span>
        </div>
      )
    }
    if (toolName === "updatePlan") {
      return (
        <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <ListChecks className="h-4 w-4 text-blue-500 animate-pulse" weight="duotone" />
          <span>Updating plan...</span>
        </div>
      )
    }
    return (
      <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <div className="h-3 w-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <span>Working...</span>
      </div>
    )
  }

  // Tool errored
  if (state === "output-error") {
    return (
      <PRStatusCard
        key={index}
        status="failed"
        error={errorText || "Tool execution failed"}
      />
    )
  }

  // Tool completed — show result
  if (state === "output-available" && output) {
    const typedResult = output as Record<string, unknown>

    // ── createPlan / updatePlan → show PlanCard ──
    if (toolName === "createPlan" || toolName === "updatePlan") {
      return (
        <PlanCard
          key={index}
          title={typedResult.title as string | undefined}
          overview={typedResult.overview as string | undefined}
          items={typedResult.items as PlanItem[]}
        />
      )
    }

    // ── triggerCodeChange → show live PR card with webhook updates ──
    if (toolName === "triggerCodeChange") {
      // Failed status: use static PRStatusCard for error display
      if (typedResult.status === "failed") {
        return (
          <PRStatusCard
            key={index}
            status="failed"
            error={typedResult.error as string | undefined}
          />
        )
      }
      // Success: use LivePRStatusCard for real-time webhook updates
      return (
        <LivePRStatusCard
          key={index}
          requestId={typedResult.requestId as string | undefined}
          prNumber={typedResult.prNumber as number}
          prUrl={typedResult.prUrl as string}
          branchName={typedResult.branchName as string | undefined}
          filesChanged={typedResult.filesChanged as string[] | undefined}
        />
      )
    }

    // ── checkDeployStatus ──
    if (toolName === "checkDeployStatus") {
      return (
        <PRStatusCard
          key={index}
          status={typedResult.status as "success" | "failed"}
          checksStatus={typedResult.checksStatus as "pending" | "success" | "failure" | "neutral" | undefined}
          previewUrl={typedResult.previewUrl as string | undefined}
          error={typedResult.error as string | undefined}
        />
      )
    }

    // Generic tool result
    return (
      <div key={index} className="rounded-lg bg-muted/30 border border-border/40 p-3 my-1">
        <p className="text-xs text-muted-foreground mb-1">{toolName} result:</p>
        <pre className="text-xs font-mono overflow-x-auto">
          {JSON.stringify(output, null, 2)}
        </pre>
      </div>
    )
  }

  return null
}

