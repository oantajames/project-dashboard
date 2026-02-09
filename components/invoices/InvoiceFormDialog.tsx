"use client"

import { useState } from "react"
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
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { useClients } from "@/hooks/useClients"
import { useProjects } from "@/hooks/useProjects"
import { createInvoice } from "@/lib/firebase/services/invoices"
import type { CreateInvoiceData } from "@/lib/types"

interface InvoiceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface LineItem {
  description: string
  quantity: number
  unitPrice: number
}

export function InvoiceFormDialog({ open, onOpenChange }: InvoiceFormDialogProps) {
  const { user } = useAuth()
  const { clients } = useClients()
  const { projects } = useProjects()

  const [loading, setLoading] = useState(false)
  const [clientId, setClientId] = useState("")
  const [projectId, setProjectId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [tax, setTax] = useState(0)
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unitPrice: 0 }])

  const filteredProjects = projects.filter((p) => p.clientId === clientId)

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const newItems = [...items]
    if (field === "quantity" || field === "unitPrice") {
      newItems[index][field] = Number(value) || 0
    } else {
      newItems[index][field] = value as string
    }
    setItems(newItems)
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const total = subtotal + tax

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    if (!clientId) {
      toast.error("Please select a client")
      return
    }

    if (!dueDate) {
      toast.error("Please set a due date")
      return
    }

    const validItems = items.filter((item) => item.description && item.quantity > 0 && item.unitPrice > 0)
    if (validItems.length === 0) {
      toast.error("Please add at least one valid line item")
      return
    }

    setLoading(true)

    try {
      const data: CreateInvoiceData = {
        clientId,
        projectId: projectId || undefined,
        items: validItems,
        tax: tax || undefined,
        dueDate: new Date(dueDate),
        notes: notes || undefined,
      }

      await createInvoice(data, user.id)
      toast.success("Invoice created successfully")
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error("Error creating invoice:", error)
      toast.error("Failed to create invoice")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setClientId("")
    setProjectId("")
    setDueDate("")
    setNotes("")
    setTax(0)
    setItems([{ description: "", quantity: 1, unitPrice: 0 }])
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogDescription>Create a new invoice for your client</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Project (Optional)</Label>
              <Select value={projectId} onValueChange={setProjectId} disabled={!clientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Tax Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={tax || ""}
                onChange={(e) => setTax(Number(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Line Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
            {items.map((item, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                  />
                </div>
                <div className="w-20 space-y-2">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity || ""}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                  />
                </div>
                <div className="w-28 space-y-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price"
                    value={item.unitPrice || ""}
                    onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                  />
                </div>
                <div className="w-24 text-right pt-2 text-sm font-medium">
                  {formatCurrency(item.quantity * item.unitPrice)}
                </div>
                {items.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                    <Trash className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <div className="flex justify-end border-t pt-4">
              <div className="space-y-1 text-right">
                <div className="flex justify-between gap-8 text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {tax > 0 && (
                  <div className="flex justify-between gap-8 text-sm">
                    <span className="text-muted-foreground">Tax:</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                )}
                <div className="flex justify-between gap-8 font-medium">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or payment instructions..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
