import type { Project } from "@/lib/types"

export type FilterCounts = {
  status?: Record<string, number>
  priority?: Record<string, number>
  tags?: Record<string, number>
  members?: Record<string, number>
}

export function computeFilterCounts(list: Project[]): FilterCounts {
  const res: FilterCounts = {
    status: {},
    priority: {},
    tags: {},
    members: {},
  }

  for (const p of list) {
    // status
    res.status![p.status] = (res.status![p.status] || 0) + 1
    // priority
    res.priority![p.priority] = (res.priority![p.priority] || 0) + 1
    // tags
    for (const t of p.tags) {
      const id = t.toLowerCase()
      res.tags![id] = (res.tags![id] || 0) + 1
    }
    // members buckets based on picUserIds
    if (p.picUserIds.length === 0) {
      res.members!["no-member"] = (res.members!["no-member"] || 0) + 1
    }
    if (p.picUserIds.length > 0) {
      res.members!["current"] = (res.members!["current"] || 0) + 1
    }
    // Can add specific user counting here if needed
  }

  return res
}
