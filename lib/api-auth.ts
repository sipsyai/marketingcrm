import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-config"
import { checkMenuPermission } from "@/lib/permissions"

/**
 * Check API route authentication and authorization.
 * Returns null if authorized, or a NextResponse error if not.
 */
export async function requireApiAuth(requiredPermission?: string) {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (requiredPermission) {
    const hasPermission = checkMenuPermission(
      session.user?.permissions,
      requiredPermission
    )

    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  return null
}
