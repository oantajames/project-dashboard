import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../config"
import type { Invoice, CreateInvoiceData, InvoiceItem, InvoiceStatus } from "@/lib/types"

const COLLECTION = "invoices"

function generateId(): string {
  return doc(collection(db, COLLECTION)).id
}

function docToInvoice(id: string, data: Record<string, unknown>): Invoice {
  return {
    id,
    invoiceNumber: data.invoiceNumber as string,
    clientId: data.clientId as string,
    projectId: (data.projectId as string) || undefined,
    items: (data.items as InvoiceItem[]) || [],
    subtotal: (data.subtotal as number) || 0,
    tax: (data.tax as number) || undefined,
    total: (data.total as number) || 0,
    status: (data.status as InvoiceStatus) || "draft",
    issueDate: (data.issueDate as { toDate: () => Date })?.toDate() || new Date(),
    dueDate: (data.dueDate as { toDate: () => Date })?.toDate() || new Date(),
    paidAt: (data.paidAt as { toDate: () => Date })?.toDate() || undefined,
    notes: (data.notes as string) || undefined,
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate() || new Date(),
    updatedAt: (data.updatedAt as { toDate: () => Date })?.toDate() || new Date(),
    ownerId: data.ownerId as string,
  }
}

async function generateInvoiceNumber(ownerId: string): Promise<string> {
  const year = new Date().getFullYear()
  const q = query(
    collection(db, COLLECTION),
    where("ownerId", "==", ownerId)
  )
  const snapshot = await getDocs(q)
  const count = snapshot.size + 1
  return `INV-${year}-${count.toString().padStart(3, "0")}`
}

export async function createInvoice(
  data: CreateInvoiceData,
  ownerId: string
): Promise<Invoice> {
  const id = generateId()
  const invoiceNumber = await generateInvoiceNumber(ownerId)

  const items = data.items.map((item) => ({
    ...item,
    id: generateId(),
    amount: item.quantity * item.unitPrice,
  }))

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const total = subtotal + (data.tax || 0)

  const invoiceData = {
    invoiceNumber,
    clientId: data.clientId,
    projectId: data.projectId || null,
    items,
    subtotal,
    tax: data.tax || 0,
    total,
    status: "draft",
    issueDate: data.issueDate || new Date(),
    dueDate: data.dueDate,
    paidAt: null,
    notes: data.notes || null,
    ownerId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(doc(db, COLLECTION, id), invoiceData)

  return {
    id,
    invoiceNumber,
    clientId: data.clientId,
    projectId: data.projectId,
    items,
    subtotal,
    tax: data.tax,
    total,
    status: "draft",
    issueDate: data.issueDate || new Date(),
    dueDate: data.dueDate,
    notes: data.notes,
    ownerId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const docRef = doc(db, COLLECTION, id)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  return docToInvoice(id, docSnap.data())
}

export async function getInvoices(ownerId: string): Promise<Invoice[]> {
  const q = query(
    collection(db, COLLECTION),
    where("ownerId", "==", ownerId)
  )
  const snapshot = await getDocs(q)

  return snapshot.docs
    .map((doc) => docToInvoice(doc.id, doc.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function getInvoicesByClientId(clientId: string): Promise<Invoice[]> {
  const q = query(
    collection(db, COLLECTION),
    where("clientId", "==", clientId)
  )
  const snapshot = await getDocs(q)

  return snapshot.docs
    .map((doc) => docToInvoice(doc.id, doc.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function getInvoicesByProjectId(projectId: string): Promise<Invoice[]> {
  const q = query(
    collection(db, COLLECTION),
    where("projectId", "==", projectId)
  )
  const snapshot = await getDocs(q)

  return snapshot.docs
    .map((doc) => docToInvoice(doc.id, doc.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function getInvoicesByStatus(
  ownerId: string,
  status: InvoiceStatus
): Promise<Invoice[]> {
  const q = query(
    collection(db, COLLECTION),
    where("ownerId", "==", ownerId),
    where("status", "==", status)
  )
  const snapshot = await getDocs(q)

  return snapshot.docs
    .map((doc) => docToInvoice(doc.id, doc.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function updateInvoice(
  id: string,
  data: Partial<CreateInvoiceData>
): Promise<void> {
  const docRef = doc(db, COLLECTION, id)

  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: serverTimestamp(),
  }

  // Recalculate totals if items are updated
  if (data.items) {
    const items = data.items.map((item) => ({
      ...item,
      id: (item as InvoiceItem).id || generateId(),
      amount: item.quantity * item.unitPrice,
    }))
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
    const tax = data.tax || 0
    updateData.items = items
    updateData.subtotal = subtotal
    updateData.total = subtotal + tax
  }

  await updateDoc(docRef, updateData)
}

export async function markInvoiceAsSent(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION, id)
  await updateDoc(docRef, {
    status: "sent",
    updatedAt: serverTimestamp(),
  })
}

export async function markInvoiceAsPaid(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION, id)
  await updateDoc(docRef, {
    status: "paid",
    paidAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function markInvoiceAsOverdue(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION, id)
  await updateDoc(docRef, {
    status: "overdue",
    updatedAt: serverTimestamp(),
  })
}

export async function deleteInvoice(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id))
}
