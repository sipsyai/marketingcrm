import { Suspense } from "react"
import { auth } from "@/lib/auth-config"
import { prisma } from "@/lib/prisma"
import { DashboardStats } from "@/components/dashboard/stats"
import { RecentLeads } from "@/components/dashboard/recent-leads"
import { UnauthorizedToast } from "@/components/dashboard/unauthorized-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { checkMenuPermission } from "@/lib/permissions"

async function getDashboardData() {
  const [
    totalLeads,
    totalInvestors,
    totalActivities,
    pendingActivities,
    recentLeads
  ] = await Promise.all([
    prisma.leads.count(),
    prisma.investors.count(),
    prisma.activities.count(),
    prisma.activities.count({ where: { status: "pending" } }),
    prisma.leads.findMany({
      take: 5,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        status: true,
        created_at: true,
      }
    }).then(leads => leads.map(lead => ({
      ...lead,
      id: Number(lead.id),
    })))
  ])

  return {
    totalLeads,
    totalInvestors,
    totalActivities,
    pendingActivities,
    recentLeads
  }
}

export default async function DashboardPage() {
  const session = await auth()
  const data = await getDashboardData()
  const permissions = session?.user?.permissions

  const canAccessLeads = checkMenuPermission(permissions, "leads")
  const canAccessInvestors = checkMenuPermission(permissions, "investors")
  const canAccessActivities = checkMenuPermission(permissions, "activities")
  const canAccessReports = checkMenuPermission(permissions, "reports")

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <UnauthorizedToast />
      </Suspense>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name}
        </p>
      </div>

      <DashboardStats
        totalLeads={data.totalLeads}
        totalInvestors={data.totalInvestors}
        totalActivities={data.totalActivities}
        pendingActivities={data.pendingActivities}
        canAccessLeads={canAccessLeads}
        canAccessInvestors={canAccessInvestors}
        canAccessActivities={canAccessActivities}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <RecentLeads leads={data.recentLeads} />

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {canAccessLeads && (
              <a href="/leads?action=create" className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <span className="text-lg">👤</span>
                </div>
                <div>
                  <p className="font-medium">Add New Lead</p>
                  <p className="text-sm text-muted-foreground">Create a new lead entry</p>
                </div>
              </a>
            )}

            {canAccessInvestors && (
              <a href="/investors?action=create" className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                  <span className="text-lg">🏢</span>
                </div>
                <div>
                  <p className="font-medium">Add New Investor</p>
                  <p className="text-sm text-muted-foreground">Create a new investor entry</p>
                </div>
              </a>
            )}

            {canAccessReports && (
              <a href="/reports" className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <span className="text-lg">📊</span>
                </div>
                <div>
                  <p className="font-medium">View Reports</p>
                  <p className="text-sm text-muted-foreground">Analytics and insights</p>
                </div>
              </a>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Dashboards - only show if user has relevant permissions */}
      {(canAccessLeads || canAccessInvestors || canAccessActivities) && (
        <Card>
          <CardHeader>
            <CardTitle>Specialized Dashboards</CardTitle>
            <CardDescription>Deep dive into specific analytics</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {canAccessLeads && (
              <a href="/dashboard/leads" className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent hover:shadow-md transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                  <span className="text-2xl">👥</span>
                </div>
                <div>
                  <p className="font-medium">Leads Dashboard</p>
                  <p className="text-xs text-muted-foreground">Conversion funnel & trends</p>
                </div>
              </a>
            )}

            {canAccessInvestors && (
              <a href="/dashboard/investors" className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent hover:shadow-md transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                  <span className="text-2xl">🏢</span>
                </div>
                <div>
                  <p className="font-medium">Investors Dashboard</p>
                  <p className="text-xs text-muted-foreground">Portfolio & pipeline insights</p>
                </div>
              </a>
            )}

            {canAccessActivities && (
              <a href="/dashboard/activities" className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent hover:shadow-md transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <p className="font-medium">Activities Dashboard</p>
                  <p className="text-xs text-muted-foreground">Team performance metrics</p>
                </div>
              </a>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
