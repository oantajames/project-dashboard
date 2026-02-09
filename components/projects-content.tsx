"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ProjectHeader } from "@/components/project-header"
import { ProjectTimeline } from "@/components/project-timeline"
import { ProjectCardsView } from "@/components/project-cards-view"
import { ProjectBoardView } from "@/components/project-board-view"
import { ProjectWizard } from "@/components/project-wizard/ProjectWizard"
import { useProjects } from "@/hooks/useProjects"
import { useClients } from "@/hooks/useClients"
import { computeFilterCounts } from "@/lib/utils/project-filters"
import { DEFAULT_VIEW_OPTIONS, type FilterChip, type ViewOptions } from "@/lib/view-options"
import { chipsToParams, paramsToChips } from "@/lib/url/filters"
import type { DisplayProject } from "@/components/project-card"

export function ProjectsContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Firebase data
  const { projects, loading: projectsLoading } = useProjects()
  const { clients } = useClients()

  const [viewOptions, setViewOptions] = useState<ViewOptions>(DEFAULT_VIEW_OPTIONS)

  const [filters, setFilters] = useState<FilterChip[]>([])

  const [isWizardOpen, setIsWizardOpen] = useState(false)

  const isSyncingRef = useRef(false)
  const prevParamsRef = useRef<string>("")

  const openWizard = () => {
    setIsWizardOpen(true)
  }

  const closeWizard = () => {
    setIsWizardOpen(false)
  }

  const handleProjectCreated = () => {
    setIsWizardOpen(false)
  }

  const removeFilter = (key: string, value: string) => {
    const next = filters.filter((f) => !(f.key === key && f.value === value))
    setFilters(next)
    replaceUrlFromChips(next)
  }

  const applyFilters = (chips: FilterChip[]) => {
    setFilters(chips)
    replaceUrlFromChips(chips)
  }

  useEffect(() => {
    const currentParams = searchParams.toString()

    // Only sync if this is the first load or if params actually changed (not from our own update)
    if (prevParamsRef.current === currentParams) return

    // If we just made an update, skip this sync to avoid feedback loop
    if (isSyncingRef.current) {
      isSyncingRef.current = false
      return
    }

    prevParamsRef.current = currentParams
    const params = new URLSearchParams(searchParams.toString())
    const chips = paramsToChips(params)
    setFilters(chips)
  }, [searchParams])

  const replaceUrlFromChips = (chips: FilterChip[]) => {
    const params = chipsToParams(chips)
    const qs = params.toString()
    const url = qs ? `${pathname}?${qs}` : pathname

    isSyncingRef.current = true
    prevParamsRef.current = qs
    router.replace(url, { scroll: false })
  }
  // Create a map of client IDs to client names for quick lookup
  const clientNameMap = useMemo(() => {
    const map = new Map<string, string>()
    clients.forEach((c) => map.set(c.id, c.companyName))
    return map
  }, [clients])

  // Compute duration label from start/end dates
  const computeDurationLabel = (startDate?: Date, endDate?: Date): string => {
    if (!startDate || !endDate) return ""
    const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 7) return `${diffDays} days`
    if (diffDays < 30) {
      const weeks = Math.ceil(diffDays / 7)
      return `${weeks} week${weeks > 1 ? "s" : ""}`
    }
    const months = Math.ceil(diffDays / 30)
    return `${months} month${months > 1 ? "s" : ""}`
  }

  const filteredProjects = useMemo((): DisplayProject[] => {
    // Enrich projects with display fields
    let list: DisplayProject[] = projects.map((p) => ({
      ...p,
      clientName: clientNameMap.get(p.clientId) || undefined,
      durationLabel: computeDurationLabel(p.startDate, p.endDate),
    }))

    // Apply showClosedProjects toggle
    if (!viewOptions.showClosedProjects) {
      list = list.filter((p) => p.status !== "completed" && p.status !== "cancelled")
    }

    // Build filter buckets from chips
    const statusSet = new Set<string>()
    const prioritySet = new Set<string>()
    const tagSet = new Set<string>()
    const memberSet = new Set<string>()

    for (const { key, value } of filters) {
      const k = key.trim().toLowerCase()
      const v = value.trim().toLowerCase()
      if (k.startsWith("status")) statusSet.add(v)
      else if (k.startsWith("priority")) prioritySet.add(v)
      else if (k.startsWith("tag")) tagSet.add(v)
      else if (k === "pic" || k.startsWith("member")) memberSet.add(v)
    }

    if (statusSet.size) list = list.filter((p) => statusSet.has(p.status.toLowerCase()))
    if (prioritySet.size) list = list.filter((p) => prioritySet.has(p.priority.toLowerCase()))
    if (tagSet.size) list = list.filter((p) => p.tags.some((t) => tagSet.has(t.toLowerCase())))
    if (memberSet.size) {
      const members = Array.from(memberSet)
      list = list.filter((p) => p.picUserIds.some((m) => members.some((mv) => m.toLowerCase().includes(mv))))
    }

    // Ordering
    const sorted = list.slice()
    if (viewOptions.ordering === "alphabetical") sorted.sort((a, b) => a.name.localeCompare(b.name))
    if (viewOptions.ordering === "date") sorted.sort((a, b) => (a.endDate?.getTime() || 0) - (b.endDate?.getTime() || 0))
    return sorted
  }, [filters, viewOptions, projects, clientNameMap])

  if (projectsLoading) {
    return (
      <div className="flex flex-1 flex-col bg-background mx-2 my-2 border border-border rounded-lg min-w-0">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading projects...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col bg-background mx-2 my-2 border border-border rounded-lg min-w-0">
      <ProjectHeader
        filters={filters}
        onRemoveFilter={removeFilter}
        onFiltersChange={applyFilters}
        counts={computeFilterCounts(projects)}
        viewOptions={viewOptions}
        onViewOptionsChange={setViewOptions}
        onAddProject={openWizard}
      />
      {viewOptions.viewType === "timeline" && <ProjectTimeline />}
      {viewOptions.viewType === "list" && <ProjectCardsView projects={filteredProjects} onCreateProject={openWizard} />}
      {viewOptions.viewType === "board" && <ProjectBoardView projects={filteredProjects} onAddProject={openWizard} />}
      {isWizardOpen && (
        <ProjectWizard onClose={closeWizard} onCreate={handleProjectCreated} />
      )}
    </div>
  )
}
