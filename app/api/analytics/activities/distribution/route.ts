import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAuth } from "@/lib/api-auth"

// Activity type distribution
export async function GET(request: NextRequest) {
  const authError = await requireApiAuth("activities")
  if (authError) return authError

  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Build date filter
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate)
    }

    const whereClause = Object.keys(dateFilter).length > 0
      ? { created_at: dateFilter }
      : {}

    // Get activities grouped by type
    const typeGroups = await prisma.activities.groupBy({
      by: ['type'],
      where: whereClause,
      _count: {
        id: true,
      },
    })

    const total = typeGroups.reduce((sum, group) => sum + group._count.id, 0)

    const typeData = typeGroups.map((group) => {
      const count = group._count.id
      const percentage = total > 0 ? (count / total) * 100 : 0

      return {
        type: group.type,
        count,
        percentage: parseFloat(percentage.toFixed(2)),
      }
    })

    // Sort by count descending
    typeData.sort((a, b) => b.count - a.count)

    return NextResponse.json({
      success: true,
      data: typeData,
    })
  } catch (error) {
    console.error("Activity distribution error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch activity distribution data" },
      { status: 500 }
    )
  }
}
