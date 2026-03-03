import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { requireApiAuth } from "@/lib/api-auth"

// Update user schema
const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  role_id: z.number().nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
})

// GET /api/settings/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireApiAuth("settings.users")
  if (authError) return authError

  try {
    const { id } = await params
    const user = await prisma.users.findUnique({
      where: { id: BigInt(id) },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        tc_no: true,
        address: true,
        role_id: true,
        status: true,
        created_at: true,
        updated_at: true,
        roles: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      ...user,
      id: Number(user.id),
      role_id: user.role_id ? Number(user.role_id) : null,
      roles: user.roles ? {
        ...user.roles,
        id: Number(user.roles.id),
      } : null,
    })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    )
  }
}

// PUT /api/settings/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireApiAuth("settings.users")
  if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()
    const validated = updateUserSchema.parse(body)

    // Check if user exists
    const existing = await prisma.users.findUnique({
      where: { id: BigInt(id) },
    })

    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check email uniqueness if changing email
    if (validated.email && validated.email !== existing.email) {
      const emailExists = await prisma.users.findUnique({
        where: { email: validated.email },
      })

      if (emailExists) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        )
      }
    }

    const user = await prisma.users.update({
      where: { id: BigInt(id) },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.email && { email: validated.email }),
        ...(validated.phone !== undefined && { phone: validated.phone }),
        ...(validated.role_id !== undefined && {
          role_id: validated.role_id ? BigInt(validated.role_id) : null
        }),
        ...(validated.status && { status: validated.status }),
      },
      include: {
        roles: true,
      },
    })

    return NextResponse.json({
      ...user,
      id: Number(user.id),
      role_id: user.role_id ? Number(user.role_id) : null,
      roles: user.roles ? {
        ...user.roles,
        id: Number(user.roles.id),
      } : null,
      password: undefined, // Don't return password
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0]
      const errorMessage = firstIssue
        ? `${firstIssue.path.join(".")}: ${firstIssue.message}`
        : "Validation error"
      return NextResponse.json(
        { error: errorMessage, details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
}

// DELETE /api/settings/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireApiAuth("settings.users")
  if (authError) return authError

  try {
    const { id } = await params
    // Check if user exists
    const existing = await prisma.users.findUnique({
      where: { id: BigInt(id) },
    })

    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent deleting admin user
    if (existing.email === "admin@example.com") {
      return NextResponse.json(
        { error: "Cannot delete admin user" },
        { status: 403 }
      )
    }

    await prisma.users.delete({
      where: { id: BigInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    )
  }
}
