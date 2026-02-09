"use client"

import { useState, useEffect, useCallback } from "react"
import { collection, query, where, orderBy, onSnapshot, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { PRD, PRDSection } from "@/lib/types"

function docToPRD(id: string, data: Record<string, unknown>): PRD {
  return {
    id,
    projectId: data.projectId as string,
    version: data.version as string,
    sections: (data.sections as PRDSection[]) || [],
    isPublished: (data.isPublished as boolean) || false,
    publishedAt: (data.publishedAt as { toDate: () => Date })?.toDate() || undefined,
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate() || new Date(),
    updatedAt: (data.updatedAt as { toDate: () => Date })?.toDate() || new Date(),
  }
}

export function usePRD(projectId: string | undefined) {
  const [prd, setPRD] = useState<PRD | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!projectId) {
      setPRD(null)
      setLoading(false)
      return
    }

    const q = query(
      collection(db, "prds"),
      where("projectId", "==", projectId),
      orderBy("createdAt", "desc"),
      limit(1)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          setPRD(null)
        } else {
          const doc = snapshot.docs[0]
          setPRD(docToPRD(doc.id, doc.data()))
        }
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching PRD:", err)
        setError(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [projectId])

  const refresh = useCallback(() => {
    setLoading(true)
  }, [])

  return { prd, loading, error, refresh }
}

export function usePublishedPRD(projectId: string | undefined) {
  const [prd, setPRD] = useState<PRD | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!projectId) {
      setPRD(null)
      setLoading(false)
      return
    }

    const q = query(
      collection(db, "prds"),
      where("projectId", "==", projectId),
      where("isPublished", "==", true),
      orderBy("publishedAt", "desc"),
      limit(1)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          setPRD(null)
        } else {
          const doc = snapshot.docs[0]
          setPRD(docToPRD(doc.id, doc.data()))
        }
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching published PRD:", err)
        setError(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [projectId])

  return { prd, loading, error }
}

export function usePRDVersions(projectId: string | undefined) {
  const [versions, setVersions] = useState<PRD[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!projectId) {
      setVersions([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, "prds"),
      where("projectId", "==", projectId),
      orderBy("createdAt", "desc")
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => docToPRD(doc.id, doc.data()))
        setVersions(data)
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching PRD versions:", err)
        setError(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [projectId])

  return { versions, loading, error }
}
