export type InviteStatus = "pending" | "accepted" | "expired"

export interface ClientInvite {
  id: string
  clientId: string
  email: string
  token: string // UUID for invite URL
  status: InviteStatus
  expiresAt: Date
  createdAt: Date
  acceptedAt?: Date
  ownerId: string
}

export interface CreateInviteData {
  clientId: string
  email: string
}
