"use client"

import { useState, useEffect, useCallback } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { ProjectNote } from "@/lib/types"

function docToProjectNote(id: string, data: Record<string, unknown>): ProjectNote {
  return {
    id,
    projectId: data.projectId as string,
    title: (data.title as string) || undefined,
    content: data.content as string,
    authorId: data.authorId as string,
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate() || new Date(),
    updatedAt: (data.updatedAt as { toDate: () => Date })?.toDate() || new Date(),
  }
}

export function useProjectNotes(projectId: string | undefined) {
  const [notes, setNotes] = useState<ProjectNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!projectId) {
      setNotes([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, "project_notes"),
      where("projectId", "==", projectId)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => docToProjectNote(doc.id, doc.data()))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        setNotes(data)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error("Error fetching project notes:", err)
        setError(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [projectId])

  const refresh = useCallback(() => {
    setLoading(true)
  }, [])

  return { notes, loading, error, refresh }
}
