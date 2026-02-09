/**
 * Adapter functions to transform Firebase data format to the legacy ProjectDetails
 * format expected by the existing UI components.
 */

import type { Project, Task, Workstream, ProjectFile, User } from "@/lib/types"
import type {
  ProjectDetails as LegacyProjectDetails,
  ProjectMeta,
  TimeSummary,
  BacklogSummary,
  QuickLink,
  WorkstreamGroup,
  WorkstreamTask,
  TimelineTask,
  User as LegacyUser,
} from "@/lib/data/project-details"
import { getAvatarUrl } from "@/lib/assets/avatars"
import { format, formatDistanceToNow, differenceInDays } from "date-fns"

function userToLegacyUser(user: User, role?: string): LegacyUser {
  return {
    id: user.id,
    name: user.displayName,
    avatarUrl: user.avatarUrl || getAvatarUrl(user.displayName),
    role,
  }
}

function userIdToLegacyUser(userId: string, role?: string): LegacyUser {
  return {
    id: userId,
    name: userId,
    avatarUrl: getAvatarUrl(userId),
    role,
  }
}

function projectFileToQuickLink(file: ProjectFile): QuickLink {
  return {
    id: file.id,
    name: file.name,
    type: file.type === "image" ? "file" : file.type,
    sizeMB: file.sizeMB,
    url: file.url,
  }
}

function computeDurationLabel(startDate?: Date, endDate?: Date): string {
  if (!startDate || !endDate) return ""
  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 7) return `${diffDays} days`
  if (diffDays < 30) {
    const weeks = Math.ceil(diffDays / 7)
    return `${weeks} week${weeks > 1 ? "s" : ""}`
  }
  const months = Math.ceil(diffDays / 30)
  return `${months} month${months > 1 ? "s" : ""}`
}

function computeEstimateLabel(estimateHours?: number): string {
  if (!estimateHours) return "Not set"
  if (estimateHours < 8) return `${estimateHours} hours`
  if (estimateHours < 40) {
    const days = Math.round(estimateHours / 8)
    return `${days} day${days > 1 ? "s" : ""}`
  }
  if (estimateHours < 160) {
    const weeks = Math.round(estimateHours / 40)
    return `${weeks} week${weeks > 1 ? "s" : ""}`
  }
  const months = Math.round(estimateHours / 160)
  return `${months} month${months > 1 ? "s" : ""}`
}

function computeDaysRemainingLabel(endDate?: Date): string {
  if (!endDate) return "No due date"
  const daysRemaining = differenceInDays(endDate, new Date())
  if (daysRemaining < 0) return `${Math.abs(daysRemaining)} days overdue`
  if (daysRemaining === 0) return "Due today"
  if (daysRemaining === 1) return "1 day to go"
  return `${daysRemaining} days to go`
}

function taskStatusToWorkstreamStatus(status: Task["status"]): WorkstreamTask["status"] {
  if (status === "done") return "done"
  if (status === "in-progress") return "in-progress"
  return "todo"
}

function computeDueLabel(dueDate?: Date): { label?: string; tone?: "danger" | "warning" | "muted" } {
  if (!dueDate) return {}

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)

  const diffDays = differenceInDays(due, today)

  if (diffDays < 0) return { label: `${Math.abs(diffDays)} days ago`, tone: "danger" }
  if (diffDays === 0) return { label: "Today", tone: "danger" }
  if (diffDays === 1) return { label: "Tomorrow", tone: "warning" }
  if (diffDays <= 7) return { label: `${diffDays} days`, tone: "warning" }
  return { label: format(dueDate, "MMM d"), tone: "muted" }
}

function capitalizeFirst(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function statusToLabel(status: Project["status"]): BacklogSummary["statusLabel"] {
  switch (status) {
    case "active": return "Active"
    case "backlog": return "Backlog"
    case "planned": return "Planned"
    case "completed": return "Completed"
    case "cancelled": return "Cancelled"
    default: return "Active"
  }
}

export interface AdapterInput {
  project: Project
  tasks: Task[]
  workstreams: Workstream[]
  files: ProjectFile[]
  picUsers: User[]
  supportUsers: User[]
  clientName?: string
}

export function adaptToLegacyProjectDetails(input: AdapterInput): LegacyProjectDetails {
  const { project, tasks, workstreams, files, picUsers, supportUsers, clientName } = input

  // Build project meta
  const meta: ProjectMeta = {
    priorityLabel: capitalizeFirst(project.priority),
    locationLabel: project.location || "Remote",
    sprintLabel: project.typeLabel
      ? `${project.typeLabel} ${computeDurationLabel(project.startDate, project.endDate)}`
      : computeDurationLabel(project.startDate, project.endDate) || "Not set",
    lastSyncLabel: project.updatedAt
      ? formatDistanceToNow(project.updatedAt, { addSuffix: false }).replace("about ", "")
      : "Just now",
  }

  // Build time summary
  const totalTasks = tasks.length
  const doneTasks = tasks.filter((t) => t.status === "done").length
  const progressPercent = project.progress ?? (totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0)

  const time: TimeSummary = {
    estimateLabel: computeEstimateLabel(project.estimateHours),
    dueDate: project.endDate || new Date(),
    daysRemainingLabel: computeDaysRemainingLabel(project.endDate),
    progressPercent,
  }

  // Build backlog summary
  const legacyPicUsers: LegacyUser[] = picUsers.length > 0
    ? picUsers.map((u) => userToLegacyUser(u, "PIC"))
    : project.picUserIds.map((id) => userIdToLegacyUser(id, "PIC"))

  const legacySupportUsers: LegacyUser[] = supportUsers.length > 0
    ? supportUsers.map((u) => userToLegacyUser(u, "Support"))
    : project.supportUserIds.map((id) => userIdToLegacyUser(id, "Support"))

  const backlog: BacklogSummary = {
    statusLabel: statusToLabel(project.status),
    groupLabel: project.group || "None",
    priorityLabel: capitalizeFirst(project.priority),
    labelBadge: project.typeLabel || "Project",
    picUsers: legacyPicUsers,
    supportUsers: legacySupportUsers.length > 0 ? legacySupportUsers : undefined,
  }

  // Build workstream groups
  const workstreamMap = new Map<string, WorkstreamGroup>()

  // Initialize workstream groups from workstreams
  workstreams
    .sort((a, b) => a.order - b.order)
    .forEach((ws) => {
      workstreamMap.set(ws.id, {
        id: ws.id,
        name: ws.name,
        tasks: [],
      })
    })

  // Add tasks to their workstreams
  tasks
    .sort((a, b) => a.order - b.order)
    .forEach((task) => {
      const wsId = task.workstreamId
      if (wsId && workstreamMap.has(wsId)) {
        const { label, tone } = computeDueLabel(task.dueDate)
        const assignee = picUsers.find((u) => u.id === task.assigneeId)

        const wsTask: WorkstreamTask = {
          id: task.id,
          name: task.name,
          status: taskStatusToWorkstreamStatus(task.status),
          dueLabel: label,
          dueTone: tone,
          assignee: assignee ? userToLegacyUser(assignee) : undefined,
        }
        workstreamMap.get(wsId)!.tasks.push(wsTask)
      }
    })

  // Build timeline tasks from tasks that have dates
  const timelineTasks: TimelineTask[] = tasks
    .filter((t) => t.dueDate)
    .map((task) => {
      const startDate = task.createdAt || new Date()
      const endDate = task.dueDate!

      let status: TimelineTask["status"] = "planned"
      if (task.status === "done") status = "done"
      else if (task.status === "in-progress") status = "in-progress"

      return {
        id: task.id,
        name: task.name,
        startDate,
        endDate,
        status,
      }
    })

  // Build quick links from files
  const quickLinks: QuickLink[] = files.map(projectFileToQuickLink)

  // Build full project details
  return {
    id: project.id,
    name: project.name,
    description: project.description || (clientName
      ? `Project for ${clientName}.`
      : "No description provided."),
    meta,
    scope: project.scope || { inScope: [], outOfScope: [] },
    outcomes: project.outcomes || [],
    keyFeatures: project.keyFeatures || { p0: [], p1: [], p2: [] },
    timelineTasks,
    workstreams: Array.from(workstreamMap.values()),
    time,
    backlog,
    quickLinks,
  }
}
