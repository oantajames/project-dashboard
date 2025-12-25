"use client"

import { useEffect, useState, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ProjectHeader } from "@/components/project-header"
import { ProjectTimeline } from "@/components/project-timeline"
import { computeFilterCounts, projects } from "@/lib/data/projects"

export function ProjectsContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [viewOptions, setViewOptions] = useState({
    viewType: "list" as "list" | "board" | "timeline",
    tasks: "indented" as "indented" | "collapsed" | "flat",
    ordering: "manual" as "manual" | "alphabetical" | "date",
    showAbsentParent: false,
    showClosedProjects: true,
    groupBy: "none" as "none" | "status" | "assignee" | "tags",
    properties: ["title", "status", "assignee", "dueDate"] as string[],
  })

  const [filters, setFilters] = useState<{ key: string; value: string }[]>([])

  const isSyncingRef = useRef(false)
  const prevParamsRef = useRef<string>("")

  const removeFilter = (key: string, value: string) => {
    const next = filters.filter((f) => !(f.key === key && f.value === value))
    setFilters(next)
    replaceUrlFromChips(next)
  }

  const applyFilters = (chips: { key: string; value: string }[]) => {
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
    const params = new URLSearchParams(searchParams as any)
    const chips = paramsToChips(params)
    setFilters(chips)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const replaceUrlFromChips = (chips: { key: string; value: string }[]) => {
    const params = chipsToParams(chips)
    const qs = params.toString()
    const url = qs ? `${pathname}?${qs}` : pathname

    isSyncingRef.current = true
    prevParamsRef.current = qs
    router.replace(url, { scroll: false })
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
      />
      <ProjectTimeline viewOptions={viewOptions} />
    </div>
  )
}

// Helpers: URL sync
function chipsToParams(chips: { key: string; value: string }[]) {
  const params = new URLSearchParams()
  const buckets: Record<string, string[]> = {}
  for (const c of chips) {
    const k = normalizeKey(c.key)
    buckets[k] = buckets[k] || []
    buckets[k].push(c.value)
  }
  Object.entries(buckets).forEach(([k, arr]) => {
    if (arr.length) params.set(k, arr.join(","))
  })
  return params
}

function normalizeKey(k: string) {
  const s = k.trim().toLowerCase()
  if (s.startsWith("status")) return "status"
  if (s.startsWith("priority")) return "priority"
  if (s.startsWith("tag")) return "tags"
  if (s.startsWith("member") || s === "pic") return "members"
  return s
}

function paramsToChips(params: URLSearchParams) {
  const chips: { key: string; value: string }[] = []
  const add = (key: string, values?: string | null) => {
    if (!values) return
    values.split(",").forEach((v) => {
      if (!v) return
      chips.push({ key, value: v })
    })
  }
  add("Status", params.get("status"))
  add("Priority", params.get("priority"))
  add("Tag", params.get("tags"))
  add("Member", params.get("members"))
  return chips
}
