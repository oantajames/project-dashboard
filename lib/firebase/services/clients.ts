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
import type { Client, CreateClientData, ClientContact } from "@/lib/types"

const COLLECTION = "clients"

function generateId(): string {
  return doc(collection(db, COLLECTION)).id
}

function docToClient(id: string, data: Record<string, unknown>): Client {
  return {
    id,
    companyName: data.companyName as string,
    industry: (data.industry as string) || undefined,
    website: (data.website as string) || undefined,
    address: (data.address as string) || undefined,
    contacts: (data.contacts as ClientContact[]) || [],
    notes: (data.notes as string) || undefined,
    status: (data.status as "active" | "inactive") || "active",
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate() || new Date(),
    updatedAt: (data.updatedAt as { toDate: () => Date })?.toDate() || new Date(),
    ownerId: data.ownerId as string,
  }
}

export async function createClient(
  data: CreateClientData,
  ownerId: string
): Promise<Client> {
  const id = generateId()
  const contacts = data.contacts.map((c) => ({
    id: generateId(),
    name: c.name,
    email: c.email,
    phone: c.phone || null,
    role: c.role || null,
    isPrimary: c.isPrimary,
  }))

  const clientData = {
    companyName: data.companyName,
    industry: data.industry || null,
    website: data.website || null,
    address: data.address || null,
    contacts,
    notes: data.notes || null,
    status: data.status || "active",
    ownerId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(doc(db, COLLECTION, id), clientData)

  return {
    id,
    companyName: data.companyName,
    industry: data.industry,
    website: data.website,
    address: data.address,
    notes: data.notes,
    contacts: contacts.map(c => ({
      ...c,
      phone: c.phone || undefined,
      role: c.role || undefined,
    })),
    status: data.status || "active",
    ownerId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export async function getClientById(id: string): Promise<Client | null> {
  const docRef = doc(db, COLLECTION, id)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  return docToClient(id, docSnap.data())
}

export async function getClients(ownerId: string): Promise<Client[]> {
  const q = query(
    collection(db, COLLECTION),
    where("ownerId", "==", ownerId)
  )
  const snapshot = await getDocs(q)

  return snapshot.docs
    .map((doc) => docToClient(doc.id, doc.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function updateClient(
  id: string,
  data: Partial<CreateClientData>
): Promise<void> {
  const docRef = doc(db, COLLECTION, id)

  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  }

  // Only include fields that are defined, converting undefined to null
  if (data.companyName !== undefined) updateData.companyName = data.companyName
  if (data.industry !== undefined) updateData.industry = data.industry || null
  if (data.website !== undefined) updateData.website = data.website || null
  if (data.address !== undefined) updateData.address = data.address || null
  if (data.notes !== undefined) updateData.notes = data.notes || null
  if (data.status !== undefined) updateData.status = data.status

  // If contacts are being updated, ensure they have IDs and no undefined values
  if (data.contacts) {
    updateData.contacts = data.contacts.map((c) => ({
      id: (c as ClientContact).id || generateId(),
      name: c.name,
      email: c.email,
      phone: c.phone || null,
      role: c.role || null,
      isPrimary: c.isPrimary,
    }))
  }

  await updateDoc(docRef, updateData)
}

export async function deleteClient(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id))
}
