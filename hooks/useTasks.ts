"use client"

import { useState, useEffect, useCallback } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Task, Workstream, TaskStatus, ProjectPriority } from "@/lib/types"

function docToTask(id: string, data: Record<string, unknown>): Task {
  return {
    id,
    projectId: data.projectId as string,
    name: data.name as string,
    description: (data.description as string) || undefined,
    status: (data.status as TaskStatus) || "todo",
    assigneeId: (data.assigneeId as string) || undefined,
    dueDate: (data.dueDate as { toDate: () => Date })?.toDate() || undefined,
    priority: (data.priority as ProjectPriority) || undefined,
    order: (data.order as number) || 0,
    workstreamId: (data.workstreamId as string) || undefined,
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate() || new Date(),
    updatedAt: (data.updatedAt as { toDate: () => Date })?.toDate() || new Date(),
  }
}

function docToWorkstream(id: string, data: Record<string, unknown>): Workstream {
  return {
    id,
    projectId: data.projectId as string,
    name: data.name as string,
    order: (data.order as number) || 0,
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate() || new Date(),
    updatedAt: (data.updatedAt as { toDate: () => Date })?.toDate() || new Date(),
  }
}

export function useTasks(projectId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!projectId) {
      setTasks([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, "tasks"),
      where("projectId", "==", projectId)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => docToTask(doc.id, doc.data()))
          .sort((a, b) => a.order - b.order)
        setTasks(data)
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching tasks:", err)
        setError(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [projectId])

  const refresh = useCallback(() => {
    setLoading(true)
  }, [])

  return { tasks, loading, error, refresh }
}

export function useWorkstreams(projectId: string | undefined) {
  const [workstreams, setWorkstreams] = useState<Workstream[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!projectId) {
      setWorkstreams([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, "workstreams"),
      where("projectId", "==", projectId)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => docToWorkstream(doc.id, doc.data()))
          .sort((a, b) => a.order - b.order)
        setWorkstreams(data)
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching workstreams:", err)
        setError(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [projectId])

  return { workstreams, loading, error }
}

export function useTasksByWorkstream(projectId: string | undefined) {
  const { tasks, loading: tasksLoading, error: tasksError } = useTasks(projectId)
  const { workstreams, loading: workstreamsLoading } = useWorkstreams(projectId)

  const tasksByWorkstream = workstreams.reduce((acc, ws) => {
    acc[ws.id] = tasks.filter((t) => t.workstreamId === ws.id)
    return acc
  }, {} as Record<string, Task[]>)

  // Tasks without a workstream
  const unassignedTasks = tasks.filter((t) => !t.workstreamId)

  return {
    tasksByWorkstream,
    unassignedTasks,
    workstreams,
    loading: tasksLoading || workstreamsLoading,
    error: tasksError,
  }
}
