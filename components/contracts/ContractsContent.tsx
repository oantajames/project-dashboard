"use client"

import { useState } from "react"
import { Plus, MagnifyingGlass, FileText, Calendar, PaperPlaneTilt, Check } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useContracts } from "@/hooks/useContracts"
import { useClients } from "@/hooks/useClients"
import { ContractFormDialog } from "./ContractFormDialog"
import { format } from "date-fns"
import Link from "next/link"
import type { ContractStatus } from "@/lib/types"

const statusColors: Record<ContractStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  signed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  expired: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
}

const statusIcons: Record<ContractStatus, React.ComponentType<{ className?: string }>> = {
  draft: FileText,
  sent: PaperPlaneTilt,
  signed: Check,
  expired: Calendar,
  cancelled: FileText,
}

export function ContractsContent() {
  const { contracts, loading } = useContracts()
  const { clients } = useClients()
  const [search, setSearch] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)

  const filteredContracts = contracts.filter((contract) => {
    const client = clients.find((c) => c.id === contract.clientId)
    return (
      contract.title.toLowerCase().includes(search.toLowerCase()) ||
      client?.companyName.toLowerCase().includes(search.toLowerCase())
    )
  })

  const getClientName = (clientId: string) => {
    return clients.find((c) => c.id === clientId)?.companyName || "Unknown Client"
  }

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Contracts</h1>
          <p className="text-sm text-muted-foreground">
            Manage your client contracts and agreements
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Contract
        </Button>
      </div>

      <div className="relative mb-6 max-w-md">
        <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search contracts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredContracts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No contracts yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first contract to get started
          </p>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Contract
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredContracts.map((contract) => {
            const StatusIcon = statusIcons[contract.status]

            return (
              <Link key={contract.id} href={`/contracts/${contract.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{contract.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {getClientName(contract.clientId)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className={statusColors[contract.status]}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {contract.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Created: {format(contract.createdAt, "MMM d, yyyy")}
                      </div>
                      {contract.signedAt && (
                        <div className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-green-600" />
                          Signed: {format(contract.signedAt, "MMM d, yyyy")}
                        </div>
                      )}
                      {contract.expiresAt && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          Expires: {format(contract.expiresAt, "MMM d, yyyy")}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      <ContractFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} />
    </div>
  )
}
