"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { AIChatWidget } from "@/components/ai-coder/AIChatWidget"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
      {/* Floating AI Coder chat widget — visible to owners on all pages */}
      <AIChatWidget />
    </AuthGuard>
  )
}
