import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAuth } from "@/lib/api-auth"

// User performance - activities created and completed
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

    // Get all active users
    const users = await prisma.users.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        name: true,
      },
    })

    // For each user, calculate activities created and completed
    const userPerformance = await Promise.all(
      users.map(async (user) => {
        // Activities created by user
        const created = await prisma.activities.count({
          where: {
            ...whereClause,
            user_id: user.id,
          },
        })

        // Activities assigned to user
        const assigned = await prisma.activities.count({
          where: {
            ...whereClause,
            assigned_to: user.id,
          },
        })

        // Activities completed by user
        const completed = await prisma.activities.count({
          where: {
            ...whereClause,
            assigned_to: user.id,
            status: 'completed',
          },
        })

        // Completion rate
        const completionRate = assigned > 0 ? (completed / assigned) * 100 : 0

        return {
          userId: Number(user.id),
          userName: user.name,
          created,
          assigned,
          completed,
          completionRate: parseFloat(completionRate.toFixed(2)),
        }
      })
    )

    // Filter out users with no activities and sort by total activities
    const activeUserPerformance = userPerformance
      .filter(user => user.created > 0 || user.assigned > 0)
      .sort((a, b) => (b.created + b.assigned) - (a.created + a.assigned))

    return NextResponse.json({
      success: true,
      data: activeUserPerformance,
    })
  } catch (error) {
    console.error("User performance analysis error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch user performance data" },
      { status: 500 }
    )
  }
}
