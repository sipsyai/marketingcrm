import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { subDays, startOfDay, format } from "date-fns"
import { requireApiAuth } from "@/lib/api-auth"

// Activity timeline - daily activity count with status breakdown
export async function GET(request: NextRequest) {
  const authError = await requireApiAuth("activities")
  if (authError) return authError

  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get("days") || "30")

    const startDate = startOfDay(subDays(new Date(), days))

    // Get activities per day with status breakdown
    const activitiesPerDay = await prisma.$queryRaw<Array<{
      date: Date
      status: string
      count: bigint
    }>>`
      SELECT
        DATE(created_at) as date,
        status,
        COUNT(*) as count
      FROM activities
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at), status
      ORDER BY date ASC
    `

    // Transform to chart-friendly format
    const dateMap = new Map<string, any>()

    activitiesPerDay.forEach((item) => {
      const dateKey = format(new Date(item.date), "yyyy-MM-dd")

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          date: dateKey,
          total: 0,
        })
      }

      const dayData = dateMap.get(dateKey)
      dayData[item.status] = Number(item.count)
      dayData.total += Number(item.count)
    })

    const timelineData = Array.from(dateMap.values())

    return NextResponse.json({
      success: true,
      data: timelineData,
    })
  } catch (error) {
    console.error("Activity timeline error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch timeline data" },
      { status: 500 }
    )
  }
}
