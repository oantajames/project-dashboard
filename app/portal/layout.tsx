"use client"

import { AuthGuard } from "@/components/auth/AuthGuard"
import { RoleGuard } from "@/components/auth/RoleGuard"
import { PortalSidebar } from "@/components/portal/PortalSidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={["client"]} fallbackPath="/">
        <SidebarProvider>
          <PortalSidebar />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </RoleGuard>
    </AuthGuard>
  )
}
