import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAuth } from "@/lib/api-auth"

// POST - Toggle field active status
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireApiAuth("settings.leadFields")
  if (authError) return authError

  try {
    const { id } = await params
    const field = await prisma.lead_fields.findUnique({
      where: { id: parseInt(id) },
    })

    if (!field) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 })
    }

    const updatedField = await prisma.lead_fields.update({
      where: { id: parseInt(id) },
      data: {
        is_active: !field.is_active,
        updated_at: new Date(),
      },
    })

    return NextResponse.json({
      ...updatedField,
      id: Number(updatedField.id),
    })
  } catch (error) {
    console.error("Error toggling field status:", error)
    return NextResponse.json(
      { error: "Failed to toggle field status" },
      { status: 500 }
    )
  }
}
