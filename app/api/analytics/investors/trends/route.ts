import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { subDays, startOfDay, format } from "date-fns"
import { requireApiAuth } from "@/lib/api-auth"

// Investor daily/monthly trends
export async function GET(request: NextRequest) {
  const authError = await requireApiAuth("investors")
  if (authError) return authError

  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get("days") || "30")

    const startDate = startOfDay(subDays(new Date(), days))

    // Get investors created per day
    const investorsPerDay = await prisma.$queryRaw<Array<{
      date: Date
      count: bigint
    }>>`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count
      FROM investors
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    // Transform to chart-friendly format
    const trendsData = investorsPerDay.map((item) => ({
      date: format(new Date(item.date), "yyyy-MM-dd"),
      count: Number(item.count),
    }))

    return NextResponse.json({
      success: true,
      data: trendsData,
    })
  } catch (error) {
    console.error("Investor trends analysis error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch trends data" },
      { status: 500 }
    )
  }
}
