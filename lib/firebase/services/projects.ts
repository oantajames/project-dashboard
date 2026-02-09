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
import type { Project, CreateProjectData, ProjectStatus, ProjectPriority, ProjectScope, ProjectKeyFeatures, ProjectIntake } from "@/lib/types"

const COLLECTION = "projects"

function generateId(): string {
  return doc(collection(db, COLLECTION)).id
}

function docToProject(id: string, data: Record<string, unknown>): Project {
  return {
    id,
    name: data.name as string,
    clientId: data.clientId as string,
    description: (data.description as string) || undefined,
    status: (data.status as ProjectStatus) || "backlog",
    priority: (data.priority as ProjectPriority) || "medium",
    startDate: (data.startDate as { toDate: () => Date })?.toDate() || undefined,
    endDate: (data.endDate as { toDate: () => Date })?.toDate() || undefined,
    progress: (data.progress as number) || 0,
    tags: (data.tags as string[]) || [],
    ownerId: data.ownerId as string,
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate() || new Date(),
    updatedAt: (data.updatedAt as { toDate: () => Date })?.toDate() || new Date(),

    // Team assignments
    picUserIds: (data.picUserIds as string[]) || [],
    supportUserIds: (data.supportUserIds as string[]) || [],

    // Project metadata
    group: (data.group as string) || undefined,
    typeLabel: (data.typeLabel as string) || undefined,
    estimateHours: (data.estimateHours as number) || undefined,
    location: (data.location as string) || undefined,

    // Overview content
    scope: (data.scope as ProjectScope) || undefined,
    outcomes: (data.outcomes as string[]) || undefined,
    keyFeatures: (data.keyFeatures as ProjectKeyFeatures) || undefined,

    // Intake questionnaire
    intake: (data.intake as ProjectIntake) || undefined,
  }
}

export async function createProject(
  data: CreateProjectData,
  ownerId: string
): Promise<Project> {
  const id = generateId()

  const projectData = {
    name: data.name,
    clientId: data.clientId,
    description: data.description || null,
    status: data.status || "backlog",
    priority: data.priority || "medium",
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    progress: 0,
    tags: data.tags || [],
    ownerId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),

    // Team assignments
    picUserIds: data.picUserIds || [],
    supportUserIds: data.supportUserIds || [],

    // Project metadata
    group: data.group || null,
    typeLabel: data.typeLabel || null,
    estimateHours: data.estimateHours || null,
    location: data.location || null,

    // Overview content
    scope: data.scope || null,
    outcomes: data.outcomes || null,
    keyFeatures: data.keyFeatures || null,

    // Intake questionnaire
    intake: data.intake || null,
  }

  await setDoc(doc(db, COLLECTION, id), projectData)

  return {
    id,
    name: data.name,
    clientId: data.clientId,
    description: data.description,
    status: data.status || "backlog",
    priority: data.priority || "medium",
    startDate: data.startDate,
    endDate: data.endDate,
    progress: 0,
    tags: data.tags || [],
    ownerId,
    createdAt: new Date(),
    updatedAt: new Date(),

    // Team assignments
    picUserIds: data.picUserIds || [],
    supportUserIds: data.supportUserIds || [],

    // Project metadata
    group: data.group,
    typeLabel: data.typeLabel,
    estimateHours: data.estimateHours,
    location: data.location,

    // Overview content
    scope: data.scope,
    outcomes: data.outcomes,
    keyFeatures: data.keyFeatures,

    // Intake questionnaire
    intake: data.intake,
  }
}

export async function getProjectById(id: string): Promise<Project | null> {
  const docRef = doc(db, COLLECTION, id)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  return docToProject(id, docSnap.data())
}

export async function getProjects(ownerId: string): Promise<Project[]> {
  const q = query(
    collection(db, COLLECTION),
    where("ownerId", "==", ownerId)
  )
  const snapshot = await getDocs(q)

  return snapshot.docs
    .map((doc) => docToProject(doc.id, doc.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function getProjectsByClientId(clientId: string): Promise<Project[]> {
  const q = query(
    collection(db, COLLECTION),
    where("clientId", "==", clientId)
  )
  const snapshot = await getDocs(q)

  return snapshot.docs
    .map((doc) => docToProject(doc.id, doc.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function updateProject(
  id: string,
  data: Partial<CreateProjectData & { progress: number }>
): Promise<void> {
  const docRef = doc(db, COLLECTION, id)

  // Convert undefined values to null (Firestore doesn't accept undefined)
  const sanitizedData: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    sanitizedData[key] = value === undefined ? null : value
  }

  await updateDoc(docRef, {
    ...sanitizedData,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteProject(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id))
}
