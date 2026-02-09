export type PRDSectionType = "overview" | "goals" | "scope" | "features" | "timeline"

export interface PRDSection {
  id: string
  type: PRDSectionType
  title: string
  content: string // Rich text HTML
  order: number
}

export interface PRD {
  id: string
  projectId: string
  version: string // e.g., "1.0", "1.1"
  sections: PRDSection[]
  isPublished: boolean
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreatePRDData {
  projectId: string
  version?: string
  sections?: Omit<PRDSection, "id">[]
}

export const DEFAULT_PRD_SECTIONS: Omit<PRDSection, "id">[] = [
  { type: "overview", title: "Overview", content: "", order: 0 },
  { type: "goals", title: "Goals", content: "", order: 1 },
  { type: "scope", title: "Scope", content: "", order: 2 },
  { type: "features", title: "Features", content: "", order: 3 },
  { type: "timeline", title: "Timeline", content: "", order: 4 },
]
