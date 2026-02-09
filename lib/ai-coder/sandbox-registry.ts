/**
 * AI Coder — Sandbox Registry
 *
 * Tracks active E2B sandboxes so they can be killed on demand.
 * Uses a module-level Map (persists across requests in the same Node process).
 */

import type { Sandbox } from "@e2b/code-interpreter"

/** Active sandbox entries keyed by a user-facing session ID */
const activeSandboxes = new Map<string, Sandbox>()

/** Register a sandbox so it can be killed later */
export function registerSandbox(sessionId: string, sandbox: Sandbox) {
  activeSandboxes.set(sessionId, sandbox)
  console.log(`[ai-coder/registry] Sandbox registered: ${sessionId} (${sandbox.sandboxId})`)
}

/** Unregister a sandbox (called after normal cleanup) */
export function unregisterSandbox(sessionId: string) {
  activeSandboxes.delete(sessionId)
  console.log(`[ai-coder/registry] Sandbox unregistered: ${sessionId}`)
}

/** Get a sandbox reference by session ID (used by Phase 2 push/reject) */
export function getSandbox(sessionId: string): Sandbox | undefined {
  return activeSandboxes.get(sessionId)
}

/** Kill a sandbox by session ID. Returns true if one was found and killed. */
export async function killSandbox(sessionId: string): Promise<boolean> {
  const sandbox = activeSandboxes.get(sessionId)
  if (!sandbox) {
    console.log(`[ai-coder/registry] No active sandbox for session: ${sessionId}`)
    return false
  }

  try {
    console.log(`[ai-coder/registry] Killing sandbox: ${sessionId} (${sandbox.sandboxId})`)
    await sandbox.kill()
    activeSandboxes.delete(sessionId)
    return true
  } catch (error) {
    console.error(`[ai-coder/registry] Failed to kill sandbox ${sessionId}:`, error)
    activeSandboxes.delete(sessionId)
    return false
  }
}

/** Kill ALL active sandboxes. Returns the count killed. */
export async function killAllSandboxes(): Promise<number> {
  const entries = Array.from(activeSandboxes.entries())
  let killed = 0

  for (const [sessionId, sandbox] of entries) {
    try {
      await sandbox.kill()
      killed++
    } catch {
      // Already dead, ignore
    }
    activeSandboxes.delete(sessionId)
  }

  console.log(`[ai-coder/registry] Killed ${killed}/${entries.length} sandboxes`)
  return killed
}

/** Get count of active sandboxes */
export function getActiveSandboxCount(): number {
  return activeSandboxes.size
}
