import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth-config"

// GET single lead
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const lead = await prisma.leads.findUnique({
      where: { id: BigInt(id) },
    })

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    return NextResponse.json({
      ...lead,
      id: Number(lead.id),
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch lead" }, { status: 500 })
  }
}

// PUT update lead
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { customFields, ...leadData } = body

    // Get system field definitions (source, status, priority)
    const systemFields = await prisma.lead_fields.findMany({
      where: {
        name: { in: ['source', 'status', 'priority'] },
        is_active: true
      }
    })

    const sourceField = systemFields.find(f => f.name === 'source')
    const statusField = systemFields.find(f => f.name === 'status')
    const priorityField = systemFields.find(f => f.name === 'priority')

    // Prepare update data
    const updateData: any = {
      full_name: leadData.full_name,
      email: leadData.email,
      phone: leadData.phone,
      updated_at: new Date(),
    }

    // Handle source field - check both by field ID and by name
    if (sourceField && customFields?.[sourceField.id.toString()]) {
      updateData.source = customFields[sourceField.id.toString()]
    } else if (customFields?.source || leadData.source) {
      updateData.source = customFields?.source || leadData.source
    }

    // Handle status field - check both by field ID and by name
    if (statusField && customFields?.[statusField.id.toString()]) {
      updateData.status = customFields[statusField.id.toString()]
    } else if (customFields?.status || leadData.status) {
      updateData.status = customFields?.status || leadData.status
    }

    // Handle priority field - check both by field ID and by name
    if (priorityField && customFields?.[priorityField.id.toString()] !== undefined) {
      updateData.priority = customFields[priorityField.id.toString()] || null
    } else if (customFields?.priority !== undefined) {
      updateData.priority = customFields.priority || null
    } else if (leadData.priority !== undefined) {
      updateData.priority = leadData.priority || null
    }

    if (leadData.notes !== undefined) {
      updateData.notes_text = leadData.notes
    }

    const lead = await prisma.leads.update({
      where: { id: BigInt(id) },
      data: updateData,
    })

    // Update custom field values
    if (customFields && typeof customFields === "object") {
      // Delete existing custom field values
      await prisma.lead_field_values.deleteMany({
        where: { lead_id: BigInt(id) },
      })

      // Insert new custom field values, excluding system fields
      const systemFieldIds = [
        sourceField?.id.toString(),
        statusField?.id.toString(),
        priorityField?.id.toString()
      ].filter(Boolean)

      const fieldValues = Object.entries(customFields)
        .filter(([key, value]) => {
          // Exclude system fields by name
          if (key === "source" || key === "status" || key === "priority") {
            return false
          }
          // Exclude system fields by ID
          if (systemFieldIds.includes(key)) {
            return false
          }
          // Exclude if value is empty
          if (value === null || value === undefined || value === "") {
            return false
          }
          // Exclude if key is not a valid number (field ID)
          const fieldId = parseInt(key)
          if (isNaN(fieldId)) {
            return false
          }
          return true
        })
        .map(([fieldId, value]) => ({
          lead_id: BigInt(id),
          lead_field_id: parseInt(fieldId),
          value: typeof value === "object" ? JSON.stringify(value) : String(value),
          created_at: new Date(),
          updated_at: new Date(),
        }))

      if (fieldValues.length > 0) {
        await prisma.lead_field_values.createMany({
          data: fieldValues,
        })
      }
    }

    // Serialize BigInt to number for JSON response
    const serializedLead = {
      ...lead,
      id: Number(lead.id),
    }

    return NextResponse.json(serializedLead)
  } catch (error: any) {
    console.error("Error updating lead:", error)
    console.error("Error message:", error?.message)
    console.error("Error stack:", error?.stack)
    return NextResponse.json({
      error: "Failed to update lead",
    }, { status: 500 })
  }
}

// DELETE lead
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await prisma.leads.delete({
      where: { id: BigInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting lead:", error)
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 })
  }
}

// PATCH - Assign/unassign user to lead
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { user_id } = body

    // Verify lead exists
    const lead = await prisma.leads.findUnique({
      where: { id: BigInt(id) }
    })

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Handle user assignment
    if (user_id === null) {
      // Unassign user - delete assignment
      await prisma.user_assignments.deleteMany({
        where: {
          entity_type: "lead",
          entity_id: BigInt(id)
        }
      })
    } else {
      // Verify user exists
      const user = await prisma.users.findUnique({
        where: { id: BigInt(user_id) }
      })

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      // Check if assignment exists
      const existingAssignment = await prisma.user_assignments.findFirst({
        where: {
          entity_type: "lead",
          entity_id: BigInt(id)
        }
      })

      if (existingAssignment) {
        // Update existing assignment - keep same assigned_by
        await prisma.user_assignments.update({
          where: { id: existingAssignment.id },
          data: {
            user_id: BigInt(user_id),
            assigned_by: existingAssignment.assigned_by, // Keep original assigner
            updated_at: new Date()
          }
        })
      } else {
        // Create new assignment - assigned_by is the current session user
        if (!session.user?.id) {
          return NextResponse.json({ error: "Invalid session" }, { status: 401 })
        }

        await prisma.user_assignments.create({
          data: {
            user_id: BigInt(user_id),
            entity_type: "lead",
            entity_id: BigInt(id),
            assigned_by: BigInt(session.user.id),
            created_at: new Date(),
            updated_at: new Date()
          }
        })
      }
    }

    // Fetch updated lead
    const updatedLead = await prisma.leads.findUnique({
      where: { id: BigInt(id) }
    })

    // Fetch user assignments with both user_assigned and user_assigner
    const assignments = await prisma.user_assignments.findMany({
      where: {
        entity_type: "lead",
        entity_id: BigInt(id)
      },
      include: {
        user_assigned: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        user_assigner: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Serialize BigInt to number for JSON response
    const serializedLead = {
      ...updatedLead,
      id: Number(updatedLead!.id),
      user_assignments: assignments.map(assignment => ({
        ...assignment,
        id: Number(assignment.id),
        user_id: Number(assignment.user_id),
        entity_id: Number(assignment.entity_id),
        assigned_by: Number(assignment.assigned_by),
        user_assigned: {
          ...assignment.user_assigned,
          id: Number(assignment.user_assigned.id)
        },
        user_assigner: {
          ...assignment.user_assigner,
          id: Number(assignment.user_assigner.id)
        }
      }))
    }

    return NextResponse.json(serializedLead)
  } catch (error: any) {
    console.error("Error assigning user to lead:", error)
    return NextResponse.json({
      error: "Failed to assign user",
    }, { status: 500 })
  }
}
