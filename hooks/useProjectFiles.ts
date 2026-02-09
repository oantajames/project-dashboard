"use client"

import { useState, useEffect, useCallback } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { ProjectFile, ProjectFileType } from "@/lib/types"

function docToProjectFile(id: string, data: Record<string, unknown>): ProjectFile {
  return {
    id,
    projectId: data.projectId as string,
    name: data.name as string,
    type: (data.type as ProjectFileType) || "file",
    url: data.url as string,
    sizeMB: (data.sizeMB as number) || 0,
    uploadedBy: data.uploadedBy as string,
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate() || new Date(),
    updatedAt: (data.updatedAt as { toDate: () => Date })?.toDate() || new Date(),
  }
}

export function useProjectFiles(projectId: string | undefined) {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!projectId) {
      setFiles([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, "project_files"),
      where("projectId", "==", projectId)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => docToProjectFile(doc.id, doc.data()))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        setFiles(data)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error("Error fetching project files:", err)
        setError(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [projectId])

  const refresh = useCallback(() => {
    setLoading(true)
  }, [])

  return { files, loading, error, refresh }
}
