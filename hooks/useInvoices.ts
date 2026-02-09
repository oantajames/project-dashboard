"use client"

import { useState, useEffect, useCallback } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/AuthContext"
import type { Invoice, InvoiceItem, InvoiceStatus } from "@/lib/types"

function docToInvoice(id: string, data: Record<string, unknown>): Invoice {
  return {
    id,
    invoiceNumber: data.invoiceNumber as string,
    clientId: data.clientId as string,
    projectId: (data.projectId as string) || undefined,
    items: (data.items as InvoiceItem[]) || [],
    subtotal: (data.subtotal as number) || 0,
    tax: (data.tax as number) || undefined,
    total: (data.total as number) || 0,
    status: (data.status as InvoiceStatus) || "draft",
    issueDate: (data.issueDate as { toDate: () => Date })?.toDate() || new Date(),
    dueDate: (data.dueDate as { toDate: () => Date })?.toDate() || new Date(),
    paidAt: (data.paidAt as { toDate: () => Date })?.toDate() || undefined,
    notes: (data.notes as string) || undefined,
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate() || new Date(),
    updatedAt: (data.updatedAt as { toDate: () => Date })?.toDate() || new Date(),
    ownerId: data.ownerId as string,
  }
}

export function useInvoices(clientId?: string) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setInvoices([])
      setLoading(false)
      return
    }

    let q

    if (user.role === "owner") {
      if (clientId) {
        q = query(
          collection(db, "invoices"),
          where("clientId", "==", clientId)
        )
      } else {
        q = query(
          collection(db, "invoices"),
          where("ownerId", "==", user.id)
        )
      }
    } else {
      // Client can only see invoices for their client company
      if (!user.clientId) {
        setInvoices([])
        setLoading(false)
        return
      }
      q = query(
        collection(db, "invoices"),
        where("clientId", "==", user.clientId)
      )
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => docToInvoice(doc.id, doc.data()))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        setInvoices(data)
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching invoices:", err)
        setError(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user, clientId])

  const refresh = useCallback(() => {
    setLoading(true)
  }, [])

  return { invoices, loading, error, refresh }
}

export function useInvoice(invoiceId: string | undefined) {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!invoiceId) {
      setInvoice(null)
      setLoading(false)
      return
    }

    const q = query(collection(db, "invoices"), where("__name__", "==", invoiceId))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          setInvoice(null)
        } else {
          const doc = snapshot.docs[0]
          setInvoice(docToInvoice(doc.id, doc.data()))
        }
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching invoice:", err)
        setError(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [invoiceId])

  return { invoice, loading, error }
}

export function useInvoiceStats() {
  const { invoices, loading, error } = useInvoices()

  const stats = {
    total: invoices.reduce((sum, inv) => sum + inv.total, 0),
    paid: invoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + inv.total, 0),
    pending: invoices
      .filter((inv) => inv.status === "sent" || inv.status === "draft")
      .reduce((sum, inv) => sum + inv.total, 0),
    overdue: invoices.filter((inv) => inv.status === "overdue").reduce((sum, inv) => sum + inv.total, 0),
    count: {
      total: invoices.length,
      draft: invoices.filter((inv) => inv.status === "draft").length,
      sent: invoices.filter((inv) => inv.status === "sent").length,
      paid: invoices.filter((inv) => inv.status === "paid").length,
      overdue: invoices.filter((inv) => inv.status === "overdue").length,
    },
  }

  return { stats, loading, error }
}
