import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAuth } from "@/lib/api-auth"

// Lead source performance analysis
export async function GET(request: NextRequest) {
  const authError = await requireApiAuth("leads")
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

    // Get leads grouped by source
    const sourceGroups = await prisma.leads.groupBy({
      by: ['source'],
      where: whereClause,
      _count: {
        id: true,
      },
    })

    // For each source, calculate conversion rate
    const sourcePerformance = await Promise.all(
      sourceGroups.map(async (group) => {
        const totalCount = group._count.id

        // Count won leads for this source
        const wonCount = await prisma.leads.count({
          where: {
            ...whereClause,
            source: group.source,
            status: 'won',
          },
        })

        const conversionRate = totalCount > 0 ? (wonCount / totalCount) * 100 : 0

        return {
          source: group.source,
          totalLeads: totalCount,
          wonLeads: wonCount,
          conversionRate: parseFloat(conversionRate.toFixed(2)),
        }
      })
    )

    // Sort by total leads descending
    sourcePerformance.sort((a, b) => b.totalLeads - a.totalLeads)

    return NextResponse.json({
      success: true,
      data: sourcePerformance,
    })
  } catch (error) {
    console.error("Lead source performance error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch source performance data" },
      { status: 500 }
    )
  }
}
