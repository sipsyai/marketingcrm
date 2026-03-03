import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { requireApiAuth } from "@/lib/api-auth"

// Permission schema
const permissionSchema = z.object({
  menus: z.object({
    dashboard: z.boolean(),
    leads: z.boolean(),
    investors: z.boolean(),
    tasks: z.boolean(),
    activities: z.boolean(),
    reports: z.boolean(),
    settings: z.object({
      leadFields: z.boolean(),
      investorFields: z.boolean(),
      activityTypes: z.boolean(),
      users: z.boolean(),
      roles: z.boolean(),
    }),
  }),
  dataAccess: z.object({
    leads: z.enum(["all", "assigned"]),
    investors: z.enum(["all", "assigned"]),
    activities: z.enum(["all", "assigned"]),
  }),
})

// Update role schema
const updateRoleSchema = z.object({
  name: z.string().min(1, "Role name is required").optional(),
  description: z.string().optional(),
  permissions: permissionSchema.optional(),
  status: z.enum(["active", "inactive"]).optional(),
})

// GET /api/settings/roles/[id] - Get single role
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireApiAuth("settings.roles")
  if (authError) return authError

  try {
    const { id } = await params
    const role = await prisma.roles.findUnique({
      where: { id: BigInt(id) },
      include: {
        _count: {
          select: { users: true },
        },
      },
    })

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    return NextResponse.json({
      ...role,
      id: Number(role.id),
      userCount: role._count.users,
    })
  } catch (error) {
    console.error("Error fetching role:", error)
    return NextResponse.json(
      { error: "Failed to fetch role" },
      { status: 500 }
    )
  }
}

// PUT /api/settings/roles/[id] - Update role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireApiAuth("settings.roles")
  if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()
    const validated = updateRoleSchema.parse(body)

    // Check if role exists
    const existing = await prisma.roles.findUnique({
      where: { id: BigInt(id) },
    })

    if (!existing) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    // Prevent editing system roles
    if (existing.is_system) {
      return NextResponse.json(
        { error: "Cannot modify system role" },
        { status: 403 }
      )
    }

    const role = await prisma.roles.update({
      where: { id: BigInt(id) },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.permissions && { permissions: validated.permissions as any }),
        ...(validated.status && { status: validated.status }),
      },
    })

    return NextResponse.json({
      ...role,
      id: Number(role.id),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating role:", error)
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    )
  }
}

// DELETE /api/settings/roles/[id] - Delete role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireApiAuth("settings.roles")
  if (authError) return authError

  try {
    const { id } = await params
    // Check if role exists
    const existing = await prisma.roles.findUnique({
      where: { id: BigInt(id) },
      include: {
        _count: {
          select: { users: true },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    // Prevent deleting system roles
    if (existing.is_system) {
      return NextResponse.json(
        { error: "Cannot delete system role" },
        { status: 403 }
      )
    }

    // Prevent deleting if users are assigned
    if (existing._count.users > 0) {
      return NextResponse.json(
        { error: `Cannot delete role. ${existing._count.users} user(s) are assigned to this role.` },
        { status: 400 }
      )
    }

    await prisma.roles.delete({
      where: { id: BigInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting role:", error)
    return NextResponse.json(
      { error: "Failed to delete role" },
      { status: 500 }
    )
  }
}
