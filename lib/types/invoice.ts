export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled"

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface Invoice {
  id: string
  invoiceNumber: string // e.g., "INV-2024-001"
  clientId: string
  projectId?: string
  items: InvoiceItem[]
  subtotal: number
  tax?: number
  total: number
  status: InvoiceStatus
  issueDate: Date
  dueDate: Date
  paidAt?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
  ownerId: string
}

export interface CreateInvoiceData {
  clientId: string
  projectId?: string
  items: Omit<InvoiceItem, "id">[]
  tax?: number
  issueDate?: Date
  dueDate: Date
  notes?: string
}
