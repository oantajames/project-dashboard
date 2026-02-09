/**
 * AI Coder — Kill Sandbox API Route
 *
 * POST /api/ai-coder/kill
 *
 * Kills all active E2B sandboxes. Called when the user clicks the stop button.
 */

import { killAllSandboxes, getActiveSandboxCount } from "@/lib/ai-coder/sandbox-registry"

export async function POST() {
  const activeCount = getActiveSandboxCount()
  const killed = await killAllSandboxes()

  return Response.json({
    success: true,
    killed,
    wasActive: activeCount,
  })
}
