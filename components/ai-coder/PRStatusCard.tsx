"use client"

/**
 * AI Coder — PR Status Card
 *
 * Inline card showing the status of a pull request,
 * including PR link, preview URL, CI checks, and merge state.
 */

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  GitPullRequest,
  Globe,
  CheckCircle,
  XCircle,
  Clock,
  ArrowSquareOut,
} from "@phosphor-icons/react"

interface PRStatusCardProps {
  prUrl?: string
  prNumber?: number
  previewUrl?: string
  checksStatus?: "pending" | "success" | "failure" | "neutral"
  branchName?: string
  filesChanged?: string[]
  status: "success" | "failed"
  error?: string
}

export function PRStatusCard({
  prUrl,
  prNumber,
  previewUrl,
  checksStatus,
  branchName,
  filesChanged,
  status,
  error,
}: PRStatusCardProps) {
  if (status === "failed") {
    return (
      <Card className="my-3 border-destructive/30 bg-destructive/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-destructive">
            <XCircle className="h-4 w-4" weight="fill" />
            <span className="text-sm font-medium">Pipeline failed</span>
          </div>
          {error && (
            <p className="mt-2 text-xs text-destructive/80">{error}</p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="my-3 border-border/60 bg-muted/20">
      <CardContent className="p-4 space-y-3">
        {/* PR Link */}
        {prUrl && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitPullRequest className="h-4 w-4 text-emerald-500" weight="bold" />
              <span className="text-sm font-medium">
                Pull Request #{prNumber}
              </span>
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
        )}

        {/* Preview URL */}
        {previewUrl && previewUrl !== "Not available yet" && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Preview</span>
            </div>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 hover:underline"
            >
              Open preview
              <ArrowSquareOut className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* CI Checks Status */}
        {checksStatus && (
          <div className="flex items-center gap-2">
            {checksStatus === "success" ? (
              <CheckCircle className="h-4 w-4 text-emerald-500" weight="fill" />
            ) : checksStatus === "failure" ? (
              <XCircle className="h-4 w-4 text-destructive" weight="fill" />
            ) : (
              <Clock className="h-4 w-4 text-yellow-500" />
            )}
            <span className="text-sm">
              CI Checks: {checksStatus === "success" ? "Passed" : checksStatus === "failure" ? "Failed" : "Pending"}
            </span>
          </div>
        )}

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
