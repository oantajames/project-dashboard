"use client"

import type { ReactNode } from "react"
import { useRef } from "react"
import { format } from "date-fns"
import type { Project } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getAvatarUrl } from "@/lib/assets/avatars"
import { Folder, CalendarBlank, Flag, User } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"
import { PriorityBadge } from "@/components/priority-badge"
import { ProjectProgress } from "@/components/project-progress"
import { computeIntakeProgress } from "@/lib/utils/intake-progress"
import { useRouter } from "next/navigation"

// Extended project with display-specific computed fields
export type DisplayProject = Project & {
  clientName?: string
  taskCount?: number
  durationLabel?: string
}

type ProjectCardProps = {
  project: DisplayProject
  actions?: ReactNode
  variant?: "list" | "board"
}

function statusConfig(status: Project["status"]) {
  switch (status) {
    case "active":
      return { label: "Active", dot: "bg-teal-600", pill: "text-teal-700 border-teal-200 bg-teal-50" }
    case "planned":
      return { label: "Planned", dot: "bg-zinc-900", pill: "text-zinc-900 border-zinc-200 bg-zinc-50" }
    case "backlog":
      return { label: "Backlog", dot: "bg-orange-600", pill: "text-orange-700 border-orange-200 bg-orange-50" }
    case "completed":
      return { label: "Completed", dot: "bg-blue-600", pill: "text-blue-700 border-blue-200 bg-blue-50" }
    case "cancelled":
      return { label: "Cancelled", dot: "bg-rose-600", pill: "text-rose-700 border-rose-200 bg-rose-50" }
    default:
      return { label: status, dot: "bg-zinc-400", pill: "text-zinc-700 border-zinc-200 bg-zinc-50" }
  }
}

export function ProjectCard({ project, actions, variant = "list" }: ProjectCardProps) {
  const s = statusConfig(project.status)
  // Use first PIC user ID as assignee for display
  const assigneeId = project.picUserIds?.[0]
  const dueDate = project.endDate
  // Use assigneeId for avatar - in real app would look up user name
  const avatarUrl = assigneeId ? getAvatarUrl(assigneeId) : undefined
  const isBoard = variant === "board"
  const router = useRouter()
  const draggingRef = useRef(false)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)

  const initials = assigneeId ? assigneeId.slice(0, 2).toUpperCase() : null

  const secondaryLine = (() => {
    const a = project.clientName
    const b = project.typeLabel
    const c = project.durationLabel
    if (a || b || c) {
      return [a, b, c].filter(Boolean).join(" • ")
    }
    if (project.tags && project.tags.length > 0) {
      return project.tags.join(" • ")
    }
    return ""
  })()

  const dueLabel = (() => {
    if (!dueDate) return "No due date"
    // Board view: dùng format ngắn gọn cho header
    return format(dueDate, "MMM d")
  })()

  const goToDetails = () => router.push(`/projects/${project.id}`)

  const onKeyNavigate: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      goToDetails()
    }
  }

  const onMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!isBoard) return
    startPosRef.current = { x: e.clientX, y: e.clientY }
    draggingRef.current = false
  }

  const onMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!isBoard || !startPosRef.current) return
    const dx = Math.abs(e.clientX - startPosRef.current.x)
    const dy = Math.abs(e.clientY - startPosRef.current.y)
    if (dx > 5 || dy > 5) draggingRef.current = true
  }

  const onMouseUp: React.MouseEventHandler<HTMLDivElement> = () => {
    if (!isBoard) return
    startPosRef.current = null
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open project ${project.name}`}
      onClick={() => {
        if (isBoard && draggingRef.current) {
          draggingRef.current = false
          return
        }
        goToDetails()
      }}
      onKeyDown={onKeyNavigate}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      className="rounded-2xl border border-border bg-background hover:shadow-lg/5 transition-shadow cursor-pointer focus:outline-none "
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          {isBoard ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Flag className="h-4 w-4" />
              <span>{dueLabel}</span>
            </div>
          ) : (
            <div className="text-muted-foreground">
              <Folder className="h-5 w-5" />
            </div>
          )}
          <div className="flex items-center gap-2">
            {!isBoard && (
              <div className={cn("flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", s.pill)}>
                <span className={cn("inline-block size-1.5 rounded-full", s.dot)} />
                {s.label}
              </div>
            )}
            {isBoard && (
              <PriorityBadge level={project.priority} appearance="inline" />
            )}
            {actions ? (
              <div
                className="shrink-0"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                {actions}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-3">
          <p className="text-[15px] font-semibold text-foreground leading-6">
            {project.name}
          </p>
          {isBoard
            ? secondaryLine && (
                <div className="mt-1 text-sm text-muted-foreground truncate">{secondaryLine}</div>
              )
            : secondaryLine && (
                <p className="mt-1 text-sm text-muted-foreground truncate">{secondaryLine}</p>
              )}

          {/* Intake project type tags */}
          {project.intake?.projectTypes?.types && project.intake.projectTypes.types.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {project.intake.projectTypes.types.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-600/10"
                >
                  {tag}
                </span>
              ))}
              {project.intake.projectTypes.types.length > 3 && (
                <span className="text-[10px] text-muted-foreground">
                  +{project.intake.projectTypes.types.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {!isBoard && (
          <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarBlank className="h-4 w-4" />
              <span>{dueDate ? format(dueDate, "MMM d, yyyy") : "—"}</span>
            </div>
            <PriorityBadge level={project.priority} appearance="inline" />
          </div>
        )}

        <div className="mt-4 border-t border-border/60" />

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ProjectProgress project={project} size={isBoard ? 20 : 18} />
            {/* Show intake brief completion if intake data exists and tasks are not set */}
            {project.intake && !project.taskCount && (() => {
              const briefPercent = computeIntakeProgress(project.intake)
              return briefPercent > 0 ? (
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  Brief {briefPercent}%
                </span>
              ) : null
            })()}
          </div>
          <Avatar className="size-6 border border-border">
            <AvatarImage alt={assigneeId ?? ""} src={avatarUrl} />
            <AvatarFallback className="text-xs">
              {initials ? initials : <User className="h-4 w-4 text-muted-foreground" />}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  )
}
