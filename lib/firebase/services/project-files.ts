import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../config"
import type { ProjectFile, ProjectFileType, CreateProjectFileData } from "@/lib/types"

const COLLECTION = "project_files"

function generateId(): string {
  return doc(collection(db, COLLECTION)).id
}

function docToProjectFile(id: string, data: Record<string, unknown>): ProjectFile {
  return {
    id,
    projectId: data.projectId as string,
    name: data.name as string,
    type: (data.type as ProjectFileType) || "file",
    url: data.url as string,
    sizeMB: (data.sizeMB as number) || 0,
    uploadedBy: data.uploadedBy as string,
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate() || new Date(),
    updatedAt: (data.updatedAt as { toDate: () => Date })?.toDate() || new Date(),
  }
}

export async function createProjectFile(
  data: CreateProjectFileData,
  uploadedBy: string
): Promise<ProjectFile> {
  const id = generateId()

  const fileData = {
    projectId: data.projectId,
    name: data.name,
    type: data.type,
    url: data.url,
    sizeMB: data.sizeMB,
    uploadedBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(doc(db, COLLECTION, id), fileData)

  return {
    id,
    projectId: data.projectId,
    name: data.name,
    type: data.type,
    url: data.url,
    sizeMB: data.sizeMB,
    uploadedBy,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export async function getProjectFileById(id: string): Promise<ProjectFile | null> {
  const docRef = doc(db, COLLECTION, id)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  return docToProjectFile(id, docSnap.data())
}

export async function getProjectFiles(projectId: string): Promise<ProjectFile[]> {
  const q = query(
    collection(db, COLLECTION),
    where("projectId", "==", projectId)
  )
  const snapshot = await getDocs(q)

  return snapshot.docs
    .map((doc) => docToProjectFile(doc.id, doc.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function deleteProjectFile(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id))
}

export async function deleteProjectFilesByProjectId(projectId: string): Promise<void> {
  const files = await getProjectFiles(projectId)
  await Promise.all(files.map((file) => deleteProjectFile(file.id)))
}
