"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Folder, Receipt, FileText, Clock, CurrencyDollar } from "@phosphor-icons/react"
import { useAuth } from "@/contexts/AuthContext"
import { useProjects } from "@/hooks/useProjects"
import { useInvoices } from "@/hooks/useInvoices"
import { useContracts } from "@/hooks/useContracts"
import { useClient } from "@/hooks/useClients"
import Link from "next/link"
import type { ProjectStatus, InvoiceStatus, ContractStatus } from "@/lib/types"

const projectStatusColors: Record<ProjectStatus, string> = {
  backlog: "bg-muted text-muted-foreground",
  planned: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "on-hold": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  completed: "bg-primary/10 text-primary",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
}

const invoiceStatusColors: Record<InvoiceStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
}

export default function PortalDashboard() {
  const { user } = useAuth()
  const { client, loading: clientLoading } = useClient(user?.clientId)
  const { projects, loading: projectsLoading } = useProjects()
  const { invoices, loading: invoicesLoading } = useInvoices()
  const { contracts, loading: contractsLoading } = useContracts()

  const loading = clientLoading || projectsLoading || invoicesLoading || contractsLoading

  const activeProjects = projects.filter((p) => p.status === "active")
  const pendingInvoices = invoices.filter((i) => i.status === "sent" || i.status === "overdue")
  const signedContracts = contracts.filter((c) => c.status === "signed")

  const totalOwed = pendingInvoices.reduce((sum, i) => sum + i.total, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">
          Welcome, {user?.displayName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {client?.companyName ? `Viewing as ${client.companyName}` : "Your project dashboard"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Folder className="h-4 w-4 text-primary" />
              Active Projects
            </div>
            <p className="text-2xl font-semibold">{activeProjects.length}</p>
            <p className="text-xs text-muted-foreground">of {projects.length} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <CurrencyDollar className="h-4 w-4 text-orange-600" />
              Outstanding
            </div>
            <p className="text-2xl font-semibold text-orange-600">{formatCurrency(totalOwed)}</p>
            <p className="text-xs text-muted-foreground">{pendingInvoices.length} pending invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <FileText className="h-4 w-4 text-green-600" />
              Active Contracts
            </div>
            <p className="text-2xl font-semibold text-green-600">{signedContracts.length}</p>
            <p className="text-xs text-muted-foreground">signed agreements</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Your Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No projects yet
              </p>
            ) : (
              projects.slice(0, 5).map((project) => (
                <Link key={project.id} href={`/portal/projects/${project.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{project.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={project.progress} className="h-1.5 w-24" />
                        <span className="text-xs text-muted-foreground">{project.progress}%</span>
                      </div>
                    </div>
                    <Badge className={projectStatusColors[project.status]}>
                      {project.status}
                    </Badge>
                  </div>
                </Link>
              ))
            )}
            {projects.length > 5 && (
              <Link href="/portal/projects" className="block text-center text-sm text-primary hover:underline">
                View all {projects.length} projects
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No invoices yet
              </p>
            ) : (
              invoices.slice(0, 5).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      Due: {new Date(invoice.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(invoice.total)}</p>
                    <Badge className={invoiceStatusColors[invoice.status]}>
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
