"use client"

/**
 * Tiny Viber — Live PR Status Hook
 *
 * Subscribes to an aiCoderRequests Firestore document via onSnapshot
 * to receive real-time updates from GitHub webhooks.
 *
 * The webhook handler (app/api/ai-coder/webhook/route.ts) updates these
 * docs when PR events, check runs, or deployment statuses change.
 */

import { useState, useEffect } from "react"
import {
  collection,
  query,
  where,
  limit,
  onSnapshot,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface PRLiveStatus {
  /** Pipeline status: creating_pr → deploying → complete / failed */
  status: string
  /** CI check result: pending → success / failure / neutral */
  checksStatus: string
  /** Vercel preview URL (set by deployment_status webhook) */
  previewUrl: string | null
  /** Error message if PR was closed without merge */
  error?: string
}

/**
 * Subscribes to the aiCoderRequests doc matching the given PR number.
 * Returns live status that updates in real-time as webhooks fire.
 *
 * @param prNumber - GitHub PR number to track (null to skip)
 */
export function useAICoderPRStatus(prNumber: number | null) {
  const [liveStatus, setLiveStatus] = useState<PRLiveStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!prNumber) {
      setLiveStatus(null)
      setLoading(false)
      return
    }

    const q = query(
      collection(db, "aiCoderRequests"),
      where("prNumber", "==", prNumber),
      limit(1)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          // Doc may not exist yet — webhook hasn't created it, or it was
          // written after the initial tool response. Keep polling.
          setLoading(false)
          return
        }

        const data = snapshot.docs[0].data()
        setLiveStatus({
          status: (data.status as string) || "creating_pr",
          checksStatus: (data.checksStatus as string) || "pending",
          previewUrl: (data.previewUrl as string) || null,
          error: data.error as string | undefined,
        })
        setLoading(false)
      },
      (err) => {
        console.error("[TinyViber] PR status snapshot error:", err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [prNumber])

  return { liveStatus, loading }
}
