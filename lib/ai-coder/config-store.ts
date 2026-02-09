/**
 * Tiny Viber — Config Store
 *
 * Reads/writes AI Coder config overrides from Firestore.
 * The static `ai-coder.config.ts` serves as the base/default.
 * User edits (rules, skills) are stored in `aiCoderConfig/current`
 * and deep-merged at runtime, with Firestore values taking precedence.
 *
 * Editable fields: `rules` (allowed, blocked, constraints) and `skills`.
 * Non-editable fields (project, git, sandbox, deploy) always come from the static file.
 */

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import staticConfig from "@/ai-coder.config"
import { mergeProductContext } from "./product-context"
import type { AICoderConfig, AICoderRules, AICoderSkill, AICoderProductContext } from "./types"

/** Firestore document path for config overrides */
const CONFIG_DOC_PATH = "aiCoderConfig/current"

/** Shape of the Firestore override document */
export interface ConfigOverrides {
  rules?: Partial<AICoderRules>
  skills?: AICoderSkill[]
  productContext?: Partial<AICoderProductContext>
  updatedAt?: unknown // Firestore Timestamp
  updatedBy?: string
}

/**
 * Reads config overrides from Firestore.
 * Returns `null` if no overrides have been saved yet.
 */
export async function getConfigOverrides(): Promise<ConfigOverrides | null> {
  try {
    const snap = await getDoc(doc(db, CONFIG_DOC_PATH))
    if (!snap.exists()) return null
    return snap.data() as ConfigOverrides
  } catch (err) {
    console.error("[TinyViber] Failed to read config overrides:", err)
    return null
  }
}

/**
 * Saves config overrides to Firestore.
 * Only `rules` and `skills` fields are stored — all other config
 * comes from the static file.
 */
export async function saveConfigOverrides(
  overrides: Pick<ConfigOverrides, "rules" | "skills" | "productContext">,
  userId?: string
): Promise<void> {
  await setDoc(
    doc(db, CONFIG_DOC_PATH),
    {
      ...overrides,
      updatedAt: serverTimestamp(),
      updatedBy: userId || "unknown",
    },
    { merge: true }
  )
}

/**
 * Returns the fully merged config: static defaults + Firestore overrides.
 * Firestore values take precedence where they exist.
 *
 * Used by the API route to ensure edited rules/skills are applied.
 */
export async function getMergedConfig(): Promise<AICoderConfig> {
  const overrides = await getConfigOverrides()
  if (!overrides) return staticConfig

  return mergeConfig(staticConfig, overrides)
}

/**
 * Pure merge function: combines static config with overrides.
 * Exported for use in the client-side hook (where overrides come from onSnapshot).
 */
export function mergeConfig(
  base: AICoderConfig,
  overrides: ConfigOverrides
): AICoderConfig {
  return {
    ...base,

    // Merge rules — override arrays replace the base entirely (not appended)
    rules: overrides.rules
      ? {
          ...base.rules,
          ...(overrides.rules.allowed && { allowed: overrides.rules.allowed }),
          ...(overrides.rules.blocked && { blocked: overrides.rules.blocked }),
          ...(overrides.rules.constraints && { constraints: overrides.rules.constraints }),
          ...(overrides.rules.maxFilesPerChange !== undefined && {
            maxFilesPerChange: overrides.rules.maxFilesPerChange,
          }),
          ...(overrides.rules.allowNewFiles !== undefined && {
            allowNewFiles: overrides.rules.allowNewFiles,
          }),
          ...(overrides.rules.allowDeleteFiles !== undefined && {
            allowDeleteFiles: overrides.rules.allowDeleteFiles,
          }),
          ...(overrides.rules.allowDependencyChanges !== undefined && {
            allowDependencyChanges: overrides.rules.allowDependencyChanges,
          }),
        }
      : base.rules,

    // Skills: if overrides provide skills, replace entirely
    skills: overrides.skills && overrides.skills.length > 0
      ? overrides.skills
      : base.skills,

    // Product context: merge individual fields (non-empty overrides win)
    productContext: mergeProductContext(overrides.productContext),
  }
}
