export interface ProjectNote {
  id: string
  projectId: string
  title?: string
  content: string // Rich text (HTML)
  authorId: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateProjectNoteData {
  projectId: string
  title?: string
  content: string
}
