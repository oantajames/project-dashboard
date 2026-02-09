/**
 * POST /api/ai-coder/approve
 *
 * DEPRECATED: The PR-first flow handles everything in triggerCodeChange.
 * This endpoint is kept as a no-op for backward compatibility.
 */

import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json({
    status: "deprecated",
    message: "Approve endpoint is no longer used. PRs are created directly by the triggerCodeChange tool.",
  })
}
