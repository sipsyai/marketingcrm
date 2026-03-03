"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"

export function UnauthorizedToast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams.get("error")

  useEffect(() => {
    if (error === "unauthorized") {
      toast.error("You don't have permission to access that page")
      // Clean up the URL
      router.replace("/dashboard")
    }
  }, [error, router])

  return null
}
