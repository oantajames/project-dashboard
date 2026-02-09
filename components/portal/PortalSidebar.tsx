"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  House,
  Folder,
  Receipt,
  FileText,
  SignOut,
  CaretRight,
} from "@phosphor-icons/react/dist/ssr"
import { useAuth } from "@/contexts/AuthContext"

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: House, path: "/portal" },
  { id: "projects", label: "My Projects", icon: Folder, path: "/portal/projects" },
  { id: "invoices", label: "Invoices", icon: Receipt, path: "/portal/invoices" },
  { id: "contracts", label: "Contracts", icon: FileText, path: "/portal/contracts" },
]

export function PortalSidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <Sidebar className="border-border/40 border-r-0 shadow-none border-none">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-800 text-primary-foreground shadow-[inset_0_-5px_6.6px_0_rgba(0,0,0,0.25)]">
            <img src="/logo-wrapper.png" alt="Logo" className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Client Portal</span>
            <span className="text-xs text-muted-foreground">View your projects</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-0 gap-0">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.path ||
                  (item.path !== "/portal" && pathname.startsWith(item.path))

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="h-9 rounded-lg px-3 font-normal text-muted-foreground"
                    >
                      <Link href={item.path}>
                        <Icon className="h-[18px] w-[18px]" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              className="h-9 rounded-lg px-3 text-muted-foreground hover:text-destructive"
            >
              <SignOut className="h-[18px] w-[18px]" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {user && (
          <div className="mt-2 flex items-center gap-3 rounded-lg p-2 hover:bg-accent cursor-pointer">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col">
              <span className="text-sm font-medium">{user.displayName}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
            <CaretRight className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
