/**
 * POST /api/ai-coder/reject
 *
 * DEPRECATED: The PR-first flow kills the sandbox immediately after push.
 * There is no longer a preview phase to reject.
 * This endpoint is kept as a no-op for backward compatibility.
 */

import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json({
    status: "deprecated",
    message: "Reject endpoint is no longer used. Sandboxes are killed immediately after push.",
  })
}
