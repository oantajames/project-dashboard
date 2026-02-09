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
import type { ClientInvite, CreateInviteData, InviteStatus } from "@/lib/types"

const COLLECTION = "invites"

function generateId(): string {
  return doc(collection(db, COLLECTION)).id
}

function generateToken(): string {
  return crypto.randomUUID()
}

function docToInvite(id: string, data: Record<string, unknown>): ClientInvite {
  return {
    id,
    clientId: data.clientId as string,
    email: data.email as string,
    token: data.token as string,
    status: (data.status as InviteStatus) || "pending",
    expiresAt: (data.expiresAt as { toDate: () => Date })?.toDate() || new Date(),
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate() || new Date(),
    acceptedAt: (data.acceptedAt as { toDate: () => Date })?.toDate() || undefined,
    ownerId: data.ownerId as string,
  }
}

export async function createInvite(
  data: CreateInviteData,
  ownerId: string
): Promise<ClientInvite> {
  const id = generateId()
  const token = generateToken()

  // Expires in 7 days
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const inviteData = {
    clientId: data.clientId,
    email: data.email,
    token,
    status: "pending",
    expiresAt,
    ownerId,
    createdAt: serverTimestamp(),
    acceptedAt: null,
  }

  await setDoc(doc(db, COLLECTION, id), inviteData)

  return {
    id,
    clientId: data.clientId,
    email: data.email,
    token,
    status: "pending",
    expiresAt,
    ownerId,
    createdAt: new Date(),
  }
}

export async function getInviteById(id: string): Promise<ClientInvite | null> {
  const docRef = doc(db, COLLECTION, id)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  return docToInvite(id, docSnap.data())
}

export async function getInviteByToken(token: string): Promise<ClientInvite | null> {
  const q = query(collection(db, COLLECTION), where("token", "==", token))
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return null
  }

  const docSnap = snapshot.docs[0]
  return docToInvite(docSnap.id, docSnap.data())
}

export async function getInvitesByClientId(clientId: string): Promise<ClientInvite[]> {
  const q = query(
    collection(db, COLLECTION),
    where("clientId", "==", clientId)
  )
  const snapshot = await getDocs(q)

  return snapshot.docs
    .map((doc) => docToInvite(doc.id, doc.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function getInvitesByOwnerId(ownerId: string): Promise<ClientInvite[]> {
  const q = query(
    collection(db, COLLECTION),
    where("ownerId", "==", ownerId)
  )
  const snapshot = await getDocs(q)

  return snapshot.docs
    .map((doc) => docToInvite(doc.id, doc.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function getPendingInvites(ownerId: string): Promise<ClientInvite[]> {
  const q = query(
    collection(db, COLLECTION),
    where("ownerId", "==", ownerId),
    where("status", "==", "pending")
  )
  const snapshot = await getDocs(q)

  return snapshot.docs
    .map((doc) => docToInvite(doc.id, doc.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function acceptInvite(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION, id)
  await updateDoc(docRef, {
    status: "accepted",
    acceptedAt: serverTimestamp(),
  })
}

export async function expireInvite(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION, id)
  await updateDoc(docRef, {
    status: "expired",
  })
}

export async function resendInvite(id: string): Promise<ClientInvite> {
  const invite = await getInviteById(id)
  if (!invite) {
    throw new Error("Invite not found")
  }

  // Create a new token and extend expiration
  const token = generateToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await updateDoc(doc(db, COLLECTION, id), {
    token,
    status: "pending",
    expiresAt,
  })

  return {
    ...invite,
    token,
    status: "pending",
    expiresAt,
  }
}

export async function deleteInvite(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id))
}
