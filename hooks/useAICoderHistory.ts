"use client"

/**
 * AI Coder — Chat History Persistence
 *
 * Saves and loads chat sessions to/from Firestore.
 * Provides session management (create, list, load) and
 * real-time message syncing via onSnapshot.
 *
 * Firestore collections:
 * - aiCoderSessions/{id} — session metadata
 * - aiCoderSessions/{id}/messages/{id} — individual messages
 * - aiCoderRequests/{id} — code change pipeline requests
 */

import { useState, useEffect, useCallback } from "react"
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/AuthContext"
import type { AICoderSession, AICoderChatMessage } from "@/lib/ai-coder/types"

// ── Session Management ──

/**
 * Hook for listing and managing AI Coder chat sessions.
 */
export function useAICoderSessions() {
  const [sessions, setSessions] = useState<AICoderSession[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setSessions([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, "aiCoderSessions"),
      where("userId", "==", user.id),
      orderBy("updatedAt", "desc")
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => {
          const docData = d.data()
          return {
            id: d.id,
            userId: docData.userId as string,
            skillId: docData.skillId as string | undefined,
            title: docData.title as string | undefined,
            createdAt: (docData.createdAt as Timestamp)?.toDate() || new Date(),
            updatedAt: (docData.updatedAt as Timestamp)?.toDate() || new Date(),
          } satisfies AICoderSession
        })
        setSessions(data)
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching AI Coder sessions:", err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  /**
   * Creates a new chat session.
   */
  const createSession = useCallback(
    async (skillId?: string, title?: string) => {
      if (!user) return null

      const docRef = await addDoc(collection(db, "aiCoderSessions"), {
        userId: user.id,
        skillId: skillId || null,
        title: title || "New chat",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      return docRef.id
    },
    [user]
  )

  return { sessions, loading, createSession }
}

// ── Message History ──

/**
 * Hook for loading and saving messages in a specific chat session.
 * Returns messages with real-time updates and a function to save new messages.
 */
export function useAICoderMessages(sessionId: string | null) {
  const [messages, setMessages] = useState<AICoderChatMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) {
      setMessages([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, "aiCoderSessions", sessionId, "messages"),
      orderBy("createdAt", "asc")
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => {
          const docData = d.data()
          return {
            id: d.id,
            role: docData.role as "user" | "assistant",
            content: docData.content as string,
            toolInvocations: docData.toolInvocations as unknown[] | undefined,
            createdAt: (docData.createdAt as Timestamp)?.toDate() || new Date(),
          } satisfies AICoderChatMessage
        })
        setMessages(data)
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching AI Coder messages:", err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [sessionId])

  /**
   * Saves a message to the session's messages subcollection.
   */
  const saveMessage = useCallback(
    async (
      role: "user" | "assistant",
      content: string,
      toolInvocations?: unknown[]
    ) => {
      if (!sessionId) return

      await addDoc(collection(db, "aiCoderSessions", sessionId, "messages"), {
        role,
        content,
        toolInvocations: toolInvocations || null,
        createdAt: serverTimestamp(),
      })

      // Update session's updatedAt timestamp
      await updateDoc(doc(db, "aiCoderSessions", sessionId), {
        updatedAt: serverTimestamp(),
      })
    },
    [sessionId]
  )

  return { messages, loading, saveMessage }
}

// ── Code Change Requests ──

/**
 * Hook for tracking code change pipeline requests.
 * Provides real-time status updates for ongoing requests.
 */
export function useAICoderRequests(sessionId: string | null) {
  const [requests, setRequests] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) {
      setRequests([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, "aiCoderRequests"),
      where("sessionId", "==", sessionId),
      orderBy("createdAt", "desc")
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
        setRequests(data)
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching AI Coder requests:", err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [sessionId])

  return { requests, loading }
}
