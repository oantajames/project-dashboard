export type UserRole = "owner" | "client"

export interface User {
  id: string
  email: string
  displayName: string
  role: UserRole
  clientId?: string // For client users - links to their client company
  avatarUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserData {
  email: string
  displayName: string
  role: UserRole
  clientId?: string
  avatarUrl?: string
}
