"use client"

/**
 * Tiny Viber — Live Plan Status Hook
 *
 * Subscribes to an aiCoderPlans Firestore doc by its ID (the createPlan
 * toolCallId) to receive real-time plan item status updates.
 *
 * The server-side triggerCodeChange tool updates this doc as the pipeline
 * progresses, moving items from pending → in_progress → done.
 */

import { useState, useEffect } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface PlanItemLive {
  id: string
  label: string
  status: "pending" | "in_progress" | "done" | "skipped" | "failed"
}

export interface PlanLiveData {
  title?: string
  overview?: string
  items: PlanItemLive[]
}

/**
 * Subscribes to a specific aiCoderPlans doc by ID.
 * Returns live plan data that updates in real-time as the pipeline progresses.
 *
 * @param planId - The Firestore doc ID (= createPlan toolCallId). Pass null to skip.
 */
export function useAICoderPlanStatus(planId: string | null) {
  const [liveData, setLiveData] = useState<PlanLiveData | null>(null)

  useEffect(() => {
    if (!planId) {
      setLiveData(null)
      return
    }

    const docRef = doc(db, "aiCoderPlans", planId)

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) return

        const data = snapshot.data()
        setLiveData({
          title: data.title as string | undefined,
          overview: data.overview as string | undefined,
          items: (data.items as PlanItemLive[]) || [],
        })
      },
      (err) => {
        console.error("[TinyViber] Plan status snapshot error:", err)
      }
    )

    return () => unsubscribe()
  }, [planId])

  return { liveData }
}
