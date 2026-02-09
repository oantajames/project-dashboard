/**
 * AI Coder — Server-side Auth Verification
 *
 * Verifies Firebase ID tokens in API routes and checks the user has the "owner" role.
 * Uses Firebase Admin SDK for secure server-side token verification.
 */

import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"

// ── Firebase Admin Initialization ──

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0]
  }

  // Use service account credentials if available, otherwise use default credentials
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined

  return initializeApp(
    serviceAccount
      ? {
          credential: cert(serviceAccount),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        }
      : {
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        }
  )
}

// ── Auth Verification ──

export interface VerifiedUser {
  uid: string
  email: string
  displayName: string
  role: string
}

/**
 * Verifies a Firebase ID token from the Authorization header and checks
 * that the user has the "owner" role in Firestore.
 *
 * @param request - The incoming request with Authorization: Bearer <token>
 * @returns The verified user, or null if auth fails
 */
export async function verifyAdminUser(request: Request): Promise<VerifiedUser | null> {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[ai-coder/auth] No Bearer token in Authorization header")
      return null
    }

    const idToken = authHeader.split("Bearer ")[1]
    if (!idToken) {
      console.error("[ai-coder/auth] Empty token after Bearer prefix")
      return null
    }

    const app = getAdminApp()
    const auth = getAuth(app)
    const db = getFirestore(app)

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken)
    console.log("[ai-coder/auth] Token verified for uid:", decodedToken.uid)

    // Fetch user data from Firestore to check role
    const userDoc = await db.collection("users").doc(decodedToken.uid).get()
    if (!userDoc.exists) {
      console.error("[ai-coder/auth] No user document found at users/" + decodedToken.uid)
      return null
    }

    const userData = userDoc.data()
    console.log("[ai-coder/auth] User data:", JSON.stringify({ role: userData?.role, email: userData?.email }))

    if (!userData || userData.role !== "owner") {
      console.error("[ai-coder/auth] User role is not 'owner', got:", userData?.role)
      return null
    }

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || userData.email || "",
      displayName: userData.displayName || decodedToken.name || "User",
      role: userData.role,
    }
  } catch (error) {
    console.error("[ai-coder/auth] Auth verification failed:", error)
    return null
  }
}
