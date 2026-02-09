"use client"

/**
 * AI Coder — Chat Page
 *
 * Admin-only page for requesting code changes via AI.
 * Protected by RoleGuard (owner only) and wrapped by the dashboard
 * layout which provides AuthGuard + sidebar.
 */

import { RoleGuard } from "@/components/auth/RoleGuard"
import { AIChatPanel } from "@/components/ai-coder/AIChatPanel"
import config from "@/ai-coder.config"

export default function AICoderPage() {
  return (
    <RoleGuard allowedRoles={["owner"]}>
      <div className="h-[calc(100vh-1px)]">
        <AIChatPanel skills={config.skills} />
      </div>
    </RoleGuard>
  )
}
