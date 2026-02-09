"use client"

import { useState, useEffect } from "react"
import { Plus, Trash } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { createClient, updateClient } from "@/lib/firebase/services/clients"
import type { Client, CreateClientData, ClientContact } from "@/lib/types"

interface ClientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client
}

interface ContactForm {
  name: string
  email: string
  phone: string
  role: string
  isPrimary: boolean
}

export function ClientFormDialog({ open, onOpenChange, client }: ClientFormDialogProps) {
  const { user } = useAuth()
  const isEditing = !!client

  const [loading, setLoading] = useState(false)
  const [companyName, setCompanyName] = useState(client?.companyName || "")
  const [industry, setIndustry] = useState(client?.industry || "")
  const [website, setWebsite] = useState(client?.website || "")
  const [address, setAddress] = useState(client?.address || "")
  const [notes, setNotes] = useState(client?.notes || "")
  const [status, setStatus] = useState<"active" | "inactive">(client?.status || "active")
  const [contacts, setContacts] = useState<ContactForm[]>([
    { name: "", email: "", phone: "", role: "", isPrimary: true }
  ])

  // Reset form when dialog opens or client changes
  useEffect(() => {
    if (open) {
      if (client) {
        setCompanyName(client.companyName || "")
        setIndustry(client.industry || "")
        setWebsite(client.website || "")
        setAddress(client.address || "")
        setNotes(client.notes || "")
        setStatus(client.status || "active")
        setContacts(
          client.contacts.map((c) => ({
            name: c.name,
            email: c.email,
            phone: c.phone || "",
            role: c.role || "",
            isPrimary: c.isPrimary,
          }))
        )
      } else {
        resetForm()
      }
    }
  }, [open, client])

  const addContact = () => {
    setContacts([...contacts, { name: "", email: "", phone: "", role: "", isPrimary: false }])
  }

  const removeContact = (index: number) => {
    if (contacts.length === 1) return
    const newContacts = contacts.filter((_, i) => i !== index)
    // Ensure at least one primary contact
    if (!newContacts.some((c) => c.isPrimary)) {
      newContacts[0].isPrimary = true
    }
    setContacts(newContacts)
  }

  const updateContact = (index: number, field: keyof ContactForm, value: string | boolean) => {
    const newContacts = [...contacts]
    if (field === "isPrimary" && value === true) {
      // Only one primary contact allowed
      newContacts.forEach((c, i) => {
        c.isPrimary = i === index
      })
    } else {
      newContacts[index] = { ...newContacts[index], [field]: value }
    }
    setContacts(newContacts)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    const validContacts = contacts.filter((c) => c.name && c.email)
    if (validContacts.length === 0) {
      toast.error("At least one contact with name and email is required")
      return
    }

    setLoading(true)

    try {
      const data: CreateClientData = {
        companyName,
        industry: industry || undefined,
        website: website || undefined,
        address: address || undefined,
        notes: notes || undefined,
        status,
        contacts: validContacts.map((c) => ({
          name: c.name,
          email: c.email,
          phone: c.phone || undefined,
          role: c.role || undefined,
          isPrimary: c.isPrimary,
        })),
      }

      if (isEditing && client) {
        await updateClient(client.id, data)
        toast.success("Client updated successfully")
      } else {
        await createClient(data, user.id)
        toast.success("Client created successfully")
      }

      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error("Error saving client:", error)
      toast.error(isEditing ? "Failed to update client" : "Failed to create client")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setCompanyName("")
    setIndustry("")
    setWebsite("")
    setAddress("")
    setNotes("")
    setStatus("active")
    setContacts([{ name: "", email: "", phone: "", role: "", isPrimary: true }])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Client" : "Add New Client"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the client information below"
              : "Enter the client details to add them to your dashboard"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Company Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g., Technology, Healthcare"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as "active" | "inactive")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Contacts</h3>
              <Button type="button" variant="outline" size="sm" onClick={addContact}>
                <Plus className="h-4 w-4 mr-1" />
                Add Contact
              </Button>
            </div>
            {contacts.map((contact, index) => (
              <div key={index} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`primary-${index}`}
                      checked={contact.isPrimary}
                      onCheckedChange={(checked) => updateContact(index, "isPrimary", !!checked)}
                    />
                    <Label htmlFor={`primary-${index}`} className="text-sm">
                      Primary Contact
                    </Label>
                  </div>
                  {contacts.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeContact(index)}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={contact.name}
                      onChange={(e) => updateContact(index, "name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={contact.email}
                      onChange={(e) => updateContact(index, "email", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={contact.phone}
                      onChange={(e) => updateContact(index, "phone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input
                      value={contact.role}
                      onChange={(e) => updateContact(index, "role", e.target.value)}
                      placeholder="e.g., CEO, Project Manager"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about this client..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Update Client" : "Create Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
