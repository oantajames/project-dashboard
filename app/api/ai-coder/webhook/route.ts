/**
 * AI Coder — Webhook Route
 *
 * POST /api/ai-coder/webhook
 *
 * Receives webhooks from GitHub for:
 * - PR status changes (opened, merged, closed)
 * - Check run completions (CI pass/fail)
 * - Deployment status updates
 *
 * Updates the corresponding Firestore document so the chat UI
 * can pick up changes in real-time via onSnapshot.
 */

import { createHmac } from "crypto"
import { getAdminDb } from "@/lib/ai-coder/admin-db"

// ── Webhook Verification ──

function verifyGitHubWebhook(payload: string, signature: string): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET
  if (!secret) {
    console.warn("GITHUB_WEBHOOK_SECRET not set — skipping webhook verification")
    return true
  }

  const expectedSignature =
    "sha256=" + createHmac("sha256", secret).update(payload).digest("hex")

  return signature === expectedSignature
}

// ── Route Handler ──

export async function POST(req: Request) {
  const payloadText = await req.text()

  // Verify webhook signature
  const signature = req.headers.get("x-hub-signature-256") || ""
  if (!verifyGitHubWebhook(payloadText, signature)) {
    return new Response("Invalid signature", { status: 401 })
  }

  const event = req.headers.get("x-github-event")
  const payload = JSON.parse(payloadText)

  try {
    switch (event) {
      case "pull_request":
        await handlePullRequestEvent(payload)
        break

      case "check_run":
        await handleCheckRunEvent(payload)
        break

      case "deployment_status":
        await handleDeploymentStatus(payload)
        break

      default:
        // Ignore unhandled events
        break
    }

    return new Response("OK", { status: 200 })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return new Response("Internal error", { status: 500 })
  }
}

// ── Event Handlers ──

/**
 * Handles pull_request events (opened, closed, merged).
 * Updates the Firestore request document matching this PR.
 */
async function handlePullRequestEvent(payload: {
  action: string
  pull_request: { number: number; merged: boolean; html_url: string }
}) {
  const { action, pull_request } = payload
  const db = getAdminDb()

  // Find the request document by PR number
  const snapshot = await db
    .collection("aiCoderRequests")
    .where("prNumber", "==", pull_request.number)
    .limit(1)
    .get()

  if (snapshot.empty) return

  const docRef = snapshot.docs[0].ref
  const update: Record<string, unknown> = {
    updatedAt: new Date(),
  }

  if (action === "closed" && pull_request.merged) {
    update.status = "complete"
  } else if (action === "closed") {
    update.status = "failed"
    update.error = "PR was closed without merging"
  }

  await docRef.update(update)
}

/**
 * Handles check_run events (completed).
 * Updates CI status on the Firestore request document.
 */
async function handleCheckRunEvent(payload: {
  action: string
  check_run: {
    conclusion: string | null
    pull_requests: Array<{ number: number }>
  }
}) {
  const { action, check_run } = payload
  if (action !== "completed" || !check_run.pull_requests.length) return

  const db = getAdminDb()
  const prNumber = check_run.pull_requests[0].number

  const snapshot = await db
    .collection("aiCoderRequests")
    .where("prNumber", "==", prNumber)
    .limit(1)
    .get()

  if (snapshot.empty) return

  const docRef = snapshot.docs[0].ref
  await docRef.update({
    checksStatus: check_run.conclusion || "pending",
    updatedAt: new Date(),
  })
}

/**
 * Handles deployment_status events (Vercel deploys after merge).
 * Writes to `deployStatus` / `deployUrl` — never overwrites `status`.
 */
async function handleDeploymentStatus(payload: {
  deployment_status: {
    state: string
    environment_url?: string
    target_url?: string
    environment?: string
  }
  deployment: {
    sha: string
    environment?: string
  }
}) {
  const { deployment_status, deployment } = payload
  if (deployment_status.state !== "success") return

  // Only track production deployments (not preview/staging)
  const env = deployment_status.environment || deployment.environment || ""
  const isProduction = env.toLowerCase().includes("production") || env === "Production"

  const deployUrl =
    deployment_status.environment_url || deployment_status.target_url
  if (!deployUrl) return

  const db = getAdminDb()

  // Match the most recently merged request (status = "complete")
  // This is best-effort — works well for single-developer workflows.
  const snapshot = await db
    .collection("aiCoderRequests")
    .where("status", "==", "complete")
    .orderBy("updatedAt", "desc")
    .limit(1)
    .get()

  if (snapshot.empty) return

  const docRef = snapshot.docs[0].ref
  const existing = snapshot.docs[0].data()

  // Skip if this request already has a deploy URL
  if (existing.deployStatus === "success") return

  await docRef.update({
    deployStatus: "success",
    deployUrl,
    deployIsProduction: isProduction,
    updatedAt: new Date(),
  })
}
