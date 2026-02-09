"use client"

import { useState, useEffect, useCallback } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/AuthContext"
import type { Project, ProjectStatus, ProjectPriority, ProjectScope, ProjectKeyFeatures } from "@/lib/types"

function docToProject(id: string, data: Record<string, unknown>): Project {
  return {
    id,
    name: data.name as string,
    clientId: data.clientId as string,
    description: (data.description as string) || undefined,
    status: (data.status as ProjectStatus) || "backlog",
    priority: (data.priority as ProjectPriority) || "medium",
    startDate: (data.startDate as { toDate: () => Date })?.toDate() || undefined,
    endDate: (data.endDate as { toDate: () => Date })?.toDate() || undefined,
    progress: (data.progress as number) || 0,
    tags: (data.tags as string[]) || [],
    ownerId: data.ownerId as string,
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate() || new Date(),
    updatedAt: (data.updatedAt as { toDate: () => Date })?.toDate() || new Date(),

    // Team assignments
    picUserIds: (data.picUserIds as string[]) || [],
    supportUserIds: (data.supportUserIds as string[]) || [],

    // Project metadata
    group: (data.group as string) || undefined,
    typeLabel: (data.typeLabel as string) || undefined,
    estimateHours: (data.estimateHours as number) || undefined,
    location: (data.location as string) || undefined,

    // Overview content
    scope: (data.scope as ProjectScope) || undefined,
    outcomes: (data.outcomes as string[]) || undefined,
    keyFeatures: (data.keyFeatures as ProjectKeyFeatures) || undefined,
  }
}

export function useProjects(clientId?: string) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setProjects([])
      setLoading(false)
      return
    }

    let q

    if (user.role === "owner") {
      if (clientId) {
        q = query(
          collection(db, "projects"),
          where("clientId", "==", clientId)
        )
      } else {
        q = query(
          collection(db, "projects"),
          where("ownerId", "==", user.id)
        )
      }
    } else {
      // Client can only see projects for their client company
      if (!user.clientId) {
        setProjects([])
        setLoading(false)
        return
      }
      q = query(
        collection(db, "projects"),
        where("clientId", "==", user.clientId)
      )
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => docToProject(doc.id, doc.data()))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        setProjects(data)
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching projects:", err)
        setError(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user, clientId])

  const refresh = useCallback(() => {
    setLoading(true)
  }, [])

  return { projects, loading, error, refresh }
}

export function useProject(projectId: string | undefined) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!projectId) {
      setProject(null)
      setLoading(false)
      return
    }

    const q = query(collection(db, "projects"), where("__name__", "==", projectId))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          setProject(null)
        } else {
          const doc = snapshot.docs[0]
          setProject(docToProject(doc.id, doc.data()))
        }
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching project:", err)
        setError(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [projectId])

  return { project, loading, error }
}
