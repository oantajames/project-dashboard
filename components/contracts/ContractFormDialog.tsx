"use client"

import { useState } from "react"
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
import { createContract } from "@/lib/firebase/services/contracts"
import type { CreateContractData } from "@/lib/types"

interface ContractFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContractFormDialog({ open, onOpenChange }: ContractFormDialogProps) {
  const { user } = useAuth()
  const { clients } = useClients()
  const { projects } = useProjects()

  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [clientId, setClientId] = useState("")
  const [projectId, setProjectId] = useState("")
  const [content, setContent] = useState("")
  const [expiresAt, setExpiresAt] = useState("")

  const filteredProjects = projects.filter((p) => p.clientId === clientId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    if (!title.trim()) {
      toast.error("Please enter a title")
      return
    }

    if (!clientId) {
      toast.error("Please select a client")
      return
    }

    setLoading(true)

    try {
      const data: CreateContractData = {
        title,
        clientId,
        projectId: projectId || undefined,
        content: content || "<p>Contract content goes here...</p>",
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      }

      await createContract(data, user.id)
      toast.success("Contract created successfully")
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error("Error creating contract:", error)
      toast.error("Failed to create contract")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTitle("")
    setClientId("")
    setProjectId("")
    setContent("")
    setExpiresAt("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Contract</DialogTitle>
          <DialogDescription>Create a new contract for your client</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Website Development Agreement"
              required
            />
          </div>

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
          </div>

          <div className="space-y-2">
            <Label>Expiration Date (Optional)</Label>
            <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Contract Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter the contract terms and conditions..."
              rows={10}
            />
            <p className="text-xs text-muted-foreground">
              You can edit the full content after creating the contract.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Contract"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
