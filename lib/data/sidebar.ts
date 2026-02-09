export type NavItemId = "dashboard" | "projects" | "clients" | "invoices" | "contracts"

export type SidebarFooterItemId = "settings"

export type NavItem = {
    id: NavItemId
    label: string
    badge?: number
    isActive?: boolean
}

export type ActiveProjectSummary = {
    id: string
    name: string
    color: string
    progress: number
}

export type SidebarFooterItem = {
    id: SidebarFooterItemId
    label: string
}

export const navItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", isActive: true },
    { id: "projects", label: "Projects" },
    { id: "clients", label: "Clients" },
    { id: "invoices", label: "Invoices" },
    { id: "contracts", label: "Contracts" },
]

export const activeProjects: ActiveProjectSummary[] = [
    { id: "ai-learning", name: "AI Learning Platform", color: "var(--chart-5)", progress: 25 },
    { id: "fintech-app", name: "Fintech Mobile App", color: "var(--chart-3)", progress: 80 },
    { id: "ecommerce-admin", name: "E-commerce Admin", color: "var(--chart-3)", progress: 65 },
    { id: "healthcare-app", name: "Healthcare Booking App", color: "var(--chart-2)", progress: 10 },
]

export const footerItems: SidebarFooterItem[] = [
    { id: "settings", label: "Settings" },
]
