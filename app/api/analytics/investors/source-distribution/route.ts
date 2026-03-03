import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAuth } from "@/lib/api-auth"

// Investor source distribution
export async function GET(request: NextRequest) {
  const authError = await requireApiAuth("investors")
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

    // Get investors grouped by source
    const sourceGroups = await prisma.investors.groupBy({
      by: ['source'],
      where: whereClause,
      _count: {
        id: true,
      },
    })

    const total = sourceGroups.reduce((sum, group) => sum + group._count.id, 0)

    const sourceData = sourceGroups.map((group) => {
      const count = group._count.id
      const percentage = total > 0 ? (count / total) * 100 : 0

      return {
        source: group.source || 'unknown',
        count,
        percentage: parseFloat(percentage.toFixed(2)),
      }
    })

    // Sort by count descending
    sourceData.sort((a, b) => b.count - a.count)

    return NextResponse.json({
      success: true,
      data: sourceData,
    })
  } catch (error) {
    console.error("Investor source distribution error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch source distribution data" },
      { status: 500 }
    )
  }
}
