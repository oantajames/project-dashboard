import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../config"
import type { User, UserRole } from "@/lib/types"

const COLLECTION = "users"

function docToUser(id: string, data: Record<string, unknown>): User {
  return {
    id,
    email: data.email as string,
    displayName: data.displayName as string,
    role: data.role as UserRole,
    clientId: (data.clientId as string) || undefined,
    avatarUrl: (data.avatarUrl as string) || undefined,
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate() || new Date(),
    updatedAt: (data.updatedAt as { toDate: () => Date })?.toDate() || new Date(),
  }
}

export async function getUserById(id: string): Promise<User | null> {
  const docRef = doc(db, COLLECTION, id)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  return docToUser(id, docSnap.data())
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const q = query(collection(db, COLLECTION), where("email", "==", email))
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return null
  }

  const docSnap = snapshot.docs[0]
  return docToUser(docSnap.id, docSnap.data())
}

export async function getUsersByRole(role: UserRole): Promise<User[]> {
  const q = query(collection(db, COLLECTION), where("role", "==", role))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => docToUser(doc.id, doc.data()))
}

export async function updateUser(
  id: string,
  data: Partial<Pick<User, "displayName" | "avatarUrl">>
): Promise<void> {
  const docRef = doc(db, COLLECTION, id)
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}
