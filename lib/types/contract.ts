export type ContractStatus = "draft" | "sent" | "signed" | "expired" | "cancelled"

export interface Contract {
  id: string
  clientId: string
  projectId?: string // Optional link to specific project
  title: string
  content: string // Rich text HTML from TipTap
  status: ContractStatus
  sentAt?: Date
  signedAt?: Date
  expiresAt?: Date
  fileUrl?: string // Optional PDF attachment
  createdAt: Date
  updatedAt: Date
  ownerId: string
}

export interface CreateContractData {
  clientId: string
  projectId?: string
  title: string
  content: string
  status?: ContractStatus
  expiresAt?: Date
  fileUrl?: string
}
