"use client"

import { useState, useEffect, useCallback } from "react"
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/AuthContext"
import type { Client, ClientContact } from "@/lib/types"

function docToClient(id: string, data: Record<string, unknown>): Client {
  return {
    id,
    companyName: data.companyName as string,
    industry: (data.industry as string) || undefined,
    website: (data.website as string) || undefined,
    address: (data.address as string) || undefined,
    contacts: (data.contacts as ClientContact[]) || [],
    notes: (data.notes as string) || undefined,
    status: (data.status as "active" | "inactive") || "active",
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate() || new Date(),
    updatedAt: (data.updatedAt as { toDate: () => Date })?.toDate() || new Date(),
    ownerId: data.ownerId as string,
  }
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setClients([])
      setLoading(false)
      return
    }

    // Simple query without orderBy to avoid needing a composite index
    const q = query(
      collection(db, "clients"),
      where("ownerId", "==", user.id)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => docToClient(doc.id, doc.data()))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // Sort client-side
        setClients(data)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error("Error fetching clients:", err)
        setError(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  const refresh = useCallback(() => {
    setLoading(true)
  }, [])

  return { clients, loading, error, refresh }
}

export function useClient(clientId: string | undefined) {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!clientId) {
      setClient(null)
      setLoading(false)
      return
    }

    const q = query(collection(db, "clients"), where("__name__", "==", clientId))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          setClient(null)
        } else {
          const doc = snapshot.docs[0]
          setClient(docToClient(doc.id, doc.data()))
        }
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching client:", err)
        setError(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [clientId])

  return { client, loading, error }
}
