"use client"

/**
 * Tiny Viber — Config Hook
 *
 * Provides real-time merged config (static defaults + Firestore overrides).
 * Uses onSnapshot for live updates when another user edits settings.
 *
 * Returns: { config, loading, updateRules, updateSkills }
 */

import { useState, useEffect, useCallback } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/AuthContext"
import staticConfig from "@/ai-coder.config"
import { mergeConfig, saveConfigOverrides, type ConfigOverrides } from "@/lib/ai-coder/config-store"
import type { AICoderConfig, AICoderRules, AICoderSkill, AICoderProductContext } from "@/lib/ai-coder/types"

export function useAICoderConfig() {
  const { user } = useAuth()
  const [config, setConfig] = useState<AICoderConfig>(staticConfig)
  const [overrides, setOverrides] = useState<ConfigOverrides | null>(null)
  const [loading, setLoading] = useState(true)

  // Listen for real-time config changes
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "aiCoderConfig/current"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as ConfigOverrides
          setOverrides(data)
          setConfig(mergeConfig(staticConfig, data))
        } else {
          setOverrides(null)
          setConfig(staticConfig)
        }
        setLoading(false)
      },
      (err) => {
        console.error("[TinyViber] Config snapshot error:", err)
        setConfig(staticConfig)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  /**
   * Update the rules overrides in Firestore.
   * Accepts a partial rules object — only provided fields are overridden.
   */
  const updateRules = useCallback(
    async (rules: Partial<AICoderRules>) => {
      const merged = { ...(overrides?.rules || {}), ...rules }
      await saveConfigOverrides({ rules: merged }, user?.id)
    },
    [overrides, user]
  )

  /**
   * Update the skills list in Firestore.
   * Replaces the entire skills array.
   */
  const updateSkills = useCallback(
    async (skills: AICoderSkill[]) => {
      await saveConfigOverrides({ skills }, user?.id)
    },
    [user]
  )

  /**
   * Update the product context overrides in Firestore.
   * Accepts a partial context — only provided fields are overridden.
   */
  const updateProductContext = useCallback(
    async (productContext: Partial<AICoderProductContext>) => {
      const merged = { ...(overrides?.productContext || {}), ...productContext }
      await saveConfigOverrides({ productContext: merged }, user?.id)
    },
    [overrides, user]
  )

  return { config, loading, updateRules, updateSkills, updateProductContext }
}
