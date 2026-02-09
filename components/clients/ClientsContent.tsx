"use client"

import { useState } from "react"
import { Plus, MagnifyingGlass, Buildings, User, EnvelopeSimple, Phone } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useClients } from "@/hooks/useClients"
import { ClientFormDialog } from "./ClientFormDialog"
import Link from "next/link"

export function ClientsContent() {
  const { clients, loading } = useClients()
  const [search, setSearch] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)

  const filteredClients = clients.filter((client) =>
    client.companyName.toLowerCase().includes(search.toLowerCase())
  )

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getPrimaryContact = (client: typeof clients[0]) => {
    return client.contacts.find((c) => c.isPrimary) || client.contacts[0]
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
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Manage your clients and their information
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      <div className="relative mb-6 max-w-md">
        <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Buildings className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No clients yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your first client to get started
          </p>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => {
            const primaryContact = getPrimaryContact(client)

            return (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(client.companyName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{client.companyName}</CardTitle>
                          {client.industry && (
                            <p className="text-xs text-muted-foreground">{client.industry}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant={client.status === "active" ? "default" : "secondary"}>
                        {client.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {primaryContact && (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{primaryContact.name}</span>
                          {primaryContact.role && (
                            <span className="text-muted-foreground">· {primaryContact.role}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <EnvelopeSimple className="h-4 w-4" />
                          <span>{primaryContact.email}</span>
                        </div>
                        {primaryContact.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{primaryContact.phone}</span>
                          </div>
                        )}
                      </>
                    )}
                    {client.contacts.length > 1 && (
                      <p className="text-xs text-muted-foreground">
                        +{client.contacts.length - 1} more contact{client.contacts.length > 2 ? "s" : ""}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      <ClientFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} />
    </div>
  )
}
