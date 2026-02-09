"use client"

/**
 * Tiny Viber — Plan Card
 *
 * Visual card showing an implementation plan with a todo list and progress bar.
 * Rendered inline in the chat when Claude calls createPlan or updatePlan tools.
 * Styled consistently with PipelineTimeline.
 *
 * When a `planId` is provided, the card subscribes to Firestore for real-time
 * item status updates (pending → in_progress → done) as the pipeline progresses.
 * Falls back to static `items` prop for chat history / updatePlan snapshots.
 */

import {
  CheckCircle,
  CircleNotch,
  Circle,
  MinusCircle,
  ListChecks,
  XCircle,
} from "@phosphor-icons/react"
import { Progress } from "@/components/ui/progress"
import { useAICoderPlanStatus } from "@/hooks/useAICoderPlanStatus"

export interface PlanItem {
  id: string
  label: string
  status: "pending" | "in_progress" | "done" | "skipped" | "failed"
}

interface PlanCardProps {
  title?: string
  overview?: string
  items: PlanItem[]
  /** Pass the createPlan toolCallId to enable real-time Firestore updates */
  planId?: string | null
}

export function PlanCard({ title, overview, items, planId }: PlanCardProps) {
  // Subscribe to Firestore for live item statuses when planId is available
  const { liveData } = useAICoderPlanStatus(planId ?? null)

  // Use live data when available, otherwise fall back to the static props
  const displayItems = liveData?.items ?? items
  const displayTitle = liveData?.title ?? title
  const displayOverview = liveData?.overview ?? overview

  const doneCount = displayItems.filter((i) => i.status === "done").length
  const totalCount = displayItems.length
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  return (
    <div className="my-3 rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ListChecks className="h-4.5 w-4.5 text-blue-500" weight="duotone" />
        <span className="text-sm font-semibold text-foreground">
          {displayTitle || "Implementation Plan"}
        </span>
      </div>

      {/* Overview */}
      {displayOverview && (
        <p className="text-xs text-muted-foreground leading-relaxed">{displayOverview}</p>
      )}

      {/* Todo list */}
      <div className="space-y-2.5 pt-1">
        {displayItems.map((item) => (
          <div key={item.id} className="flex items-start gap-2.5">
            {/* Status icon */}
            <div className="mt-0.5 shrink-0">
              {item.status === "done" ? (
                <CheckCircle className="h-4 w-4 text-emerald-500" weight="fill" />
              ) : item.status === "in_progress" ? (
                <CircleNotch className="h-4 w-4 text-blue-500 animate-spin" />
              ) : item.status === "skipped" ? (
                <MinusCircle className="h-4 w-4 text-muted-foreground/50" weight="fill" />
              ) : item.status === "failed" ? (
                <XCircle className="h-4 w-4 text-red-500" weight="fill" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/40" />
              )}
            </div>

            {/* Label */}
            <span
              className={`text-sm leading-snug ${
                item.status === "done"
                  ? "text-foreground"
                  : item.status === "in_progress"
                    ? "text-foreground font-medium"
                    : item.status === "skipped"
                      ? "text-muted-foreground/50 line-through"
                      : item.status === "failed"
                        ? "text-red-500"
                        : "text-muted-foreground/70"
              }`}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="pt-2 border-t border-border/30 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {doneCount} of {totalCount} completed
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            {progressPercent}%
          </span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>
    </div>
  )
}
