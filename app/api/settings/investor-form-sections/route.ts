import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAuth } from "@/lib/api-auth"

export async function GET() {
  const authError = await requireApiAuth("settings.investorFields")
  if (authError) return authError

  try {
    const sections = await prisma.investor_form_sections.findMany({
      orderBy: {
        sort_order: "asc",
      },
    })

    // Convert BigInt to number for JSON serialization
    const serializedSections = sections.map((section) => ({
      ...section,
      id: Number(section.id),
    }))

    return NextResponse.json(serializedSections)
  } catch (error) {
    console.error("Error fetching investor form sections:", error)
    return NextResponse.json(
      { error: "Failed to fetch investor form sections" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const authError = await requireApiAuth("settings.investorFields")
  if (authError) return authError

  try {
    const sections = await request.json()

    // Update all sections
    for (const section of sections) {
      await prisma.investor_form_sections.update({
        where: { id: BigInt(section.id) },
        data: {
          is_visible: section.is_visible,
          is_default_open: section.is_default_open,
          sort_order: section.sort_order,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating investor form sections:", error)
    return NextResponse.json(
      { error: "Failed to update investor form sections" },
      { status: 500 }
    )
  }
}
