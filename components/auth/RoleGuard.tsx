"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import type { UserRole } from "@/lib/types"

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  fallbackPath?: string
}

export function RoleGuard({ children, allowedRoles, fallbackPath = "/" }: RoleGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && !allowedRoles.includes(user.role)) {
      router.push(fallbackPath)
    }
  }, [user, loading, router, allowedRoles, fallbackPath])

  if (loading) {
    return null
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}
