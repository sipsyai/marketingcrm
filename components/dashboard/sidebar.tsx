"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Building2,
  Activity,
  BarChart3,
  Settings,
  ChevronLeft,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { checkMenuPermission } from "@/lib/permissions"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, key: "dashboard" },
  { name: "Leads", href: "/leads", icon: Users, key: "leads" },
  { name: "Investors", href: "/investors", icon: Building2, key: "investors" },
  { name: "Activities", href: "/activities", icon: Activity, key: "activities" },
  { name: "Reports", href: "/reports", icon: BarChart3, key: "reports" },
  { name: "Settings", href: "/settings", icon: Settings, key: "settings" },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { data: session } = useSession()

  // Filter navigation based on user permissions
  const filteredNavigation = navigation.filter((item) => {
    return checkMenuPermission(session?.user?.permissions, item.key)
  })

  return (
    <div
      className={cn(
        "relative hidden md:flex flex-col border-r bg-gradient-to-b from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
          <Sparkles className="h-6 w-6" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Marketing CRM
            </span>
            <span className="text-xs text-muted-foreground">AI-Powered</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 transition-all",
                    isActive && "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <Icon className={cn("h-5 w-5", collapsed && "h-6 w-6")} />
                  {!collapsed && <span>{item.name}</span>}
                </Button>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Collapse Button */}
      <div className="border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center"
        >
          <ChevronLeft
            className={cn(
              "h-5 w-5 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>
    </div>
  )
}
