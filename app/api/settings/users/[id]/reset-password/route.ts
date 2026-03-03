import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { requireApiAuth } from "@/lib/api-auth"

// Reset password schema
const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
})

// POST /api/settings/users/[id]/reset-password - Reset user password
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireApiAuth("settings.users")
  if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()
    const validated = resetPasswordSchema.parse(body)

    // Check if user exists
    const existing = await prisma.users.findUnique({
      where: { id: BigInt(id) },
    })

    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Hash password with bcrypt (use $2a$ format)
    const hashedPassword = await bcrypt.hash(validated.password, 10)
    // Convert to $2y$ for Laravel compatibility
    const laravelPassword = hashedPassword.replace(/^\$2a\$/, "$2y$")

    await prisma.users.update({
      where: { id: BigInt(id) },
      data: {
        password: laravelPassword,
      },
    })

    return NextResponse.json({ success: true, message: "Password reset successfully" })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error resetting password:", error)
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    )
  }
}
