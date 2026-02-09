import type { ProjectPriority } from "./project"

export type TaskStatus = "todo" | "in-progress" | "done" | "blocked"

export interface Task {
  id: string
  projectId: string
  name: string
  description?: string
  status: TaskStatus
  assigneeId?: string
  dueDate?: Date
  priority?: ProjectPriority
  order: number // For drag-drop ordering
  workstreamId?: string // Group tasks into workstreams
  createdAt: Date
  updatedAt: Date
}

export interface Workstream {
  id: string
  projectId: string
  name: string
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateTaskData {
  projectId: string
  name: string
  description?: string
  status?: TaskStatus
  assigneeId?: string
  dueDate?: Date
  priority?: ProjectPriority
  workstreamId?: string
}

export interface CreateWorkstreamData {
  projectId: string
  name: string
}
