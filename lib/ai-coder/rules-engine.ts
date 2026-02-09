/**
 * AI Coder — Rules Engine
 *
 * Three-layer validation:
 * 1. Pre-prompt validation (validatePrompt) — checks before the AI runs
 * 2. System prompt compilation (buildSystemPrompt) — injects rules into Claude's context
 * 3. Post-diff validation (validateDiff) — checks after the AI finishes, before PR
 */

import { buildProductContextPrompt, mergeProductContext } from "./product-context"
import type { AICoderConfig, AICoderSkill } from "./types"

// ── Suspicious patterns that may indicate prompt injection ──
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|rules|prompts)/i,
  /disregard\s+(all\s+)?(previous|prior|above)/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /forget\s+(everything|all|your)\s+(rules|instructions)/i,
  /override\s+(your|the|all)\s+(rules|constraints|instructions)/i,
  /system\s*prompt/i,
  /\bsudo\b/i,
  /rm\s+-rf/i,
  /eval\s*\(/i,
  /exec\s*\(/i,
]

// Max prompt length to prevent abuse
const MAX_PROMPT_LENGTH = 5000

// ── Layer 1: Pre-prompt Validation ──

export interface PromptValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validates a user prompt before sending it to the AI agent.
 * Checks for injection patterns, length, and basic sanity.
 */
export function validatePrompt(
  prompt: string,
  skill: AICoderSkill,
  _config: AICoderConfig
): PromptValidationResult {
  // Check prompt length
  if (!prompt || prompt.trim().length === 0) {
    return { valid: false, error: "Prompt cannot be empty." }
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return {
      valid: false,
      error: `Prompt is too long (${prompt.length} chars). Maximum is ${MAX_PROMPT_LENGTH} characters.`,
    }
  }

  // Check for suspicious injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(prompt)) {
      return {
        valid: false,
        error: "Prompt contains disallowed patterns. Please rephrase your request.",
      }
    }
  }

  // Verify skill exists (already validated by config, but double-check)
  if (!skill || !skill.id) {
    return { valid: false, error: "A valid skill must be selected." }
  }

  return { valid: true }
}

// ── Layer 2: System Prompt Compilation ──

/**
 * Optional screen context passed from the frontend when the user
 * uses the "Read context" feature to scope their request to a page.
 */
export interface ScreenContext {
  screenName: string
  route: string
  description: string
}

/**
 * Builds the full system prompt for Claude, combining:
 * - Base role and behavior instructions
 * - Rules from config (allowed/blocked paths, constraints)
 * - Skill-specific prompt and overrides
 * - Optional screen context captured from the current page
 */
export function buildSystemPrompt(
  skill: AICoderSkill,
  config: AICoderConfig,
  screenContext?: ScreenContext | null,
): string {
  const { rules, project } = config

  // Merge skill-specific allowed paths with global rules
  const effectiveAllowed = skill.allowedPaths
    ? [...new Set([...rules.allowed, ...skill.allowedPaths])]
    : rules.allowed

  const maxFiles = skill.maxFilesPerChange ?? rules.maxFilesPerChange
  const canCreateFiles = skill.allowNewFiles ?? rules.allowNewFiles

  // Inject product context (merged static defaults + Firestore edits)
  const productContext = mergeProductContext(config.productContext)
  const productContextBlock = buildProductContextPrompt(productContext)

  const sections = [
    // Product context — gives the AI full knowledge of the product
    productContextBlock,
    "",

    // Role definition
    `You are an AI coding assistant modifying the "${project.name}" codebase.`,
    `You are operating under the "${skill.name}" skill.`,
    "",

    // Skill-specific instructions
    "## Skill Instructions",
    skill.prompt,
    "",

    // File access rules
    "## File Access Rules",
    "You may ONLY modify files matching these patterns:",
    ...effectiveAllowed.map((p) => `  - ${p}`),
    "",
    "You must NEVER modify files matching these patterns:",
    ...rules.blocked.map((p) => `  - ${p}`),
    "",

    // Operational constraints
    "## Constraints",
    ...rules.constraints.map((c, i) => `${i + 1}. ${c}`),
    "",
    `- Maximum files to change per request: ${maxFiles}`,
    `- Creating new files: ${canCreateFiles ? "ALLOWED" : "NOT ALLOWED"}`,
    `- Deleting files: ${rules.allowDeleteFiles ? "ALLOWED" : "NOT ALLOWED"}`,
    `- Modifying dependencies (package.json): ${rules.allowDependencyChanges ? "ALLOWED" : "NOT ALLOWED"}`,
    "",

    // Behavior
    "## Behavior",
    "1. First, explain your plan for the change clearly and concisely.",
    "2. Then, call the triggerCodeChange tool with a detailed prompt and the specific files involved.",
    "3. After the change is made, summarize what was done and share the PR link.",
    "4. If anything fails or violates the rules, explain the issue to the user.",
    "5. Never attempt to work around the rules or constraints above.",
  ]

  // Screen context — injected when the user scans a page before prompting
  if (screenContext?.screenName) {
    sections.push(
      "",
      "## Current Screen Context",
      `The user is currently viewing the **${screenContext.screenName}** screen (route: \`${screenContext.route}\`).`,
      screenContext.description,
      "",
      "When the user refers to 'this page', 'this screen', or 'here', they mean the screen described above.",
      "Focus your changes on the components and files that render this screen.",
    )
  }

  return sections.join("\n")
}

// ── Layer 3: Post-diff Validation ──

export interface DiffValidationResult {
  valid: boolean
  error?: string
  violations?: string[]
}

/**
 * Parses a git diff and validates every modified file against the config rules.
 * This is the final safety net — even if the AI ignores prompt instructions,
 * this catches violations before any PR is created.
 */
export function validateDiff(
  diff: string,
  skill: AICoderSkill,
  config: AICoderConfig
): DiffValidationResult {
  const { rules } = config
  const violations: string[] = []

  // Extract file paths from diff (lines starting with "diff --git a/... b/...")
  const filePathRegex = /^diff --git a\/(.+?) b\/(.+?)$/gm
  const modifiedFiles: string[] = []
  let match: RegExpExecArray | null

  while ((match = filePathRegex.exec(diff)) !== null) {
    modifiedFiles.push(match[2]) // Use the "b" path (destination)
  }

  if (modifiedFiles.length === 0) {
    return { valid: false, error: "No file changes detected in the diff." }
  }

  // Check file count limit
  const maxFiles = skill.maxFilesPerChange ?? rules.maxFilesPerChange
  if (modifiedFiles.length > maxFiles) {
    violations.push(
      `Too many files changed: ${modifiedFiles.length} (max: ${maxFiles})`
    )
  }

  // Check each file against blocked patterns
  for (const filePath of modifiedFiles) {
    if (matchesAnyPattern(filePath, rules.blocked)) {
      violations.push(`Blocked file modified: ${filePath}`)
    }
  }

  // Check each file against allowed patterns
  const effectiveAllowed = skill.allowedPaths
    ? [...new Set([...rules.allowed, ...skill.allowedPaths])]
    : rules.allowed

  for (const filePath of modifiedFiles) {
    if (!matchesAnyPattern(filePath, effectiveAllowed)) {
      violations.push(`File not in allowed paths: ${filePath}`)
    }
  }

  // Check for dependency changes
  if (!rules.allowDependencyChanges) {
    const depFiles = modifiedFiles.filter(
      (f) => f === "package.json" || f === "package-lock.json" || f === "yarn.lock" || f === "pnpm-lock.yaml"
    )
    if (depFiles.length > 0) {
      violations.push(`Dependency file modified: ${depFiles.join(", ")}`)
    }
  }

  // Check for deleted files (look for /dev/null in diff)
  if (!rules.allowDeleteFiles) {
    const deleteRegex = /^--- a\/(.+?)\n\+\+\+ \/dev\/null$/gm
    let deleteMatch: RegExpExecArray | null
    while ((deleteMatch = deleteRegex.exec(diff)) !== null) {
      violations.push(`File deletion not allowed: ${deleteMatch[1]}`)
    }
  }

  // Check for new files when not allowed
  const canCreateFiles = skill.allowNewFiles ?? rules.allowNewFiles
  if (!canCreateFiles) {
    const newFileRegex = /^--- \/dev\/null\n\+\+\+ b\/(.+?)$/gm
    let newMatch: RegExpExecArray | null
    while ((newMatch = newFileRegex.exec(diff)) !== null) {
      violations.push(`New file creation not allowed: ${newMatch[1]}`)
    }
  }

  if (violations.length > 0) {
    return {
      valid: false,
      error: `Diff validation failed with ${violations.length} violation(s).`,
      violations,
    }
  }

  return { valid: true }
}

// ── Helpers ──

/**
 * Simple glob-like pattern matching.
 * Supports ** (any path segments) and * (any segment chars).
 */
function matchesAnyPattern(filePath: string, patterns: string[]): boolean {
  return patterns.some((pattern) => matchGlob(filePath, pattern))
}

function matchGlob(filePath: string, pattern: string): boolean {
  // Convert glob pattern to regex
  const regexStr = pattern
    .replace(/\./g, "\\.") // Escape dots
    .replace(/\*\*/g, "{{GLOBSTAR}}") // Placeholder for **
    .replace(/\*/g, "[^/]*") // * matches anything except /
    .replace(/\{\{GLOBSTAR\}\}/g, ".*") // ** matches anything including /

  const regex = new RegExp(`^${regexStr}$`)
  return regex.test(filePath)
}
