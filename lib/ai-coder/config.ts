/**
 * AI Coder — Config loader and validation schema
 * Validates ai-coder.config.ts at startup using Zod.
 */

import { z } from "zod"
import type { AICoderConfig } from "./types"

// ── Zod Schema ──

const skillSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  icon: z.string(),
  prompt: z.string().min(1),
  allowedPaths: z.array(z.string()).optional(),
  maxFilesPerChange: z.number().positive().optional(),
  allowNewFiles: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
})

const rulesSchema = z.object({
  allowed: z.array(z.string()).min(1),
  blocked: z.array(z.string()),
  constraints: z.array(z.string()),
  maxFilesPerChange: z.number().positive().default(10),
  allowNewFiles: z.boolean().default(true),
  allowDeleteFiles: z.boolean().default(false),
  allowDependencyChanges: z.boolean().default(false),
})

const gitSchema = z.object({
  branchPrefix: z.string().default("ai/"),
  commitPrefix: z.string().default("ai:"),
  prTemplate: z.string(),
  autoMerge: z.boolean().default(false),
  requiredChecks: z.array(z.string()).default([]),
})

const sandboxSchema = z.object({
  provider: z.literal("e2b"),
  templateId: z.string().min(1),
  timeoutMs: z.number().positive().default(180_000),
})

const deploySchema = z.object({
  provider: z.enum(["vercel", "netlify", "custom"]),
  waitForPreview: z.boolean().default(true),
})

const projectSchema = z.object({
  name: z.string().min(1),
  repo: z.string().regex(/^[^/]+\/[^/]+$/, "Must be in 'owner/repo' format"),
  defaultBranch: z.string().default("main"),
})

export const aiCoderConfigSchema = z.object({
  project: projectSchema,
  rules: rulesSchema,
  skills: z.array(skillSchema).min(1),
  git: gitSchema,
  sandbox: sandboxSchema,
  deploy: deploySchema,
})

// ── Helper ──

/**
 * Type-safe config definition helper.
 * Use in ai-coder.config.ts: `export default defineConfig({ ... })`
 */
export function defineConfig(config: AICoderConfig): AICoderConfig {
  // Validate at definition time
  const result = aiCoderConfigSchema.safeParse(config)
  if (!result.success) {
    console.error("AI Coder config validation errors:", result.error.flatten())
    throw new Error(`Invalid ai-coder.config.ts: ${result.error.message}`)
  }
  return config
}

/**
 * Load and validate config. Throws if invalid.
 */
export function loadConfig(config: unknown): AICoderConfig {
  return aiCoderConfigSchema.parse(config) as AICoderConfig
}

/**
 * Find a skill by ID from the config.
 * Throws if skill is not found.
 */
export function getSkillById(config: AICoderConfig, skillId: string) {
  const skill = config.skills.find((s) => s.id === skillId)
  if (!skill) {
    throw new Error(`Unknown skill: "${skillId}". Available: ${config.skills.map((s) => s.id).join(", ")}`)
  }
  return skill
}
