/**
 * Tiny Viber — Firebase Admin Firestore (server-side only)
 *
 * Provides a shared, lazily-initialised Admin Firestore instance for
 * use in API routes, tool execution, and webhooks.
 *
 * Uses FIREBASE_SERVICE_ACCOUNT_KEY (if set) for authenticated writes
 * that bypass Firestore security rules.
 */

import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore, type Firestore } from "firebase-admin/firestore"

let adminDb: Firestore | null = null

/**
 * Returns a singleton Admin Firestore instance.
 * Safe to call multiple times — only initialises once.
 */
export function getAdminDb(): Firestore {
  if (adminDb) return adminDb

  let app
  if (getApps().length > 0) {
    app = getApps()[0]
  } else {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : undefined

    app = initializeApp(
      serviceAccount
        ? {
            credential: cert(serviceAccount),
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          }
        : { projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID }
    )
  }

  adminDb = getFirestore(app)
  return adminDb
}
