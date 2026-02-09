"use client"

import { useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  Buildings,
  Globe,
  MapPin,
  User,
  EnvelopeSimple,
  Phone,
  PencilSimple,
  Trash,
  Plus,
  CaretLeft,
  Folder,
  FileText,
  Receipt,
} from "@phosphor-icons/react/dist/ssr"
import { useClient } from "@/hooks/useClients"
import { useProjects } from "@/hooks/useProjects"
import { useInvoices } from "@/hooks/useInvoices"
import { useContracts } from "@/hooks/useContracts"
import { deleteClient } from "@/lib/firebase/services/clients"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ClientFormDialog } from "./ClientFormDialog"

interface ClientDetailsPageProps {
  clientId: string
}

export function ClientDetailsPage({ clientId }: ClientDetailsPageProps) {
  const router = useRouter()
  const { client, loading: clientLoading } = useClient(clientId)
  const { projects, loading: projectsLoading } = useProjects(clientId)
  const { invoices, loading: invoicesLoading } = useInvoices(clientId)
  const { contracts, loading: contractsLoading } = useContracts(clientId)

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loading = clientLoading || projectsLoading || invoicesLoading || contractsLoading

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleDelete = useCallback(async () => {
    setIsDeleting(true)
    try {
      await deleteClient(clientId)
      toast.success("Client deleted successfully")
      router.push("/clients")
    } catch (error) {
      console.error("Error deleting client:", error)
      toast.error("Failed to delete client")
    } finally {
      setIsDeleting(false)
      setIsDeleteOpen(false)
    }
  }, [clientId, router])

  if (loading) {
    return <ClientDetailsSkeleton />
  }

  if (!client) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <Buildings className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-medium mb-2">Client not found</h2>
        <p className="text-sm text-muted-foreground mb-4">
          The client you're looking for doesn't exist or has been deleted.
        </p>
        <Button asChild>
          <Link href="/clients">
            <CaretLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Link>
        </Button>
      </div>
    )
  }

  const primaryContact = client.contacts.find((c) => c.isPrimary) || client.contacts[0]

  return (
    <div className="flex flex-1 flex-col min-w-0 m-2 border border-border rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent text-muted-foreground" />
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/clients" className="text-muted-foreground hover:text-foreground">
              Clients
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">{client.companyName}</span>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
            <PencilSimple className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsDeleteOpen(true)}>
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Separator />

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Client Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {getInitials(client.companyName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">{client.companyName}</CardTitle>
                    {client.industry && (
                      <p className="text-sm text-muted-foreground">{client.industry}</p>
                    )}
                  </div>
                </div>
                <Badge variant={client.status === "active" ? "default" : "secondary"}>
                  {client.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {client.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={client.website.startsWith("http") ? client.website : `https://${client.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {client.website}
                    </a>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{client.address}</span>
                  </div>
                )}
              </div>
              {client.notes && (
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground">{client.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contacts Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              {client.contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No contacts added yet.</p>
              ) : (
                <div className="space-y-4">
                  {client.contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{contact.name}</span>
                          {contact.role && (
                            <span className="text-sm text-muted-foreground">· {contact.role}</span>
                          )}
                          {contact.isPrimary && (
                            <Badge variant="outline" className="text-xs">
                              Primary
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <EnvelopeSimple className="h-4 w-4" />
                          <span>{contact.email}</span>
                        </div>
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Items Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Projects */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    Projects
                  </CardTitle>
                  <Badge variant="secondary">{projects.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No projects yet.</p>
                ) : (
                  <div className="space-y-2">
                    {projects.slice(0, 5).map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="block p-2 rounded-md hover:bg-muted transition-colors"
                      >
                        <p className="text-sm font-medium truncate">{project.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{project.status}</p>
                      </Link>
                    ))}
                    {projects.length > 5 && (
                      <p className="text-xs text-muted-foreground pt-1">
                        +{projects.length - 5} more
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoices */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Invoices
                  </CardTitle>
                  <Badge variant="secondary">{invoices.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No invoices yet.</p>
                ) : (
                  <div className="space-y-2">
                    {invoices.slice(0, 5).map((invoice) => (
                      <div
                        key={invoice.id}
                        className="p-2 rounded-md hover:bg-muted transition-colors"
                      >
                        <p className="text-sm font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground capitalize">{invoice.status}</p>
                      </div>
                    ))}
                    {invoices.length > 5 && (
                      <p className="text-xs text-muted-foreground pt-1">
                        +{invoices.length - 5} more
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contracts */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Contracts
                  </CardTitle>
                  <Badge variant="secondary">{contracts.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {contracts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No contracts yet.</p>
                ) : (
                  <div className="space-y-2">
                    {contracts.slice(0, 5).map((contract) => (
                      <div
                        key={contract.id}
                        className="p-2 rounded-md hover:bg-muted transition-colors"
                      >
                        <p className="text-sm font-medium truncate">{contract.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{contract.status}</p>
                      </div>
                    ))}
                    {contracts.length > 5 && (
                      <p className="text-xs text-muted-foreground pt-1">
                        +{contracts.length - 5} more
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <ClientFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        client={client}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{client.companyName}"? This action cannot be undone.
              All associated data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ClientDetailsSkeleton() {
  return (
    <div className="flex flex-1 flex-col min-w-0 m-2 border border-border rounded-lg">
      <div className="flex items-center justify-between gap-4 px-4 py-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
      <Separator />
      <div className="flex-1 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    </div>
  )
}
