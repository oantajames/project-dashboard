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
import type { PRD, PRDSection, CreatePRDData } from "@/lib/types"
import { DEFAULT_PRD_SECTIONS } from "@/lib/types"

const COLLECTION = "prds"

function generateId(): string {
  return doc(collection(db, COLLECTION)).id
}

function docToPRD(id: string, data: Record<string, unknown>): PRD {
  return {
    id,
    projectId: data.projectId as string,
    version: data.version as string,
    sections: (data.sections as PRDSection[]) || [],
    isPublished: (data.isPublished as boolean) || false,
    publishedAt: (data.publishedAt as { toDate: () => Date })?.toDate() || undefined,
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate() || new Date(),
    updatedAt: (data.updatedAt as { toDate: () => Date })?.toDate() || new Date(),
  }
}

export async function createPRD(data: CreatePRDData): Promise<PRD> {
  const id = generateId()

  // Generate sections with IDs
  const sections = (data.sections || DEFAULT_PRD_SECTIONS).map((s) => ({
    ...s,
    id: generateId(),
  }))

  const prdData = {
    projectId: data.projectId,
    version: data.version || "1.0",
    sections,
    isPublished: false,
    publishedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(doc(db, COLLECTION, id), prdData)

  return {
    id,
    projectId: data.projectId,
    version: data.version || "1.0",
    sections,
    isPublished: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export async function getPRDById(id: string): Promise<PRD | null> {
  const docRef = doc(db, COLLECTION, id)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  return docToPRD(id, docSnap.data())
}

export async function getPRDByProjectId(projectId: string): Promise<PRD | null> {
  const q = query(
    collection(db, COLLECTION),
    where("projectId", "==", projectId)
  )
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return null
  }

  // Sort client-side and return the most recent
  const prds = snapshot.docs
    .map((doc) => docToPRD(doc.id, doc.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return prds[0]
}

export async function getPublishedPRDByProjectId(projectId: string): Promise<PRD | null> {
  const q = query(
    collection(db, COLLECTION),
    where("projectId", "==", projectId),
    where("isPublished", "==", true)
  )
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return null
  }

  // Sort client-side by publishedAt and return the most recent
  const prds = snapshot.docs
    .map((doc) => docToPRD(doc.id, doc.data()))
    .sort((a, b) => (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0))

  return prds[0]
}

export async function getPRDVersions(projectId: string): Promise<PRD[]> {
  const q = query(
    collection(db, COLLECTION),
    where("projectId", "==", projectId)
  )
  const snapshot = await getDocs(q)

  return snapshot.docs
    .map((doc) => docToPRD(doc.id, doc.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function updatePRD(
  id: string,
  data: Partial<{ version: string; sections: PRDSection[] }>
): Promise<void> {
  const docRef = doc(db, COLLECTION, id)
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function updatePRDSection(
  prdId: string,
  sectionId: string,
  content: string
): Promise<void> {
  const prd = await getPRDById(prdId)
  if (!prd) return

  const sections = prd.sections.map((s) =>
    s.id === sectionId ? { ...s, content } : s
  )

  await updatePRD(prdId, { sections })
}

export async function publishPRD(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION, id)
  await updateDoc(docRef, {
    isPublished: true,
    publishedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function unpublishPRD(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION, id)
  await updateDoc(docRef, {
    isPublished: false,
    updatedAt: serverTimestamp(),
  })
}

export async function deletePRD(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id))
}
