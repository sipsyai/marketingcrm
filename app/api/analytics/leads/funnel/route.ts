import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAuth } from "@/lib/api-auth"

// Lead funnel analysis - status distribution with conversion rates
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

    // Get total leads count
    const totalLeads = await prisma.leads.count({ where: whereClause })

    // Get leads grouped by status using groupBy instead of raw query
    const statusGroups = await prisma.leads.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        id: true,
      },
    })

    // Define status order
    const statusOrder = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']

    // Calculate funnel data and sort by status order
    const funnelData = statusGroups
      .map((group) => {
        const count = group._count.id
        const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0

        return {
          status: group.status,
          count,
          percentage: parseFloat(percentage.toFixed(2)),
        }
      })
      .sort((a, b) => {
        const aIndex = statusOrder.indexOf(a.status)
        const bIndex = statusOrder.indexOf(b.status)
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
      })

    // Calculate conversion rate (won / total)
    const wonCount = funnelData.find(item => item.status === 'won')?.count || 0
    const conversionRate = totalLeads > 0 ? (wonCount / totalLeads) * 100 : 0

    return NextResponse.json({
      success: true,
      data: {
        total: totalLeads,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        funnel: funnelData,
      },
    })
  } catch (error) {
    console.error("Lead funnel analysis error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch lead funnel data" },
      { status: 500 }
    )
  }
}
