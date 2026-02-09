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
import type { Contract, CreateContractData, ContractStatus } from "@/lib/types"

const COLLECTION = "contracts"

function generateId(): string {
  return doc(collection(db, COLLECTION)).id
}

function docToContract(id: string, data: Record<string, unknown>): Contract {
  return {
    id,
    clientId: data.clientId as string,
    projectId: (data.projectId as string) || undefined,
    title: data.title as string,
    content: data.content as string,
    status: (data.status as ContractStatus) || "draft",
    sentAt: (data.sentAt as { toDate: () => Date })?.toDate() || undefined,
    signedAt: (data.signedAt as { toDate: () => Date })?.toDate() || undefined,
    expiresAt: (data.expiresAt as { toDate: () => Date })?.toDate() || undefined,
    fileUrl: (data.fileUrl as string) || undefined,
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate() || new Date(),
    updatedAt: (data.updatedAt as { toDate: () => Date })?.toDate() || new Date(),
    ownerId: data.ownerId as string,
  }
}

export async function createContract(
  data: CreateContractData,
  ownerId: string
): Promise<Contract> {
  const id = generateId()

  const contractData = {
    clientId: data.clientId,
    projectId: data.projectId || null,
    title: data.title,
    content: data.content,
    status: data.status || "draft",
    sentAt: null,
    signedAt: null,
    expiresAt: data.expiresAt || null,
    fileUrl: data.fileUrl || null,
    ownerId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(doc(db, COLLECTION, id), contractData)

  return {
    id,
    clientId: data.clientId,
    projectId: data.projectId,
    title: data.title,
    content: data.content,
    status: data.status || "draft",
    expiresAt: data.expiresAt,
    fileUrl: data.fileUrl,
    ownerId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export async function getContractById(id: string): Promise<Contract | null> {
  const docRef = doc(db, COLLECTION, id)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  return docToContract(id, docSnap.data())
}

export async function getContracts(ownerId: string): Promise<Contract[]> {
  const q = query(
    collection(db, COLLECTION),
    where("ownerId", "==", ownerId)
  )
  const snapshot = await getDocs(q)

  return snapshot.docs
    .map((doc) => docToContract(doc.id, doc.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function getContractsByClientId(clientId: string): Promise<Contract[]> {
  const q = query(
    collection(db, COLLECTION),
    where("clientId", "==", clientId)
  )
  const snapshot = await getDocs(q)

  return snapshot.docs
    .map((doc) => docToContract(doc.id, doc.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function getContractsByProjectId(projectId: string): Promise<Contract[]> {
  const q = query(
    collection(db, COLLECTION),
    where("projectId", "==", projectId)
  )
  const snapshot = await getDocs(q)

  return snapshot.docs
    .map((doc) => docToContract(doc.id, doc.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function updateContract(
  id: string,
  data: Partial<CreateContractData>
): Promise<void> {
  const docRef = doc(db, COLLECTION, id)
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function markContractAsSent(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION, id)
  await updateDoc(docRef, {
    status: "sent",
    sentAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function markContractAsSigned(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION, id)
  await updateDoc(docRef, {
    status: "signed",
    signedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function deleteContract(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id))
}
