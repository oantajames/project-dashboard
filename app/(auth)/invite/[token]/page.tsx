"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import type { ClientInvite } from "@/lib/types"

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [invite, setInvite] = useState<ClientInvite | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  const { signUp } = useAuth()

  useEffect(() => {
    async function fetchInvite() {
      try {
        // Query invites collection for matching token
        const { collection, query, where, getDocs } = await import("firebase/firestore")
        const invitesRef = collection(db, "invites")
        const q = query(invitesRef, where("token", "==", token))
        const snapshot = await getDocs(q)

        if (snapshot.empty) {
          setError("Invalid invitation link")
          setLoading(false)
          return
        }

        const inviteDoc = snapshot.docs[0]
        const data = inviteDoc.data()
        const inviteData: ClientInvite = {
          id: inviteDoc.id,
          clientId: data.clientId,
          email: data.email,
          token: data.token,
          status: data.status,
          expiresAt: data.expiresAt?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          acceptedAt: data.acceptedAt?.toDate(),
          ownerId: data.ownerId,
        }

        if (inviteData.status === "accepted") {
          setError("This invitation has already been used")
          setLoading(false)
          return
        }

        if (inviteData.status === "expired" || new Date() > inviteData.expiresAt) {
          setError("This invitation has expired")
          setLoading(false)
          return
        }

        setInvite(inviteData)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching invite:", err)
        setError("Failed to load invitation")
        setLoading(false)
      }
    }

    fetchInvite()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    if (!invite) return

    setSubmitting(true)

    try {
      // Create user account with client role
      await signUp(invite.email, password, displayName, "client", invite.clientId)

      // Mark invite as accepted
      const inviteRef = doc(db, "invites", invite.id)
      await updateDoc(inviteRef, {
        status: "accepted",
        acceptedAt: serverTimestamp(),
      })

      toast.success("Account created successfully!")
      router.push("/portal")
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create account"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Invalid Invitation</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              Go to sign in
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Accept Invitation</CardTitle>
        <CardDescription>
          Create your account to access the client portal
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={invite?.email || ""}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Your Name</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Creating account..." : "Create account"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
