"use client"

/**
 * AI Coder — Preview Pane
 *
 * Displays a live preview of changes in an iframe with a toolbar
 * and approve/reject controls. Rendered in the expanded widget layout.
 */

import { useState, useRef, useCallback } from "react"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowClockwise,
  ArrowSquareOut,
  Check,
  X,
  Files,
  Spinner,
  Eye,
  Warning,
} from "@phosphor-icons/react"

export interface PreviewState {
  previewUrl: string
  sessionKey: string
  branchName: string
  filesChanged: string[]
  summary: string
  prompt: string
  skillId: string
}

interface PreviewPaneProps {
  preview: PreviewState
  onApprove: () => void
  onReject: () => void
  /** True while the approve/reject API is in-flight */
  isProcessing: boolean
}

export function PreviewPane({ preview, onApprove, onReject, isProcessing }: PreviewPaneProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isIframeLoaded, setIsIframeLoaded] = useState(false)
  const [iframeError, setIframeError] = useState(false)
  const [showFiles, setShowFiles] = useState(false)

  const handleRefresh = useCallback(() => {
    if (iframeRef.current) {
      setIsIframeLoaded(false)
      setIframeError(false)
      iframeRef.current.src = preview.previewUrl
    }
  }, [preview.previewUrl])

  /** Detect sandbox-not-found errors via a fetch probe */
  const handleIframeLoad = useCallback(() => {
    setIsIframeLoaded(true)
    // We can't read cross-origin iframe content, but if the sandbox is dead
    // E2B returns an error page. We use a parallel fetch to detect this.
    fetch(preview.previewUrl, { mode: "no-cors" }).catch(() => {
      setIframeError(true)
    })
  }, [preview.previewUrl])

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex flex-col h-full bg-background"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5 bg-muted/20 shrink-0">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-blue-500" weight="duotone" />
          <span className="text-sm font-medium">Live Preview</span>
          <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
            sandbox
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          {/* File list toggle */}
          <button
            onClick={() => setShowFiles(!showFiles)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-md hover:bg-muted transition-colors"
            title="Show changed files"
          >
            <Files className="h-3.5 w-3.5" />
            <span>{preview.filesChanged.length}</span>
          </button>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh preview"
          >
            <ArrowClockwise className="h-3.5 w-3.5" />
          </button>

          {/* Open in new tab */}
          <a
            href={preview.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Open in new tab"
          >
            <ArrowSquareOut className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Changed files list (collapsible) */}
      {showFiles && (
        <div className="border-b border-border/40 px-4 py-2.5 bg-muted/10">
          <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider font-medium">
            Changed files ({preview.filesChanged.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {preview.filesChanged.map((file) => (
              <Badge key={file} variant="outline" className="text-[10px] font-mono py-0">
                {file}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Iframe */}
      <div className="flex-1 relative bg-white dark:bg-neutral-950">
        {/* Loading overlay */}
        {!isIframeLoaded && !iframeError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/30 z-10">
            <div className="flex flex-col items-center gap-2">
              <Spinner className="h-6 w-6 text-blue-500 animate-spin" />
              <p className="text-xs text-muted-foreground">Loading preview...</p>
            </div>
          </div>
        )}

        {/* Sandbox expired / error overlay */}
        {iframeError && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
            <div className="flex flex-col items-center gap-3 text-center max-w-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                <Warning className="h-6 w-6 text-amber-500" weight="duotone" />
              </div>
              <p className="text-sm font-medium">Sandbox Expired</p>
              <p className="text-xs text-muted-foreground">
                The preview sandbox has timed out and was shut down. You can reject
                these changes and try again.
              </p>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <ArrowClockwise className="h-3.5 w-3.5 mr-1.5" />
                Retry
              </Button>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={preview.previewUrl}
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          onError={() => setIframeError(true)}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          title="Code change preview"
        />
      </div>

      {/* Approve / Reject footer */}
      <div className="border-t border-border/40 px-4 py-3 bg-background shrink-0">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground flex-1 truncate" title={preview.summary}>
            {preview.summary}
          </p>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onReject}
              disabled={isProcessing}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
            >
              {isProcessing ? (
                <Spinner className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5 mr-1.5" weight="bold" />
              )}
              Reject
            </Button>
            <Button
              size="sm"
              onClick={onApprove}
              disabled={isProcessing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isProcessing ? (
                <Spinner className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5 mr-1.5" weight="bold" />
              )}
              Approve &amp; Deploy
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
