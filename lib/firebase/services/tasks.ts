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
  writeBatch,
} from "firebase/firestore"
import { db } from "../config"
import type { Task, Workstream, CreateTaskData, CreateWorkstreamData, TaskStatus, ProjectPriority } from "@/lib/types"

const TASKS_COLLECTION = "tasks"
const WORKSTREAMS_COLLECTION = "workstreams"

function generateId(): string {
  return doc(collection(db, TASKS_COLLECTION)).id
}

function docToTask(id: string, data: Record<string, unknown>): Task {
  return {
    id,
    projectId: data.projectId as string,
    name: data.name as string,
    description: (data.description as string) || undefined,
    status: (data.status as TaskStatus) || "todo",
    assigneeId: (data.assigneeId as string) || undefined,
    dueDate: (data.dueDate as { toDate: () => Date })?.toDate() || undefined,
    priority: (data.priority as ProjectPriority) || undefined,
    order: (data.order as number) || 0,
    workstreamId: (data.workstreamId as string) || undefined,
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate() || new Date(),
    updatedAt: (data.updatedAt as { toDate: () => Date })?.toDate() || new Date(),
  }
}

function docToWorkstream(id: string, data: Record<string, unknown>): Workstream {
  return {
    id,
    projectId: data.projectId as string,
    name: data.name as string,
    order: (data.order as number) || 0,
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate() || new Date(),
    updatedAt: (data.updatedAt as { toDate: () => Date })?.toDate() || new Date(),
  }
}

// Task CRUD
export async function createTask(data: CreateTaskData): Promise<Task> {
  const id = generateId()

  // Get max order for the project/workstream
  const q = data.workstreamId
    ? query(
        collection(db, TASKS_COLLECTION),
        where("projectId", "==", data.projectId),
        where("workstreamId", "==", data.workstreamId)
      )
    : query(collection(db, TASKS_COLLECTION), where("projectId", "==", data.projectId))

  const snapshot = await getDocs(q)
  const maxOrder = snapshot.docs.reduce((max, doc) => {
    const order = doc.data().order || 0
    return order > max ? order : max
  }, 0)

  const taskData = {
    projectId: data.projectId,
    name: data.name,
    description: data.description || null,
    status: data.status || "todo",
    assigneeId: data.assigneeId || null,
    dueDate: data.dueDate || null,
    priority: data.priority || null,
    order: maxOrder + 1,
    workstreamId: data.workstreamId || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(doc(db, TASKS_COLLECTION, id), taskData)

  return {
    id,
    projectId: data.projectId,
    name: data.name,
    description: data.description,
    status: data.status || "todo",
    assigneeId: data.assigneeId,
    dueDate: data.dueDate,
    priority: data.priority,
    order: maxOrder + 1,
    workstreamId: data.workstreamId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export async function getTaskById(id: string): Promise<Task | null> {
  const docRef = doc(db, TASKS_COLLECTION, id)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  return docToTask(id, docSnap.data())
}

export async function getTasksByProjectId(projectId: string): Promise<Task[]> {
  const q = query(
    collection(db, TASKS_COLLECTION),
    where("projectId", "==", projectId)
  )
  const snapshot = await getDocs(q)

  return snapshot.docs
    .map((doc) => docToTask(doc.id, doc.data()))
    .sort((a, b) => a.order - b.order)
}

export async function getTasksByWorkstreamId(workstreamId: string): Promise<Task[]> {
  const q = query(
    collection(db, TASKS_COLLECTION),
    where("workstreamId", "==", workstreamId)
  )
  const snapshot = await getDocs(q)

  return snapshot.docs
    .map((doc) => docToTask(doc.id, doc.data()))
    .sort((a, b) => a.order - b.order)
}

export async function updateTask(
  id: string,
  data: Partial<CreateTaskData & { order: number }>
): Promise<void> {
  const docRef = doc(db, TASKS_COLLECTION, id)
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function updateTasksOrder(
  tasks: { id: string; order: number; workstreamId?: string }[]
): Promise<void> {
  const batch = writeBatch(db)

  tasks.forEach(({ id, order, workstreamId }) => {
    const docRef = doc(db, TASKS_COLLECTION, id)
    batch.update(docRef, {
      order,
      workstreamId: workstreamId || null,
      updatedAt: serverTimestamp(),
    })
  })

  await batch.commit()
}

export async function deleteTask(id: string): Promise<void> {
  await deleteDoc(doc(db, TASKS_COLLECTION, id))
}

// Workstream CRUD
export async function createWorkstream(data: CreateWorkstreamData): Promise<Workstream> {
  const id = generateId()

  // Get max order for the project
  const q = query(
    collection(db, WORKSTREAMS_COLLECTION),
    where("projectId", "==", data.projectId)
  )
  const snapshot = await getDocs(q)
  const maxOrder = snapshot.docs.reduce((max, doc) => {
    const order = doc.data().order || 0
    return order > max ? order : max
  }, 0)

  const workstreamData = {
    projectId: data.projectId,
    name: data.name,
    order: maxOrder + 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(doc(db, WORKSTREAMS_COLLECTION, id), workstreamData)

  return {
    id,
    projectId: data.projectId,
    name: data.name,
    order: maxOrder + 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export async function getWorkstreamsByProjectId(projectId: string): Promise<Workstream[]> {
  const q = query(
    collection(db, WORKSTREAMS_COLLECTION),
    where("projectId", "==", projectId)
  )
  const snapshot = await getDocs(q)

  return snapshot.docs
    .map((doc) => docToWorkstream(doc.id, doc.data()))
    .sort((a, b) => a.order - b.order)
}

export async function updateWorkstream(
  id: string,
  data: Partial<CreateWorkstreamData & { order: number }>
): Promise<void> {
  const docRef = doc(db, WORKSTREAMS_COLLECTION, id)
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteWorkstream(id: string): Promise<void> {
  await deleteDoc(doc(db, WORKSTREAMS_COLLECTION, id))
}
