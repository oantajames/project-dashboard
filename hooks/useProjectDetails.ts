"use client"

import { useMemo } from "react"
import { useProject } from "./useProjects"
import { useTasks, useWorkstreams } from "./useTasks"
import { useProjectFiles } from "./useProjectFiles"
import { useProjectNotes } from "./useProjectNotes"
import { useInvoices } from "./useInvoices"
import { useContracts } from "./useContracts"
import { useClient } from "./useClients"
import { useUsers } from "./useUsers"
import type { Project, Task, Workstream, ProjectFile, ProjectNote, Invoice, Contract, Client, User } from "@/lib/types"

export interface ProjectDetails {
  project: Project | null
  client: Client | null
  tasks: Task[]
  workstreams: Workstream[]
  files: ProjectFile[]
  notes: ProjectNote[]
  invoices: Invoice[]
  contracts: Contract[]
  picUsers: User[]
  supportUsers: User[]

  // Computed fields
  taskCount: number
  completedTaskCount: number
  daysRemaining: number | null
  durationLabel: string
}

export function useProjectDetails(projectId: string | undefined) {
  const { project, loading: projectLoading, error: projectError } = useProject(projectId)
  const { tasks, loading: tasksLoading } = useTasks(projectId)
  const { workstreams, loading: workstreamsLoading } = useWorkstreams(projectId)
  const { files, loading: filesLoading } = useProjectFiles(projectId)
  const { notes, loading: notesLoading } = useProjectNotes(projectId)

  // Get client details
  const { client, loading: clientLoading } = useClient(project?.clientId)

  // Get PIC and Support users
  const { users: picUsers, loading: picUsersLoading } = useUsers(project?.picUserIds)
  const { users: supportUsers, loading: supportUsersLoading } = useUsers(project?.supportUserIds)

  // Get invoices and contracts for this project's client
  const { invoices: allInvoices, loading: invoicesLoading } = useInvoices(project?.clientId)
  const { contracts: allContracts, loading: contractsLoading } = useContracts(project?.clientId)

  // Filter invoices and contracts to those linked to this project
  const projectInvoices = useMemo(() => {
    if (!projectId) return []
    return allInvoices.filter(inv => inv.projectId === projectId)
  }, [allInvoices, projectId])

  const projectContracts = useMemo(() => {
    if (!projectId) return []
    return allContracts.filter(contract => contract.projectId === projectId)
  }, [allContracts, projectId])

  // Computed fields
  const computed = useMemo(() => {
    const taskCount = tasks.length
    const completedTaskCount = tasks.filter(t => t.status === "done").length

    let daysRemaining: number | null = null
    if (project?.endDate) {
      const today = new Date()
      const endDate = new Date(project.endDate)
      const diffTime = endDate.getTime() - today.getTime()
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    let durationLabel = ""
    if (project?.startDate && project?.endDate) {
      const start = new Date(project.startDate)
      const end = new Date(project.endDate)
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays < 7) {
        durationLabel = `${diffDays} days`
      } else if (diffDays < 30) {
        const weeks = Math.ceil(diffDays / 7)
        durationLabel = `${weeks} week${weeks > 1 ? "s" : ""}`
      } else {
        const months = Math.ceil(diffDays / 30)
        durationLabel = `${months} month${months > 1 ? "s" : ""}`
      }
    }

    return {
      taskCount,
      completedTaskCount,
      daysRemaining,
      durationLabel,
    }
  }, [project, tasks])

  const loading = projectLoading || tasksLoading || workstreamsLoading ||
                  filesLoading || notesLoading || clientLoading ||
                  picUsersLoading || supportUsersLoading ||
                  invoicesLoading || contractsLoading

  const details: ProjectDetails = {
    project,
    client,
    tasks,
    workstreams,
    files,
    notes,
    invoices: projectInvoices,
    contracts: projectContracts,
    picUsers,
    supportUsers,
    ...computed,
  }

  return {
    details,
    loading,
    error: projectError,
  }
}
