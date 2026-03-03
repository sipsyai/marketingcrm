import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { InvestorDetailView } from "@/components/investors/investor-detail-view"

async function getInvestor(id: string) {
  const investor = await prisma.investors.findUnique({
    where: { id: parseInt(id) },
  })

  if (!investor) {
    return null
  }

  // Get activities for this investor
  const activitiesRaw = await prisma.activities.findMany({
    where: { investor_id: investor.id },
    orderBy: { created_at: "desc" },
    take: 10,
  })

  // Get custom field values
  const customFieldValuesRaw = await prisma.investor_field_values.findMany({
    where: { investor_id: investor.id },
    include: {
      investor_fields: {
        include: {
          investor_field_options: {
            orderBy: { sort_order: "asc" },
          },
        },
      },
    },
  })

  // Get all investor fields for display
  const allFields = await prisma.investor_fields.findMany({
    where: { is_active: true },
    include: {
      investor_field_options: {
        orderBy: { sort_order: "asc" },
      },
    },
    orderBy: { sort_order: "asc" },
  })

  // Get activity types (only active ones)
  const activityTypes = await prisma.activity_types.findMany({
    where: { is_active: true },
    orderBy: { sort_order: "asc" },
  })

  // Get form sections
  const formSections = await prisma.investor_form_sections.findMany({
    where: { is_visible: true },
    orderBy: { sort_order: "asc" },
  })

  // Get assigned user
  const assignment = await prisma.user_assignments.findFirst({
    where: {
      entity_type: "investor",
      entity_id: investor.id,
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
      const fieldType = cfv.investor_fields?.type
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
      investor_id: Number(cfv.investor_id),
      investor_field_id: Number(cfv.investor_field_id),
      value: parsedValue,
      investor_fields: {
        ...cfv.investor_fields,
        id: Number(cfv.investor_fields.id),
        investor_field_options: cfv.investor_fields.investor_field_options.map((opt) => ({
          ...opt,
          id: Number(opt.id),
          investor_field_id: Number(opt.investor_field_id),
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
    ...investor,
    id: Number(investor.id),
    lead_id: investor.lead_id ? Number(investor.lead_id) : null,
    customFieldValues,
    activities,
    allFields: allFields.map((field) => ({
      ...field,
      id: Number(field.id),
      investor_field_options: field.investor_field_options.map((opt) => ({
        ...opt,
        id: Number(opt.id),
        investor_field_id: Number(opt.investor_field_id),
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
    assignedUser: assignment
      ? {
          id: Number(assignment.user_assigned.id),
          name: assignment.user_assigned.name,
          email: assignment.user_assigned.email,
          assigned_at: assignment.assigned_at,
          assigned_by: {
            id: Number(assignment.user_assigner.id),
            name: assignment.user_assigner.name,
          },
        }
      : null,
    activeUsers: activeUsers.map((user) => ({
      id: Number(user.id),
      name: user.name,
      email: user.email,
    })),
  }
}

export default async function InvestorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const investor = await getInvestor(id)

  if (!investor) {
    notFound()
  }

  return <InvestorDetailView investor={investor} />
}
