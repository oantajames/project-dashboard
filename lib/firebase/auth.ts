import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "./config"
import type { User, UserRole, CreateUserData } from "@/lib/types"

export async function signIn(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

export async function signUp(
  email: string,
  password: string,
  userData: Omit<CreateUserData, "email">
) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const user = userCredential.user

  // Create user document in Firestore
  await setDoc(doc(db, "users", user.uid), {
    email,
    displayName: userData.displayName,
    role: userData.role,
    clientId: userData.clientId || null,
    avatarUrl: userData.avatarUrl || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return user
}

export async function signOut() {
  await firebaseSignOut(auth)
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email)
}

export async function getUserData(uid: string): Promise<User | null> {
  const docRef = doc(db, "users", uid)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  const data = docSnap.data()
  return {
    id: uid,
    email: data.email,
    displayName: data.displayName,
    role: data.role as UserRole,
    clientId: data.clientId || undefined,
    avatarUrl: data.avatarUrl || undefined,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  }
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback)
}
