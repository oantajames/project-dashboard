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
import type { ProjectNote, CreateProjectNoteData } from "@/lib/types"

const COLLECTION = "project_notes"

function generateId(): string {
  return doc(collection(db, COLLECTION)).id
}

function docToProjectNote(id: string, data: Record<string, unknown>): ProjectNote {
  return {
    id,
    projectId: data.projectId as string,
    title: (data.title as string) || undefined,
    content: data.content as string,
    authorId: data.authorId as string,
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate() || new Date(),
    updatedAt: (data.updatedAt as { toDate: () => Date })?.toDate() || new Date(),
  }
}

export async function createProjectNote(
  data: CreateProjectNoteData,
  authorId: string
): Promise<ProjectNote> {
  const id = generateId()

  const noteData = {
    projectId: data.projectId,
    title: data.title || null,
    content: data.content,
    authorId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(doc(db, COLLECTION, id), noteData)

  return {
    id,
    projectId: data.projectId,
    title: data.title,
    content: data.content,
    authorId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export async function getProjectNoteById(id: string): Promise<ProjectNote | null> {
  const docRef = doc(db, COLLECTION, id)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  return docToProjectNote(id, docSnap.data())
}

export async function getProjectNotes(projectId: string): Promise<ProjectNote[]> {
  const q = query(
    collection(db, COLLECTION),
    where("projectId", "==", projectId)
  )
  const snapshot = await getDocs(q)

  return snapshot.docs
    .map((doc) => docToProjectNote(doc.id, doc.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function updateProjectNote(
  id: string,
  data: Partial<{ title: string; content: string }>
): Promise<void> {
  const docRef = doc(db, COLLECTION, id)
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteProjectNote(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id))
}

export async function deleteProjectNotesByProjectId(projectId: string): Promise<void> {
  const notes = await getProjectNotes(projectId)
  await Promise.all(notes.map((note) => deleteProjectNote(note.id)))
}
