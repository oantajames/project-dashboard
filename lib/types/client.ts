export interface ClientContact {
  id: string
  name: string
  email: string
  phone?: string
  role?: string // e.g., "Primary Contact", "Technical Lead"
  isPrimary: boolean
}

export interface Client {
  id: string
  companyName: string
  industry?: string
  website?: string
  address?: string
  contacts: ClientContact[]
  notes?: string
  status: "active" | "inactive"
  createdAt: Date
  updatedAt: Date
  ownerId: string // The owner who created this client
}

export interface CreateClientData {
  companyName: string
  industry?: string
  website?: string
  address?: string
  contacts: Omit<ClientContact, "id">[]
  notes?: string
  status?: "active" | "inactive"
}
