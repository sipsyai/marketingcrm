import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { subDays, subMonths } from "date-fns"
import { requireApiAuth } from "@/lib/api-auth"

// Lead KPIs calculation
export async function GET(request: NextRequest) {
  const authError = await requireApiAuth("leads")
  if (authError) return authError

  try {
    const now = new Date()
    const lastMonth = subMonths(now, 1)
    const lastWeek = subDays(now, 7)

    // Total leads
    const totalLeads = await prisma.leads.count()

    // Leads this month
    const leadsThisMonth = await prisma.leads.count({
      where: {
        created_at: {
          gte: subMonths(now, 1),
        },
      },
    })

    // Leads last month
    const leadsLastMonth = await prisma.leads.count({
      where: {
        created_at: {
          gte: subMonths(now, 2),
          lt: lastMonth,
        },
      },
    })

    // Calculate month-over-month growth
    const monthGrowth = leadsLastMonth > 0
      ? ((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100
      : leadsThisMonth > 0 ? 100 : 0

    // Hot leads (qualified + proposal + negotiation)
    const hotLeads = await prisma.leads.count({
      where: {
        status: {
          in: ['qualified', 'proposal', 'negotiation'],
        },
      },
    })

    // Conversion rate (won / total)
    const wonLeads = await prisma.leads.count({
      where: { status: 'won' },
    })
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0

    // Average response time (time from created to first contact)
    // For now, we'll use time to first activity as proxy
    const leadsWithActivities = await prisma.leads.findMany({
      where: {
        activities: {
          some: {},
        },
      },
      select: {
        created_at: true,
        activities: {
          orderBy: { created_at: 'asc' },
          take: 1,
          select: {
            created_at: true,
          },
        },
      },
    })

    let totalResponseTime = 0
    let responseTimeCount = 0

    leadsWithActivities.forEach((lead) => {
      if (lead.created_at && lead.activities[0]?.created_at) {
        const diff = lead.activities[0].created_at.getTime() - lead.created_at.getTime()
        totalResponseTime += diff
        responseTimeCount++
      }
    })

    const avgResponseTimeMs = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0
    const avgResponseTimeHours = avgResponseTimeMs / (1000 * 60 * 60)

    return NextResponse.json({
      success: true,
      data: {
        totalLeads,
        leadsThisMonth,
        monthGrowth: parseFloat(monthGrowth.toFixed(2)),
        hotLeads,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        avgResponseTime: {
          hours: parseFloat(avgResponseTimeHours.toFixed(1)),
          formatted: avgResponseTimeHours < 24
            ? `${avgResponseTimeHours.toFixed(1)}h`
            : `${(avgResponseTimeHours / 24).toFixed(1)}d`,
        },
      },
    })
  } catch (error) {
    console.error("Lead KPIs calculation error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to calculate lead KPIs" },
      { status: 500 }
    )
  }
}
