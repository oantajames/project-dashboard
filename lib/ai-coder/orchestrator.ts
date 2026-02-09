/**
 * AI Coder — E2B Sandbox Orchestration
 *
 * Single-phase pipeline (PR-first, no in-sandbox preview):
 *
 *   Spin up sandbox → clone → branch → run Claude CLI → validate diff →
 *   commit → push → kill sandbox.
 *
 * After push, the caller creates a PR on GitHub. Vercel (connected via
 * GitHub integration) automatically deploys a preview for the PR branch.
 */

import { Sandbox } from "@e2b/code-interpreter"
import { validateDiff } from "./rules-engine"
import { buildProductContextPrompt, mergeProductContext } from "./product-context"
import type { AICoderConfig, AICoderSkill } from "./types"

// ── Constants ──

const WORKSPACE_DIR = "/home/user/workspace"

/**
 * Extended sandbox lifetime so the full pipeline (clone + CLI + push)
 * isn't killed by E2B's default cap (~2.5 min).
 */
const SANDBOX_LIFETIME_MS = 10 * 60 * 1000 // 10 minutes

// ── Logging ──

function log(step: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString()
  const payload = data ? ` ${JSON.stringify(data)}` : ""
  console.log(`[ai-coder/orchestrator] [${timestamp}] ${step}${payload}`)
}

// ── Types ──

/** Result from the pipeline — sandbox is already killed */
export interface PipelineResult {
  branchName: string
  commitSha: string
  diff: string
  filesChanged: string[]
}

interface ExecuteAndPushParams {
  prompt: string
  skill: AICoderSkill
  config: AICoderConfig
  branchName: string
}

// ── Pipeline: Execute Changes + Commit + Push ──

/**
 * Runs the full AI coding pipeline inside an E2B sandbox:
 * clone → branch → Claude CLI → validate → commit → push → kill sandbox.
 *
 * Returns the branch name, commit SHA, diff, and changed files so the
 * caller can create a PR and let Vercel deploy a preview.
 */
export async function executeAndPush(
  params: ExecuteAndPushParams
): Promise<PipelineResult> {
  const { prompt, skill, config, branchName } = params
  let sandbox: Sandbox | null = null

  log("Pipeline started", { branchName, skill: skill.id, promptLength: prompt.length })

  try {
    // 1. Create sandbox
    log("Step 1: Creating E2B sandbox", { templateId: config.sandbox.templateId })
    sandbox = await Sandbox.create(config.sandbox.templateId, {
      apiKey: process.env.E2B_API_KEY,
      timeoutMs: config.sandbox.timeoutMs,
    })
    log("Step 1: Sandbox created", { sandboxId: sandbox.sandboxId })

    // Extend sandbox lifetime immediately so the pipeline isn't killed
    // by E2B's default/capped lifetime (~2.5 min on create).
    try {
      await Sandbox.setTimeout(sandbox.sandboxId, SANDBOX_LIFETIME_MS, {
        apiKey: process.env.E2B_API_KEY,
      })
      log("Step 1b: Sandbox lifetime extended to 10 min")
    } catch (err) {
      log("Step 1b: WARNING — failed to extend sandbox lifetime", {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    // 2. Set env vars
    log("Step 2: Setting sandbox environment variables")
    await runCommand(sandbox, `echo 'export ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY}' >> ~/.bashrc`)

    // 3. Clone repo
    log("Step 3: Cloning repository", { repo: config.project.repo })
    const repoUrl = `https://x-access-token:${process.env.GITHUB_TOKEN}@github.com/${config.project.repo}.git`
    const cloneResult = await runCommand(sandbox, `git clone ${repoUrl} ${WORKSPACE_DIR}`)
    if (!cloneResult.success) {
      log("Step 3: Clone FAILED", { exitCode: cloneResult.exitCode, stderr: cloneResult.stderr.slice(0, 500) })
      throw new Error(`Git clone failed: ${cloneResult.stderr || cloneResult.stdout}`)
    }
    log("Step 3: Clone succeeded")

    // 4. Create branch
    log("Step 4: Creating branch", { branchName })
    const branchResult = await runCommand(sandbox, `git checkout -b ${branchName}`, WORKSPACE_DIR)
    if (!branchResult.success) {
      throw new Error(`Branch creation failed: ${branchResult.stderr}`)
    }

    // 5. Configure git
    await runCommand(sandbox, 'git config user.email "ai-coder@automated.dev"', WORKSPACE_DIR)
    await runCommand(sandbox, 'git config user.name "AI Coder"', WORKSPACE_DIR)

    // 6. Write CLAUDE.md rules
    log("Step 5: Writing CLAUDE.md rules file")
    const claudeRules = buildClaudeRulesFile(skill, config)
    await sandbox.files.write(`${WORKSPACE_DIR}/CLAUDE.md`, claudeRules)

    // 7. Run Claude Code CLI
    const cliPrompt = buildCLIPrompt(prompt, skill, config)
    log("Step 6: Running Claude Code CLI", { promptPreview: cliPrompt.slice(0, 200) })
    const agentResult = await runCommand(
      sandbox,
      `ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY} claude -p "${escapeBashString(cliPrompt)}" --allowedTools Edit,Read,Grep,Glob`,
      WORKSPACE_DIR,
      config.sandbox.timeoutMs
    )

    log("Step 6: Claude CLI finished", {
      exitCode: agentResult.exitCode,
      stdoutPreview: agentResult.stdout.slice(0, 500),
      stderrPreview: agentResult.stderr.slice(0, 500),
    })

    if (!agentResult.success) {
      throw new Error(`Claude Code CLI failed (exit ${agentResult.exitCode}): ${agentResult.stderr || agentResult.stdout}`)
    }

    // 8. Stage files, exclude CLAUDE.md, and get diff
    log("Step 7: Getting diff")
    await runCommand(sandbox, "git add -A", WORKSPACE_DIR)
    await runCommand(sandbox, "git reset HEAD CLAUDE.md", WORKSPACE_DIR)
    const diffResult = await runCommand(sandbox, "git diff --cached", WORKSPACE_DIR)
    const diff = diffResult.stdout

    if (!diff || diff.trim().length === 0) {
      throw new Error("No changes were made by the AI agent.")
    }

    // 9. Validate diff against rules
    log("Step 8: Validating diff")
    const validation = validateDiff(diff, skill, config)
    if (!validation.valid) {
      throw new Error(`Diff validation failed:\n${validation.violations?.join("\n") || validation.error}`)
    }

    const filesChanged = extractChangedFiles(diff)
    log("Step 9: Files changed", { count: filesChanged.length, files: filesChanged })

    // 10. Commit
    const commitMessage = `${config.git.commitPrefix} ${prompt.slice(0, 72)}`
    log("Step 10: Committing", { commitMessage })
    const commitResult = await runCommand(
      sandbox,
      `git commit -m "${escapeBashString(commitMessage)}"`,
      WORKSPACE_DIR,
    )
    if (!commitResult.success) {
      throw new Error(`Commit failed: ${commitResult.stderr}`)
    }

    const shaResult = await runCommand(sandbox, "git rev-parse HEAD", WORKSPACE_DIR)
    const commitSha = shaResult.stdout.trim()

    // 11. Push
    log("Step 11: Pushing to remote", { branchName })
    const pushResult = await runCommand(sandbox, `git push origin ${branchName}`, WORKSPACE_DIR)
    if (!pushResult.success) {
      throw new Error(`Push failed: ${pushResult.stderr}`)
    }

    log("Pipeline complete", { branchName, commitSha, filesChanged })

    return {
      branchName,
      commitSha,
      diff,
      filesChanged,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log("Pipeline FAILED", { error: message })
    throw error
  } finally {
    // Always kill the sandbox — no preview to keep alive
    if (sandbox) {
      try { await sandbox.kill() } catch { /* ignore */ }
    }
  }
}

// ── Helpers ──

interface CommandResult {
  stdout: string
  stderr: string
  exitCode: number
  success: boolean
}

async function runCommand(
  sandbox: Sandbox,
  command: string,
  cwd?: string,
  timeoutMs?: number
): Promise<CommandResult> {
  const result = await sandbox.commands.run(command, {
    cwd,
    timeoutMs: timeoutMs || 30_000,
  })

  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
    success: result.exitCode === 0,
  }
}

function buildClaudeRulesFile(skill: AICoderSkill, config: AICoderConfig): string {
  const { rules } = config
  const effectiveAllowed = skill.allowedPaths
    ? [...new Set([...rules.allowed, ...skill.allowedPaths])]
    : rules.allowed

  // Build product context section (merged static defaults + Firestore edits)
  const productContext = mergeProductContext(config.productContext)
  const productContextBlock = buildProductContextPrompt(productContext)

  return `${productContextBlock}

---

# AI Coder Rules

## You MUST follow these rules at all times

### Allowed Files
You may ONLY modify files matching these patterns:
${effectiveAllowed.map((p) => `- ${p}`).join("\n")}

### Blocked Files
You must NEVER modify these files:
${rules.blocked.map((p) => `- ${p}`).join("\n")}

### Constraints
${rules.constraints.map((c) => `- ${c}`).join("\n")}

### Operational Limits
- Maximum files to change: ${skill.maxFilesPerChange ?? rules.maxFilesPerChange}
- New file creation: ${(skill.allowNewFiles ?? rules.allowNewFiles) ? "allowed" : "NOT allowed"}
- File deletion: ${rules.allowDeleteFiles ? "allowed" : "NOT allowed"}
- Dependency changes: ${rules.allowDependencyChanges ? "allowed" : "NOT allowed"}

### Skill: ${skill.name}
${skill.prompt}
`
}

function buildCLIPrompt(prompt: string, skill: AICoderSkill, _config: AICoderConfig): string {
  return `[Skill: ${skill.name}] ${prompt}\n\nFollow all rules in CLAUDE.md strictly. Do not modify any blocked files.`
}

function extractChangedFiles(diff: string): string[] {
  const files: string[] = []
  const regex = /^diff --git a\/(.+?) b\/(.+?)$/gm
  let match: RegExpExecArray | null
  while ((match = regex.exec(diff)) !== null) {
    files.push(match[2])
  }
  return [...new Set(files)]
}

function escapeBashString(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\$/g, "\\$").replace(/`/g, "\\`")
}

// ── Branch Name Generator ──

export function generateBranchName(summary: string, config: AICoderConfig): string {
  const slug = summary
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40)

  const timestamp = Math.floor(Date.now() / 1000)
  return `${config.git.branchPrefix}${slug}-${timestamp}`
}
