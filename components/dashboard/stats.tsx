"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building2, Activity, Clock } from "lucide-react"
import { motion } from "framer-motion"

interface DashboardStatsProps {
  totalLeads: number
  totalInvestors: number
  totalActivities: number
  pendingActivities: number
  canAccessLeads?: boolean
  canAccessInvestors?: boolean
  canAccessActivities?: boolean
}

const stats = [
  {
    title: "Total Leads",
    icon: Users,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    title: "Investors",
    icon: Building2,
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50 dark:bg-green-950/20",
  },
  {
    title: "Total Activities",
    icon: Activity,
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
  },
  {
    title: "Pending Activities",
    icon: Clock,
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
  },
]

export function DashboardStats({
  totalLeads,
  totalInvestors,
  totalActivities,
  pendingActivities,
  canAccessLeads = true,
  canAccessInvestors = true,
  canAccessActivities = true,
}: DashboardStatsProps) {
  const allStats = [
    { ...stats[0], value: totalLeads, visible: canAccessLeads },
    { ...stats[1], value: totalInvestors, visible: canAccessInvestors },
    { ...stats[2], value: totalActivities, visible: canAccessActivities },
    { ...stats[3], value: pendingActivities, visible: canAccessActivities },
  ]

  const visibleStats = allStats.filter((s) => s.visible)

  return (
    <div className={`grid gap-4 md:grid-cols-2 ${visibleStats.length >= 4 ? "lg:grid-cols-4" : visibleStats.length === 3 ? "lg:grid-cols-3" : visibleStats.length === 2 ? "lg:grid-cols-2" : ""}`}>
      {visibleStats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value.toLocaleString()}</div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
