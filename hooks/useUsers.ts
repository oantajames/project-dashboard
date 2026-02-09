"use client"

import { useEffect, useState } from "react"
import { getUserById } from "@/lib/firebase/services/users"
import type { User } from "@/lib/types"

export function useUsers(userIds: string[] | undefined) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userIds || userIds.length === 0) {
      setUsers([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    async function fetchUsers() {
      try {
        const results = await Promise.all(
          userIds!.map((id) => getUserById(id))
        )
        if (!cancelled) {
          setUsers(results.filter((u): u is User => u !== null))
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Failed to fetch users"))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchUsers()

    return () => {
      cancelled = true
    }
  }, [JSON.stringify(userIds)])

  return { users, loading, error }
}

export function useUser(userId: string | undefined) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) {
      setUser(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    async function fetchUser() {
      try {
        const result = await getUserById(userId!)
        if (!cancelled) {
          setUser(result)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Failed to fetch user"))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchUser()

    return () => {
      cancelled = true
    }
  }, [userId])

  return { user, loading, error }
}
