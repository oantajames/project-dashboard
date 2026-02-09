"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { CalendarBlank, X } from "@phosphor-icons/react/dist/ssr"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { updateProject } from "@/lib/firebase/services/projects"
import { useClients } from "@/hooks/useClients"
import type { Project, ProjectStatus, ProjectPriority } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ProjectEditDialogProps {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

const STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "planned", label: "Planned" },
  { value: "active", label: "Active" },
  { value: "on-hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

const PRIORITIES: { value: ProjectPriority; label: string }[] = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
]

const PROJECT_TYPES = [
  { value: "mvp", label: "MVP" },
  { value: "revamp", label: "Revamp" },
  { value: "audit", label: "Audit" },
  { value: "design-sprint", label: "Design Sprint" },
  { value: "dev-sprint", label: "Dev Sprint" },
]

const PROJECT_GROUPS = [
  { value: "design", label: "Design" },
  { value: "development", label: "Development" },
  { value: "marketing", label: "Marketing" },
  { value: "research", label: "Research" },
]

// Helper to safely convert date
function toDate(value: Date | undefined): Date | undefined {
  if (!value) return undefined
  // Handle Firestore Timestamp
  if (typeof (value as any).toDate === "function") {
    return (value as any).toDate()
  }
  return value instanceof Date ? value : new Date(value)
}

export function ProjectEditDialog({ project, open, onOpenChange, onSaved }: ProjectEditDialogProps) {
  const { clients } = useClients()
  const [isSaving, setIsSaving] = useState(false)

  // Form state - initialize safely
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [clientId, setClientId] = useState("")
  const [status, setStatus] = useState<ProjectStatus>("backlog")
  const [priority, setPriority] = useState<ProjectPriority>("medium")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [typeLabel, setTypeLabel] = useState("_none")
  const [group, setGroup] = useState("_none")
  const [location, setLocation] = useState("")
  const [estimateHours, setEstimateHours] = useState("")
  const [tags, setTags] = useState("")

  // Reset form when project changes or dialog opens
  useEffect(() => {
    if (open && project) {
      setName(project.name || "")
      setDescription(project.description || "")
      setClientId(project.clientId || "")
      setStatus(project.status || "backlog")
      setPriority(project.priority || "medium")
      setStartDate(toDate(project.startDate))
      setEndDate(toDate(project.endDate))
      setTypeLabel(project.typeLabel || "_none")
      setGroup(project.group || "_none")
      setLocation(project.location || "")
      setEstimateHours(project.estimateHours?.toString() || "")
      setTags((project.tags || []).join(", "))
    }
  }, [project, open])

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Project name is required")
      return
    }

    setIsSaving(true)
    try {
      await updateProject(project.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        clientId,
        status,
        priority,
        startDate,
        endDate,
        typeLabel: typeLabel === "_none" ? undefined : typeLabel,
        group: group === "_none" ? undefined : group,
        location: location.trim() || undefined,
        estimateHours: estimateHours ? parseInt(estimateHours, 10) : undefined,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      })

      toast.success("Project updated successfully")
      onOpenChange(false)
      onSaved?.()
    } catch (error) {
      console.error("Error updating project:", error)
      toast.error("Failed to update project")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description"
              rows={3}
            />
          </div>

          {/* Client */}
          <div className="space-y-2">
            <Label>Client</Label>
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

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as ProjectPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarBlank className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarBlank className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Type and Group */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project Type</Label>
              <Select value={typeLabel} onValueChange={setTypeLabel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {PROJECT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.label}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Group</Label>
              <Select value={group} onValueChange={setGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {PROJECT_GROUPS.map((g) => (
                    <SelectItem key={g.value} value={g.label}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location and Estimate */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Remote, Australia"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimate">Estimate (hours)</Label>
              <Input
                id="estimate"
                type="number"
                value={estimateHours}
                onChange={(e) => setEstimateHours(e.target.value)}
                placeholder="e.g., 40"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., frontend, feature, urgent"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
