"use client"

import { useState, useEffect, useCallback } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/AuthContext"
import type { Contract, ContractStatus } from "@/lib/types"

function docToContract(id: string, data: Record<string, unknown>): Contract {
  return {
    id,
    clientId: data.clientId as string,
    projectId: (data.projectId as string) || undefined,
    title: data.title as string,
    content: data.content as string,
    status: (data.status as ContractStatus) || "draft",
    sentAt: (data.sentAt as { toDate: () => Date })?.toDate() || undefined,
    signedAt: (data.signedAt as { toDate: () => Date })?.toDate() || undefined,
    expiresAt: (data.expiresAt as { toDate: () => Date })?.toDate() || undefined,
    fileUrl: (data.fileUrl as string) || undefined,
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate() || new Date(),
    updatedAt: (data.updatedAt as { toDate: () => Date })?.toDate() || new Date(),
    ownerId: data.ownerId as string,
  }
}

export function useContracts(clientId?: string) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setContracts([])
      setLoading(false)
      return
    }

    let q

    if (user.role === "owner") {
      if (clientId) {
        q = query(
          collection(db, "contracts"),
          where("clientId", "==", clientId)
        )
      } else {
        q = query(
          collection(db, "contracts"),
          where("ownerId", "==", user.id)
        )
      }
    } else {
      // Client can only see contracts for their client company
      if (!user.clientId) {
        setContracts([])
        setLoading(false)
        return
      }
      q = query(
        collection(db, "contracts"),
        where("clientId", "==", user.clientId)
      )
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => docToContract(doc.id, doc.data()))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        setContracts(data)
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching contracts:", err)
        setError(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user, clientId])

  const refresh = useCallback(() => {
    setLoading(true)
  }, [])

  return { contracts, loading, error, refresh }
}

export function useContract(contractId: string | undefined) {
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!contractId) {
      setContract(null)
      setLoading(false)
      return
    }

    const q = query(collection(db, "contracts"), where("__name__", "==", contractId))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          setContract(null)
        } else {
          const doc = snapshot.docs[0]
          setContract(docToContract(doc.id, doc.data()))
        }
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching contract:", err)
        setError(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [contractId])

  return { contract, loading, error }
}
