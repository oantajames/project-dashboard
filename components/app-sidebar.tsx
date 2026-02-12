"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProgressCircle } from "@/components/progress-circle"
import {
  MagnifyingGlass,
  House,
  Folder,
  Users,
  Receipt,
  FileText,
  CaretRight,
  CaretUpDown,
  SignOut,
} from "@phosphor-icons/react/dist/ssr"
import { activeProjects, navItems, type NavItemId } from "@/lib/data/sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { useProjects } from "@/hooks/useProjects"

const navItemIcons: Record<NavItemId, React.ComponentType<{ className?: string }>> = {
  dashboard: House,
  projects: Folder,
  clients: Users,
  invoices: Receipt,
  contracts: FileText,
}

const navItemPaths: Record<NavItemId, string> = {
  dashboard: "/",
  projects: "/projects",
  clients: "/clients",
  invoices: "/invoices",
  contracts: "/contracts",
}

export function AppSidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { projects } = useProjects()

  // Get active projects (in progress)
  const activeProjectsList = projects
    .filter((p) => p.status === "active")
    .slice(0, 4)
    .map((p, index) => ({
      id: p.id,
      name: p.name,
      color: `var(--chart-${(index % 5) + 1})`,
      progress: p.progress,
    }))

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter((item) => {
    // Clients is only visible to owners
    if (item.id === "clients" && user?.role !== "owner") {
      return false
    }
    return true
  })

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-800 text-primary-foreground shadow-[inset_0_-5px_6.6px_0_rgba(0,0,0,0.25)]">
              <img src="/logo-wrapper.png" alt="Logo" className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">
                {user?.role === "owner" ? "Dashboard" : "Client Portal"}
              </span>
              <span className="text-xs text-muted-foreground">
                {user?.role === "owner" ? "Owner" : "Client"}
              </span>
            </div>
          </div>
          <button className="rounded-md p-1 hover:bg-accent">
            <CaretUpDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-0 gap-0">
        <SidebarGroup>
          <div className="relative px-0 py-0">
            <MagnifyingGlass className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search"
              className="h-9 rounded-lg bg-muted/50 pl-8 text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/20 border-border border shadow-none"
            />
            <kbd className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavItems.map((item) => {
                const Icon = navItemIcons[item.id]
                const path = navItemPaths[item.id]
                const isActive = pathname === path || (path !== "/" && pathname.startsWith(path))

                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="h-9 rounded-lg px-3 font-normal text-muted-foreground"
                    >
                      <Link href={path}>
                        {Icon && <Icon className="h-[18px] w-[18px]" />}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.badge && (
                      <SidebarMenuBadge className="bg-muted text-muted-foreground rounded-full px-2">
                        {item.badge}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.role === "owner" && activeProjectsList.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-xs font-medium text-muted-foreground">
              Active Projects
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {activeProjectsList.map((project) => (
                  <SidebarMenuItem key={project.id}>
                    <SidebarMenuButton asChild className="h-9 rounded-lg px-3 group">
                      <Link href={`/projects/${project.id}`}>
                        <ProgressCircle progress={project.progress} color={project.color} size={18} />
                        <span className="flex-1 truncate text-sm">{project.name}</span>
                        <span className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-accent">
                          <span className="text-muted-foreground text-lg">···</span>
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
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
