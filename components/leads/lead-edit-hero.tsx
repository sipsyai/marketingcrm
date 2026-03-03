"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail, Phone, Calendar, Save, X } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface LeadEditHeroProps {
  lead: {
    id: number
    full_name: string
    email: string
    phone: string
    source: string
    status: string
    priority: string | null
    created_at: Date | null
  }
  isSubmitting: boolean
  onSave: () => void
  onCancel: () => void
}

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  new: { color: "text-blue-700", bg: "bg-blue-50 border-blue-200", label: "New" },
  contacted: { color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200", label: "Contacted" },
  qualified: { color: "text-green-700", bg: "bg-green-50 border-green-200", label: "Qualified" },
  proposal: { color: "text-purple-700", bg: "bg-purple-50 border-purple-200", label: "Proposal" },
  negotiation: { color: "text-orange-700", bg: "bg-orange-50 border-orange-200", label: "Negotiation" },
  won: { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", label: "Won" },
  lost: { color: "text-red-700", bg: "bg-red-50 border-red-200", label: "Lost" },
}

const priorityConfig: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  low: { color: "text-gray-700", bg: "bg-gray-50 border-gray-200", label: "Low", icon: "○" },
  medium: { color: "text-blue-700", bg: "bg-blue-50 border-blue-200", label: "Medium", icon: "◐" },
  high: { color: "text-orange-700", bg: "bg-orange-50 border-orange-200", label: "High", icon: "●" },
  urgent: { color: "text-red-700", bg: "bg-red-50 border-red-200", label: "Urgent", icon: "⚠" },
}

export function LeadEditHero({ lead, isSubmitting, onSave, onCancel }: LeadEditHeroProps) {
  const status = statusConfig[lead.status] || statusConfig.new
  const priority = lead.priority ? (priorityConfig[lead.priority] || priorityConfig.medium) : null

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-4 sm:p-6 md:p-8 shadow-xl mb-6">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,white)]" />

      <div className="relative">
        {/* Back Button & Actions */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/leads">
            <Button variant="ghost" size="icon" className="hover:bg-white/20 text-white border border-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="secondary"
              className="bg-white/95 hover:bg-white text-gray-900 shadow-lg"
              onClick={onSave}
              disabled={isSubmitting}
            >
              <Save className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{isSubmitting ? "Saving..." : "Save Changes"}</span>
              <span className="sm:hidden">{isSubmitting ? "..." : "Save"}</span>
            </Button>
            <Button
              variant="secondary"
              className="bg-red-500/90 hover:bg-red-600 text-white shadow-lg"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Cancel</span>
            </Button>
          </div>
        </div>

        {/* Lead Info */}
        <div className="flex items-start gap-3 sm:gap-4 md:gap-6">
          <Avatar className="h-14 w-14 sm:h-20 sm:w-20 md:h-24 md:w-24 border-4 border-white/20 shadow-xl">
            <AvatarFallback className="text-lg sm:text-xl md:text-2xl font-bold bg-white/90 text-indigo-600">
              {getInitials(lead.full_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl sm:text-2xl md:text-4xl font-bold tracking-tight text-white">
                {lead.full_name}
              </h1>
              <Badge variant="outline" className="bg-white/20 text-white border-white/30 text-sm">
                Editing
              </Badge>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <Badge className={`${status.bg} ${status.color} border-none shadow-sm`}>
                {status.label}
              </Badge>
              {lead.priority && priority && (
                <Badge className={`${priority.bg} ${priority.color} border-none shadow-sm`}>
                  <span className="mr-1">{priority.icon}</span>
                  {priority.label}
                </Badge>
              )}
              <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                {lead.source.replace(/_/g, " ")}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-white/90">
              <a href={`mailto:${lead.email}`} className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{lead.email}</span>
              </a>
              <span className="text-white/40 hidden sm:inline">•</span>
              <a href={`tel:${lead.phone}`} className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="h-4 w-4" />
                <span className="text-sm">{lead.phone}</span>
              </a>
              <span className="text-white/40 hidden sm:inline">•</span>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  Created {lead.created_at ? format(new Date(lead.created_at), "MMM dd, yyyy") : "-"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
