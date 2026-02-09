"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { User as FirebaseUser } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { signIn, signUp, signOut, resetPassword, getUserData, onAuthChange } from "@/lib/firebase/auth"
import type { User, UserRole } from "@/lib/types"

interface AuthContextType {
  firebaseUser: FirebaseUser | null
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string, role?: UserRole, clientId?: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (fbUser) => {
      setFirebaseUser(fbUser)

      if (fbUser) {
        try {
          let userData = await getUserData(fbUser.uid)

          // If user document doesn't exist, create it (for users who signed up before Firestore was set up)
          if (!userData) {
            const newUserData = {
              email: fbUser.email || "",
              displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
              role: "owner" as UserRole,
              clientId: null,
              avatarUrl: fbUser.photoURL || null,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }

            await setDoc(doc(db, "users", fbUser.uid), newUserData)

            userData = {
              id: fbUser.uid,
              email: newUserData.email,
              displayName: newUserData.displayName,
              role: "owner",
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          }

          setUser(userData)
        } catch (error) {
          console.error("Error fetching/creating user data:", error)
          // Still set a basic user object so the app doesn't redirect to login
          setUser({
            id: fbUser.uid,
            email: fbUser.email || "",
            displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
            role: "owner",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        }
      } else {
        setUser(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleSignIn = useCallback(async (email: string, password: string) => {
    await signIn(email, password)
  }, [])

  const handleSignUp = useCallback(async (
    email: string,
    password: string,
    displayName: string,
    role: UserRole = "owner",
    clientId?: string
  ) => {
    await signUp(email, password, { displayName, role, clientId })
  }, [])

  const handleSignOut = useCallback(async () => {
    await signOut()
    setUser(null)
    setFirebaseUser(null)
  }, [])

  const handleResetPassword = useCallback(async (email: string) => {
    await resetPassword(email)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        loading,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
        resetPassword: handleResetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
