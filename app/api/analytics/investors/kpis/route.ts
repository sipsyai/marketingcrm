import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { subMonths } from "date-fns"
import { requireApiAuth } from "@/lib/api-auth"

// Investor KPIs calculation
export async function GET(request: NextRequest) {
  const authError = await requireApiAuth("investors")
  if (authError) return authError

  try {
    const now = new Date()
    const lastMonth = subMonths(now, 1)

    // Total active investors
    const totalInvestors = await prisma.investors.count({
      where: {
        status: {
          not: 'inactive',
        },
      },
    })

    // Investors this month
    const investorsThisMonth = await prisma.investors.count({
      where: {
        created_at: {
          gte: lastMonth,
        },
      },
    })

    // Investors last month
    const investorsLastMonth = await prisma.investors.count({
      where: {
        created_at: {
          gte: subMonths(now, 2),
          lt: lastMonth,
        },
      },
    })

    // Month-over-month growth
    const monthGrowth = investorsLastMonth > 0
      ? ((investorsThisMonth - investorsLastMonth) / investorsLastMonth) * 100
      : investorsThisMonth > 0 ? 100 : 0

    // Calculate total investment value (from budget/investment_amount field if exists)
    // For now, we'll use a placeholder - can be enhanced with actual field values
    const totalInvestmentValue = 0

    // Average deal size
    const avgDealSize = totalInvestors > 0 && totalInvestmentValue > 0
      ? totalInvestmentValue / totalInvestors
      : 0

    // Portfolio growth rate (month over month)
    const portfolioGrowthRate = monthGrowth

    return NextResponse.json({
      success: true,
      data: {
        totalInvestors,
        investorsThisMonth,
        monthGrowth: parseFloat(monthGrowth.toFixed(2)),
        totalInvestmentValue,
        avgDealSize: parseFloat(avgDealSize.toFixed(2)),
        portfolioGrowthRate: parseFloat(portfolioGrowthRate.toFixed(2)),
      },
    })
  } catch (error) {
    console.error("Investor KPIs calculation error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to calculate investor KPIs" },
      { status: 500 }
    )
  }
}
