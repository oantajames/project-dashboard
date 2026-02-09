"use client"

/**
 * AI Coder — Pipeline Timeline
 *
 * Vertical timeline showing the progress of a code change pipeline.
 * Steps: Validating -> Creating branch -> AI coding -> Pushing -> Creating PR -> Deploying
 */

import {
  CheckCircle,
  CircleNotch,
  Circle,
  XCircle,
} from "@phosphor-icons/react"
import type { PipelineStatus } from "@/lib/ai-coder/types"

interface PipelineStep {
  id: string
  label: string
  /** Pipeline statuses that indicate this step is active or completed */
  activeAt: PipelineStatus[]
  completedAt: PipelineStatus[]
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "validating",
    label: "Validating request",
    activeAt: ["validating"],
    completedAt: ["branching", "coding", "committing", "creating_pr", "deploying", "complete"],
  },
  {
    id: "branching",
    label: "Creating branch",
    activeAt: ["branching"],
    completedAt: ["coding", "committing", "creating_pr", "deploying", "complete"],
  },
  {
    id: "coding",
    label: "AI agent coding",
    activeAt: ["coding"],
    completedAt: ["committing", "creating_pr", "deploying", "complete"],
  },
  {
    id: "committing",
    label: "Pushing changes",
    activeAt: ["committing"],
    completedAt: ["creating_pr", "deploying", "complete"],
  },
  {
    id: "creating_pr",
    label: "Creating pull request",
    activeAt: ["creating_pr"],
    completedAt: ["deploying", "complete"],
  },
  {
    id: "deploying",
    label: "Deploying via Vercel",
    activeAt: ["deploying"],
    completedAt: ["complete"],
  },
]

interface PipelineTimelineProps {
  status: PipelineStatus
  error?: string
}

export function PipelineTimeline({ status, error }: PipelineTimelineProps) {
  const isFailed = status === "failed"

  return (
    <div className="my-3 rounded-lg border border-border/60 bg-muted/30 p-4">
      <div className="space-y-3">
        {PIPELINE_STEPS.map((step, index) => {
          const isCompleted = step.completedAt.includes(status)
          const isActive = step.activeAt.includes(status)
          const isPending = !isCompleted && !isActive
          // If failed, the currently active step is the failure point
          const isFailurePoint = isFailed && isActive

          return (
            <div key={step.id} className="flex items-center gap-3">
              {/* Icon */}
              {isFailurePoint ? (
                <XCircle className="h-4.5 w-4.5 text-destructive" weight="fill" />
              ) : isCompleted ? (
                <CheckCircle className="h-4.5 w-4.5 text-emerald-500" weight="fill" />
              ) : isActive ? (
                <CircleNotch className="h-4.5 w-4.5 text-blue-500 animate-spin" />
              ) : (
                <Circle className="h-4.5 w-4.5 text-muted-foreground/40" />
              )}

              {/* Label */}
              <span
                className={`text-sm ${
                  isFailurePoint
                    ? "text-destructive font-medium"
                    : isCompleted
                      ? "text-foreground"
                      : isActive
                        ? "text-foreground font-medium"
                        : "text-muted-foreground/60"
                }`}
              >
                {step.label}
              </span>

              {/* Connector line (hidden for last item) */}
              {index < PIPELINE_STEPS.length - 1 && (
                <div className="flex-1" />
              )}
            </div>
          )
        })}
      </div>

      {/* Error message */}
      {isFailed && error && (
        <div className="mt-3 rounded-md bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}
    </div>
  )
}
