"use client"

/**
 * AI Coder — Screen Context Badge
 *
 * Shows the currently captured screen context as a pill badge above the input.
 * User can remove the context to go back to a general prompt.
 */

import { motion } from "motion/react"
import { Monitor, X } from "@phosphor-icons/react"

export interface ScreenContext {
  /** Friendly display name for the screen */
  screenName: string
  /** The actual route path (e.g., "/projects/abc123") */
  route: string
  /** Additional context about the screen for the AI */
  description: string
}

interface ScreenContextBadgeProps {
  context: ScreenContext
  onRemove: () => void
}

export function ScreenContextBadge({ context, onRemove }: ScreenContextBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 pl-2.5 pr-1.5 py-1"
    >
      <Monitor className="h-3 w-3 text-blue-500 shrink-0" weight="duotone" />
      <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 truncate max-w-[180px]">
        {context.screenName}
      </span>
      <button
        onClick={onRemove}
        className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-blue-500/20 transition-colors shrink-0"
        title="Remove screen context"
      >
        <X className="h-2.5 w-2.5 text-blue-500" />
      </button>
    </motion.div>
  )
}

// ── Route to Screen Name Mapping ──

/**
 * Resolves a route pathname into a friendly screen context.
 * Maps known routes to human-readable names and descriptions.
 */
export function resolveScreenContext(pathname: string): ScreenContext {
  // Strip trailing slash
  const route = pathname.replace(/\/$/, "") || "/"

  // Static route mappings
  const staticRoutes: Record<string, { screenName: string; description: string }> = {
    "/": {
      screenName: "Dashboard",
      description: "The main dashboard showing projects overview, active projects, and key metrics.",
    },
    "/projects": {
      screenName: "Projects",
      description: "The projects list page showing all projects with filters, search, and different view options (board, cards, table).",
    },
    "/clients": {
      screenName: "Clients",
      description: "The clients management page listing all client companies with contacts and linked projects.",
    },
    "/invoices": {
      screenName: "Invoices",
      description: "The invoices page showing all invoices with status tracking, amounts, and client associations.",
    },
    "/contracts": {
      screenName: "Contracts",
      description: "The contracts management page listing all contracts with status, dates, and associated projects.",
    },
  }

  // Check static routes first
  if (staticRoutes[route]) {
    return { route, ...staticRoutes[route] }
  }

  // Dynamic route patterns
  if (/^\/projects\/[^/]+$/.test(route)) {
    const projectId = route.split("/").pop() || ""
    return {
      route,
      screenName: "Project Details",
      description: `The project detail page for project ID "${projectId}". Shows project overview, tasks, files, notes, PRD, and timeline.`,
    }
  }

  if (/^\/clients\/[^/]+$/.test(route)) {
    const clientId = route.split("/").pop() || ""
    return {
      route,
      screenName: "Client Details",
      description: `The client detail page for client ID "${clientId}". Shows client info, contacts, and associated projects.`,
    }
  }

  // Fallback for unknown routes
  return {
    route,
    screenName: route.split("/").filter(Boolean).map(s =>
      s.charAt(0).toUpperCase() + s.slice(1)
    ).join(" / ") || "Page",
    description: `The page at route "${route}".`,
  }
}
