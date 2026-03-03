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

// Create role schema
const createRoleSchema = z.object({
  name: z.string()
    .min(1, "Role name is required")
    .max(255, "Role name must be less than 255 characters"),
  slug: z.string()
    .min(1, "Slug is required")
    .max(255, "Slug must be less than 255 characters"),
  description: z.string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  permissions: permissionSchema,
  status: z.enum(["active", "inactive"]).default("active"),
})

// GET /api/settings/roles - List all roles
export async function GET() {
  const authError = await requireApiAuth("settings.roles")
  if (authError) return authError

  try {
    const roles = await prisma.roles.findMany({
      orderBy: { created_at: "desc" },
      include: {
        _count: {
          select: { users: true },
        },
      },
    })

    // Serialize BigInt to Number
    const serialized = roles.map((role) => ({
      ...role,
      id: Number(role.id),
      userCount: role._count.users,
    }))

    return NextResponse.json(serialized)
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    )
  }
}

// POST /api/settings/roles - Create new role
export async function POST(request: NextRequest) {
  const authError = await requireApiAuth("settings.roles")
  if (authError) return authError

  try {
    const body = await request.json()
    const validated = createRoleSchema.parse(body)

    // Check if name already exists
    const existingByName = await prisma.roles.findFirst({
      where: { name: validated.name },
    })

    if (existingByName) {
      return NextResponse.json(
        { error: "A role with this name already exists" },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingBySlug = await prisma.roles.findUnique({
      where: { slug: validated.slug },
    })

    if (existingBySlug) {
      return NextResponse.json(
        { error: "A role with this slug already exists" },
        { status: 400 }
      )
    }

    const role = await prisma.roles.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        description: validated.description,
        permissions: validated.permissions as any,
        status: validated.status,
        is_system: false,
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

    console.error("Error creating role:", error)
    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 }
    )
  }
}
