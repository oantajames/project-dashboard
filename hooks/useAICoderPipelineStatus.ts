"use client"

/**
 * Tiny Viber — Live Pipeline Status Hook
 *
 * Subscribes to an aiCoderRequests Firestore doc by its ID (the AI SDK
 * toolCallId) to receive real-time pipeline progress during streaming.
 *
 * The server-side tool execution writes pipeline status updates to this
 * doc as the orchestrator progresses through each step.
 */

import { useState, useEffect } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { PipelineStatus } from "@/lib/ai-coder/types"

export interface PipelineLiveData {
  status: PipelineStatus
  error?: string
  prNumber?: number
  prUrl?: string
  branchName?: string
  filesChanged?: string[]
  checksStatus?: string
  /** Deployment status set by the Vercel deployment webhook */
  deployStatus?: string
  /** Production URL after successful deploy */
  deployUrl?: string
}

/**
 * Subscribes to a specific aiCoderRequests doc by ID.
 * Returns live pipeline data that updates in real-time as the
 * server-side orchestrator progresses.
 *
 * @param requestId - The Firestore doc ID (= AI SDK toolCallId). Pass null to skip.
 */
export function useAICoderPipelineStatus(requestId: string | null) {
  const [liveData, setLiveData] = useState<PipelineLiveData | null>(null)

  useEffect(() => {
    if (!requestId) {
      setLiveData(null)
      return
    }

    const docRef = doc(db, "aiCoderRequests", requestId)

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          // Doc may not exist yet — the server hasn't written it.
          // Keep listening; onSnapshot will fire again when it appears.
          return
        }

        const data = snapshot.data()
        setLiveData({
          status: (data.status as PipelineStatus) || "validating",
          error: data.error as string | undefined,
          prNumber: data.prNumber as number | undefined,
          prUrl: data.prUrl as string | undefined,
          branchName: data.branchName as string | undefined,
          filesChanged: data.filesChanged as string[] | undefined,
          checksStatus: data.checksStatus as string | undefined,
          deployStatus: data.deployStatus as string | undefined,
          deployUrl: data.deployUrl as string | undefined,
        })
      },
      (err) => {
        console.error("[TinyViber] Pipeline status snapshot error:", err)
      }
    )

    return () => unsubscribe()
  }, [requestId])

  return { liveData }
}
