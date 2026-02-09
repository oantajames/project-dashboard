"use client"

/**
 * Tiny Viber — Plan Card
 *
 * Visual card showing an implementation plan with a todo list and progress bar.
 * Rendered inline in the chat when Claude calls createPlan or updatePlan tools.
 * Styled consistently with PipelineTimeline.
 */

import {
  CheckCircle,
  CircleNotch,
  Circle,
  MinusCircle,
  ListChecks,
} from "@phosphor-icons/react"
import { Progress } from "@/components/ui/progress"

export interface PlanItem {
  id: string
  label: string
  status: "pending" | "in_progress" | "done" | "skipped"
}

interface PlanCardProps {
  title?: string
  overview?: string
  items: PlanItem[]
}

export function PlanCard({ title, overview, items }: PlanCardProps) {
  const doneCount = items.filter((i) => i.status === "done").length
  const totalCount = items.length
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  return (
    <div className="my-3 rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ListChecks className="h-4.5 w-4.5 text-blue-500" weight="duotone" />
        <span className="text-sm font-semibold text-foreground">
          {title || "Implementation Plan"}
        </span>
      </div>

      {/* Overview */}
      {overview && (
        <p className="text-xs text-muted-foreground leading-relaxed">{overview}</p>
      )}

      {/* Todo list */}
      <div className="space-y-2.5 pt-1">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-2.5">
            {/* Status icon */}
            <div className="mt-0.5 shrink-0">
              {item.status === "done" ? (
                <CheckCircle className="h-4 w-4 text-emerald-500" weight="fill" />
              ) : item.status === "in_progress" ? (
                <CircleNotch className="h-4 w-4 text-blue-500 animate-spin" />
              ) : item.status === "skipped" ? (
                <MinusCircle className="h-4 w-4 text-muted-foreground/50" weight="fill" />
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
