import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAuth } from "@/lib/api-auth"

// Investor pipeline analysis - status distribution
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

    // Get total investors count
    const totalInvestors = await prisma.investors.count({ where: whereClause })

    // Get investors grouped by status
    const statusGroups = await prisma.investors.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        id: true,
      },
    })

    // Calculate pipeline data
    const pipelineData = statusGroups.map((group) => {
      const count = group._count.id
      const percentage = totalInvestors > 0 ? (count / totalInvestors) * 100 : 0

      return {
        status: group.status,
        count,
        percentage: parseFloat(percentage.toFixed(2)),
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        total: totalInvestors,
        pipeline: pipelineData,
      },
    })
  } catch (error) {
    console.error("Investor pipeline analysis error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch investor pipeline data" },
      { status: 500 }
    )
  }
}
