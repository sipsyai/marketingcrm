import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAuth } from "@/lib/api-auth"

// POST - Reorder fields
export async function POST(request: Request) {
  const authError = await requireApiAuth("settings.leadFields")
  if (authError) return authError

  try {
    const body = await request.json()
    const { fieldIds } = body // Array of field IDs in new order

    if (!Array.isArray(fieldIds)) {
      return NextResponse.json(
        { error: "fieldIds must be an array" },
        { status: 400 }
      )
    }

    // Update sort_order for each field
    await Promise.all(
      fieldIds.map((id: number, index: number) =>
        prisma.lead_fields.update({
          where: { id: BigInt(id) },
          data: {
            sort_order: index,
            updated_at: new Date(),
          },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reordering fields:", error)
    return NextResponse.json(
      { error: "Failed to reorder fields" },
      { status: 500 }
    )
  }
}
