import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { LeadDetailView } from "@/components/leads/lead-detail-view"

async function getLead(id: string) {
  const lead = await prisma.leads.findUnique({
    where: { id: parseInt(id) },
  })

  if (!lead) {
    return null
  }

  // Get activities for this lead
  const activitiesRaw = await prisma.activities.findMany({
    where: { lead_id: lead.id },
    orderBy: { created_at: "desc" },
    take: 10,
  })

  // Get custom field values
  const customFieldValuesRaw = await prisma.lead_field_values.findMany({
    where: { lead_id: lead.id },
    include: {
      lead_fields: {
        include: {
          lead_field_options: {
            orderBy: { sort_order: "asc" },
          },
        },
      },
    },
  })

  // Get all lead fields for display
  const allFields = await prisma.lead_fields.findMany({
    where: { is_active: true },
    include: {
      lead_field_options: {
        orderBy: { sort_order: "asc" },
      },
    },
    orderBy: { sort_order: "asc" },
  })

  // Get activity types
  const activityTypes = await prisma.activity_types.findMany({
    orderBy: { sort_order: "asc" },
  })

  // Get form sections
  const formSections = await prisma.lead_form_sections.findMany({
    where: { is_visible: true },
    orderBy: { sort_order: "asc" },
  })

  // Get user assignment
  const userAssignment = await prisma.user_assignments.findFirst({
    where: {
      entity_type: "lead",
      entity_id: lead.id,
    },
    include: {
      user_assigned: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      user_assigner: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  // Check if lead has already been promoted to investor
  const existingInvestor = await prisma.investors.findFirst({
    where: { lead_id: lead.id },
    select: { id: true },
  })

  // Get active users for assignment dropdown
  const activeUsers = await prisma.users.findMany({
    where: { status: "active" },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: "asc" },
  })

  // Convert BigInt to number and parse JSON values for multiselect fields
  const customFieldValues = customFieldValuesRaw.map((cfv) => {
    let parsedValue = cfv.value

    // Try to parse JSON for multiselect fields
    if (parsedValue && typeof parsedValue === 'string') {
      const fieldType = cfv.lead_fields?.type
      if (fieldType === 'multiselect' || fieldType === 'multiselect_dropdown') {
        try {
          parsedValue = JSON.parse(parsedValue)
          // If it's an array, keep it as is for proper display
          // If it's not an array after parsing, convert to string
          if (!Array.isArray(parsedValue)) {
            parsedValue = String(parsedValue)
          }
        } catch (e) {
          // If parsing fails, keep as string
        }
      }
    }

    return {
      ...cfv,
      id: Number(cfv.id),
      lead_id: Number(cfv.lead_id),
      lead_field_id: Number(cfv.lead_field_id),
      value: parsedValue,
      lead_fields: {
        ...cfv.lead_fields,
        id: Number(cfv.lead_fields.id),
        lead_field_options: cfv.lead_fields.lead_field_options.map((opt) => ({
          ...opt,
          id: Number(opt.id),
          lead_field_id: Number(opt.lead_field_id),
        })),
      },
    }
  })

  // Convert BigInt to number for activities
  const activities = activitiesRaw.map((activity) => ({
    ...activity,
    id: Number(activity.id),
    lead_id: activity.lead_id ? Number(activity.lead_id) : null,
    investor_id: activity.investor_id ? Number(activity.investor_id) : null,
    assigned_to: activity.assigned_to ? Number(activity.assigned_to) : null,
    user_id: activity.user_id ? Number(activity.user_id) : null,
    activity_type_id: activity.activity_type_id ? Number(activity.activity_type_id) : null,
  }))

  // Convert BigInt to number
  return {
    ...lead,
    id: Number(lead.id),
    customFieldValues,
    activities,
    allFields: allFields.map((field) => ({
      ...field,
      id: Number(field.id),
      lead_field_options: field.lead_field_options.map((opt) => ({
        ...opt,
        id: Number(opt.id),
        lead_field_id: Number(opt.lead_field_id),
      })),
    })),
    activityTypes: activityTypes.map((type) => ({
      ...type,
      id: Number(type.id),
    })),
    formSections: formSections.map((section) => ({
      ...section,
      id: Number(section.id),
    })),
    assignedUser: userAssignment ? {
      id: Number(userAssignment.user_assigned.id),
      name: userAssignment.user_assigned.name,
      email: userAssignment.user_assigned.email,
      assigned_at: userAssignment.created_at,
      assigned_by: {
        id: Number(userAssignment.user_assigner.id),
        name: userAssignment.user_assigner.name || "Unknown",
      },
    } : null,
    activeUsers: activeUsers.map((user) => ({
      ...user,
      id: Number(user.id),
    })),
    isPromoted: !!existingInvestor,
    promotedInvestorId: existingInvestor ? Number(existingInvestor.id) : null,
  }
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const lead = await getLead(id)

  if (!lead) {
    notFound()
  }

  return <LeadDetailView lead={lead} />
}
