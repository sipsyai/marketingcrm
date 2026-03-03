import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAuth } from "@/lib/api-auth"

export async function GET() {
  const authError = await requireApiAuth("settings.activityTypes")
  if (authError) return authError

  try {
    const activityTypes = await prisma.activity_types.findMany({
      orderBy: { sort_order: "asc" },
    })

    // Serialize BigInt
    const serialized = activityTypes.map(type => ({
      ...type,
      id: Number(type.id),
    }))

    return NextResponse.json(serialized)
  } catch (error: any) {
    console.error("Error fetching activity types:", error)
    return NextResponse.json(
      { error: "Failed to fetch activity types" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireApiAuth("settings.activityTypes")
  if (authError) return authError

  try {
    const body = await request.json()
    const { name, label, icon, color, is_active, sort_order } = body

    const activityType = await prisma.activity_types.create({
      data: {
        name,
        label,
        icon,
        color,
        is_active: is_active ?? true,
        sort_order: sort_order ?? 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
    })

    return NextResponse.json({
      ...activityType,
      id: Number(activityType.id),
    })
  } catch (error: any) {
    console.error("Error creating activity type:", error)
    return NextResponse.json(
      { error: "Failed to create activity type" },
      { status: 500 }
    )
  }
}
