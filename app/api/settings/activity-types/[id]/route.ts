import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAuth } from "@/lib/api-auth"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireApiAuth("settings.activityTypes")
  if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()
    const { name, label, icon, color, is_active, sort_order } = body

    const activityType = await prisma.activity_types.update({
      where: { id: BigInt(id) },
      data: {
        name,
        label,
        icon,
        color,
        is_active,
        sort_order,
        updated_at: new Date(),
      },
    })

    return NextResponse.json({
      ...activityType,
      id: Number(activityType.id),
    })
  } catch (error: any) {
    console.error("Error updating activity type:", error)
    return NextResponse.json(
      { error: "Failed to update activity type" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireApiAuth("settings.activityTypes")
  if (authError) return authError

  try {
    const { id } = await params

    await prisma.activity_types.delete({
      where: { id: BigInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting activity type:", error)
    return NextResponse.json(
      { error: "Failed to delete activity type" },
      { status: 500 }
    )
  }
}
