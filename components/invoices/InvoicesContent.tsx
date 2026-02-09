"use client"

import { useState } from "react"
import { Plus, MagnifyingGlass, Receipt, Calendar, CurrencyDollar } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useInvoices, useInvoiceStats } from "@/hooks/useInvoices"
import { useClients } from "@/hooks/useClients"
import { InvoiceFormDialog } from "./InvoiceFormDialog"
import { format } from "date-fns"
import Link from "next/link"
import type { InvoiceStatus } from "@/lib/types"

const statusColors: Record<InvoiceStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
}

export function InvoicesContent() {
  const { invoices, loading } = useInvoices()
  const { stats } = useInvoiceStats()
  const { clients } = useClients()
  const [search, setSearch] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)

  const filteredInvoices = invoices.filter((invoice) => {
    const client = clients.find((c) => c.id === invoice.clientId)
    return (
      invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      client?.companyName.toLowerCase().includes(search.toLowerCase())
    )
  })

  const getClientName = (clientId: string) => {
    return clients.find((c) => c.id === clientId)?.companyName || "Unknown Client"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="flex-1 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage your invoices
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <CurrencyDollar className="h-4 w-4" />
              Total Revenue
            </div>
            <p className="text-2xl font-semibold">{formatCurrency(stats.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Receipt className="h-4 w-4 text-green-600" />
              Paid
            </div>
            <p className="text-2xl font-semibold text-green-600">{formatCurrency(stats.paid)}</p>
            <p className="text-xs text-muted-foreground">{stats.count.paid} invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Calendar className="h-4 w-4 text-blue-600" />
              Pending
            </div>
            <p className="text-2xl font-semibold text-blue-600">{formatCurrency(stats.pending)}</p>
            <p className="text-xs text-muted-foreground">
              {stats.count.draft + stats.count.sent} invoices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Receipt className="h-4 w-4 text-red-600" />
              Overdue
            </div>
            <p className="text-2xl font-semibold text-red-600">{formatCurrency(stats.overdue)}</p>
            <p className="text-xs text-muted-foreground">{stats.count.overdue} invoices</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative mb-6 max-w-md">
        <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search invoices..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No invoices yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first invoice to get started
          </p>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link href={`/invoices/${invoice.id}`} className="font-medium hover:underline">
                      {invoice.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{getClientName(invoice.clientId)}</TableCell>
                  <TableCell>{format(invoice.issueDate, "MMM d, yyyy")}</TableCell>
                  <TableCell>{format(invoice.dueDate, "MMM d, yyyy")}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(invoice.total)}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[invoice.status]}>{invoice.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <InvoiceFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} />
    </div>
  )
}
