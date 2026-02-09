export type ProjectFileType = "pdf" | "zip" | "fig" | "doc" | "image" | "file"

export interface ProjectFile {
  id: string
  projectId: string
  name: string
  type: ProjectFileType
  url: string // Firebase Storage URL or external URL
  sizeMB: number
  uploadedBy: string // userId
  createdAt: Date
  updatedAt: Date
}

export interface CreateProjectFileData {
  projectId: string
  name: string
  type: ProjectFileType
  url: string
  sizeMB: number
}
