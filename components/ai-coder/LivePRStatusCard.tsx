"use client"

/**
 * Tiny Viber — Live PR Status Card
 *
 * Extends the static PRStatusCard with real-time status updates from Firestore.
 * Subscribes to the aiCoderRequests doc via useAICoderPRStatus hook.
 * Shows a live status timeline: PR Created → CI Checks → Preview → Merged.
 *
 * Updates automatically when GitHub webhooks fire (check_run, deployment_status,
 * pull_request events).
 */

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAICoderPRStatus } from "@/hooks/useAICoderPRStatus"
import {
  GitPullRequest,
  GitMerge,
  Globe,
  CheckCircle,
  XCircle,
  Clock,
  CircleNotch,
  ArrowSquareOut,
  Broadcast,
} from "@phosphor-icons/react"

interface LivePRStatusCardProps {
  prNumber: number
  prUrl: string
  branchName?: string
  filesChanged?: string[]
}

export function LivePRStatusCard({
  prNumber,
  prUrl,
  branchName,
  filesChanged,
}: LivePRStatusCardProps) {
  const { liveStatus } = useAICoderPRStatus(prNumber)

  // Derive statuses from live data (fallback to initial states)
  const checksStatus = liveStatus?.checksStatus || "pending"
  const previewUrl = liveStatus?.previewUrl || null
  const pipelineStatus = liveStatus?.status || "creating_pr"
  const isMerged = pipelineStatus === "complete"
  const isFailed = pipelineStatus === "failed"
  const isLive = liveStatus !== null

  return (
    <Card className={`my-3 ${isFailed ? "border-destructive/30 bg-destructive/5" : "border-border/60 bg-muted/20"}`}>
      <CardContent className="p-4 space-y-3">
        {/* PR header with live indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isMerged ? (
              <GitMerge className="h-4 w-4 text-purple-500" weight="bold" />
            ) : (
              <GitPullRequest className="h-4 w-4 text-emerald-500" weight="bold" />
            )}
            <span className="text-sm font-medium">
              Pull Request #{prNumber}
            </span>
            {isLive && !isMerged && !isFailed && (
              <Badge variant="secondary" className="text-[9px] py-0 px-1.5 gap-1 font-normal">
                <Broadcast className="h-2.5 w-2.5 text-emerald-500" weight="fill" />
                Live
              </Badge>
            )}
          </div>
          <a
            href={prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 hover:underline"
          >
            View on GitHub
            <ArrowSquareOut className="h-3 w-3" />
          </a>
        </div>

        {/* Live status timeline */}
        <div className="space-y-2 py-1">
          {/* PR Created */}
          <StatusRow
            icon={<CheckCircle className="h-3.5 w-3.5 text-emerald-500" weight="fill" />}
            label="Pull request created"
            status="done"
          />

          {/* CI Checks */}
          <StatusRow
            icon={
              checksStatus === "success" ? (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" weight="fill" />
              ) : checksStatus === "failure" ? (
                <XCircle className="h-3.5 w-3.5 text-destructive" weight="fill" />
              ) : (
                <CircleNotch className="h-3.5 w-3.5 text-blue-500 animate-spin" />
              )
            }
            label={
              checksStatus === "success"
                ? "CI checks passed"
                : checksStatus === "failure"
                  ? "CI checks failed"
                  : checksStatus === "neutral"
                    ? "No CI checks configured"
                    : "CI checks running..."
            }
            status={
              checksStatus === "success" || checksStatus === "neutral"
                ? "done"
                : checksStatus === "failure"
                  ? "failed"
                  : "pending"
            }
          />

          {/* Preview Deploy */}
          <StatusRow
            icon={
              previewUrl ? (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" weight="fill" />
              ) : (
                <CircleNotch className="h-3.5 w-3.5 text-blue-500 animate-spin" />
              )
            }
            label={
              previewUrl ? (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  Preview ready
                  <ArrowSquareOut className="h-2.5 w-2.5" />
                </a>
              ) : (
                "Deploying preview..."
              )
            }
            status={previewUrl ? "done" : "pending"}
          />

          {/* Merge status */}
          <StatusRow
            icon={
              isMerged ? (
                <GitMerge className="h-3.5 w-3.5 text-purple-500" weight="fill" />
              ) : isFailed ? (
                <XCircle className="h-3.5 w-3.5 text-destructive" weight="fill" />
              ) : (
                <Clock className="h-3.5 w-3.5 text-muted-foreground/50" />
              )
            }
            label={
              isMerged
                ? "Merged"
                : isFailed
                  ? liveStatus?.error || "PR closed without merge"
                  : "Waiting to merge"
            }
            status={isMerged ? "done" : isFailed ? "failed" : "waiting"}
          />
        </div>

        {/* Branch name */}
        {branchName && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-mono">
              {branchName}
            </Badge>
          </div>
        )}

        {/* Changed files */}
        {filesChanged && filesChanged.length > 0 && (
          <div className="pt-1 border-t border-border/40">
            <p className="text-xs text-muted-foreground mb-1">
              {filesChanged.length} file{filesChanged.length > 1 ? "s" : ""} changed:
            </p>
            <div className="flex flex-wrap gap-1">
              {filesChanged.map((file) => (
                <Badge key={file} variant="outline" className="text-[10px] font-mono py-0">
                  {file}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Status Row ──

interface StatusRowProps {
  icon: React.ReactNode
  label: React.ReactNode
  status: "done" | "pending" | "failed" | "waiting"
}

function StatusRow({ icon, label, status }: StatusRowProps) {
  return (
    <div className="flex items-center gap-2.5">
      {icon}
      <span
        className={`text-xs ${
          status === "done"
            ? "text-foreground"
            : status === "failed"
              ? "text-destructive"
              : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </div>
  )
}
