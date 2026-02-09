/**
 * AI Coder — Core type definitions
 * All types for the AI code modification pipeline.
 */

// ── Pipeline Status ──

export type PipelineStatus =
  | "validating"
  | "branching"
  | "coding"
  | "committing"
  | "creating_pr"
  | "deploying"
  | "complete"
  | "failed"

// ── Skills ──

export interface AICoderSkill {
  id: string
  name: string
  description: string
  icon: string // Phosphor icon name
  /** System prompt addition for this skill */
  prompt: string
  /** Additional allowed paths (merged with global rules) */
  allowedPaths?: string[]
  /** Override max files per change for this skill */
  maxFilesPerChange?: number
  /** Whether this skill can create new files */
  allowNewFiles?: boolean
  /** Whether PRs from this skill require manual approval */
  requiresApproval?: boolean
}

// ── Rules ──

export interface AICoderRules {
  /** Glob patterns for files/dirs the AI CAN modify */
  allowed: string[]
  /** Glob patterns for files/dirs the AI CANNOT modify */
  blocked: string[]
  /** Natural language constraints injected into the system prompt */
  constraints: string[]
  /** Max number of files that can be changed in a single request */
  maxFilesPerChange: number
  /** Whether the AI can create new files */
  allowNewFiles: boolean
  /** Whether the AI can delete files */
  allowDeleteFiles: boolean
  /** Whether the AI can modify package.json / dependencies */
  allowDependencyChanges: boolean
}

// ── Git Settings ──

export interface AICoderGitConfig {
  /** Prefix for AI-created branches (e.g., "ai/") */
  branchPrefix: string
  /** Prefix for commit messages (e.g., "ai:") */
  commitPrefix: string
  /** PR body template — supports {{summary}}, {{files}}, {{skill}}, {{user}} */
  prTemplate: string
  /** Whether PRs should auto-merge when checks pass */
  autoMerge: boolean
  /** Required CI checks that must pass before merge */
  requiredChecks: string[]
}

// ── Sandbox Settings ──

export interface AICoderSandboxConfig {
  provider: "e2b"
  /** E2B template ID with Claude Code CLI pre-installed */
  templateId: string
  /** Max execution time per request in ms */
  timeoutMs: number
}

// ── Deploy Settings ──

export interface AICoderDeployConfig {
  provider: "vercel" | "netlify" | "custom"
  /** Whether to wait for preview URL before notifying */
  waitForPreview: boolean
}

// ── Project Identity ──

export interface AICoderProjectConfig {
  name: string
  /** GitHub repo in "owner/repo" format */
  repo: string
  /** Default branch to create PRs against */
  defaultBranch: string
}

// ── Full Config ──

export interface AICoderConfig {
  project: AICoderProjectConfig
  rules: AICoderRules
  skills: AICoderSkill[]
  git: AICoderGitConfig
  sandbox: AICoderSandboxConfig
  deploy: AICoderDeployConfig
}

// ── Pipeline Execution ──

export interface CodeChangeRequest {
  id: string
  sessionId: string
  userId: string
  prompt: string
  skillId: string
  branchName: string
  prUrl?: string
  prNumber?: number
  previewUrl?: string
  status: PipelineStatus
  error?: string
  filesChanged?: string[]
  diff?: string
  createdAt: Date
  updatedAt: Date
}

export interface CodeChangeResult {
  branchName: string
  diff: string
  filesChanged: string[]
  commitSha: string
}

export interface PRResult {
  prUrl: string
  prNumber: number
  previewUrl?: string
}

// ── Chat Session (Firestore) ──

export interface AICoderSession {
  id: string
  userId: string
  skillId?: string
  title?: string
  createdAt: Date
  updatedAt: Date
}

export interface AICoderChatMessage {
  id: string
  role: "user" | "assistant"
  /** Plain text content (backward compat / fallback) */
  content: string
  /** AI SDK v6 message parts — preserves tool invocations, structured output, etc. */
  parts?: unknown[]
  /** @deprecated — use `parts` instead */
  toolInvocations?: unknown[]
  createdAt: Date
}
