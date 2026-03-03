import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { subMonths, subDays } from "date-fns"
import { requireApiAuth } from "@/lib/api-auth"

// Activity KPIs calculation
export async function GET(request: NextRequest) {
  const authError = await requireApiAuth("activities")
  if (authError) return authError

  try {
    const now = new Date()

    // Total activities
    const totalActivities = await prisma.activities.count()

    // Pending activities
    const pendingActivities = await prisma.activities.count({
      where: { status: 'pending' },
    })

    // Completed this month
    const completedThisMonth = await prisma.activities.count({
      where: {
        status: 'completed',
        completed_at: {
          gte: subMonths(now, 1),
        },
      },
    })

    // Overdue activities (scheduled_at < now AND status = pending)
    const overdueActivities = await prisma.activities.count({
      where: {
        status: 'pending',
        scheduled_at: {
          lt: now,
        },
      },
    })

    // Activities this month vs last month for growth
    const activitiesThisMonth = await prisma.activities.count({
      where: {
        created_at: {
          gte: subMonths(now, 1),
        },
      },
    })

    const activitiesLastMonth = await prisma.activities.count({
      where: {
        created_at: {
          gte: subMonths(now, 2),
          lt: subMonths(now, 1),
        },
      },
    })

    const monthGrowth = activitiesLastMonth > 0
      ? ((activitiesThisMonth - activitiesLastMonth) / activitiesLastMonth) * 100
      : activitiesThisMonth > 0 ? 100 : 0

    return NextResponse.json({
      success: true,
      data: {
        totalActivities,
        pendingActivities,
        completedThisMonth,
        overdueActivities,
        monthGrowth: parseFloat(monthGrowth.toFixed(2)),
      },
    })
  } catch (error) {
    console.error("Activity KPIs calculation error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to calculate activity KPIs" },
      { status: 500 }
    )
  }
}
