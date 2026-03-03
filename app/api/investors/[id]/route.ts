import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth-config"

// GET single investor
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
    const investor = await prisma.investors.findUnique({
      where: { id: BigInt(id) },
    })

    if (!investor) {
      return NextResponse.json({ error: "Investor not found" }, { status: 404 })
    }

    // Get assigned user
    const assignment = await prisma.user_assignments.findFirst({
      where: {
        entity_type: "investor",
        entity_id: BigInt(id),
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

    // Serialize response
    const response: any = {
      ...investor,
      id: Number(investor.id),
      lead_id: investor.lead_id ? Number(investor.lead_id) : null,
      created_by: investor.created_by ? Number(investor.created_by) : null,
      updated_by: investor.updated_by ? Number(investor.updated_by) : null,
    }

    if (assignment) {
      response.assigned_user = {
        id: Number(assignment.user_assigned.id),
        name: assignment.user_assigned.name,
        email: assignment.user_assigned.email,
        assigned_at: assignment.assigned_at,
        assigned_by: {
          id: Number(assignment.user_assigner.id),
          name: assignment.user_assigner.name,
        },
      }
    } else {
      response.assigned_user = null
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching investor:", error)
    return NextResponse.json({ error: "Failed to fetch investor" }, { status: 500 })
  }
}

// PUT update investor
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
    const { customFields, ...investorData } = body

    // Validate required fields
    const requiredFields = await prisma.investor_fields.findMany({
      where: { is_required: true, is_active: true },
      select: { id: true, name: true, label: true }
    })

    const missingFields: string[] = []

    for (const field of requiredFields) {
      const fieldValue = customFields?.[field.name] || customFields?.[field.id.toString()]

      if (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '')) {
        missingFields.push(field.label)
      }
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: "Required fields missing",
          details: `Please fill in the following required fields: ${missingFields.join(', ')}`,
          missingFields
        },
        { status: 400 }
      )
    }

    // Get system field definitions (source, status, priority)
    const systemFields = await prisma.investor_fields.findMany({
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
      full_name: investorData.full_name,
      email: investorData.email,
      phone: investorData.phone,
      updated_at: new Date(),
    }

    // Handle source field - check both by field ID and by name
    if (sourceField && customFields?.[sourceField.id.toString()]) {
      updateData.source = customFields[sourceField.id.toString()]
    } else if (customFields?.source || investorData.source) {
      updateData.source = customFields?.source || investorData.source
    }

    // Handle status field - check both by field ID and by name
    if (statusField && customFields?.[statusField.id.toString()]) {
      updateData.status = customFields[statusField.id.toString()]
    } else if (customFields?.status || investorData.status) {
      updateData.status = customFields?.status || investorData.status
    }

    // Handle priority field - check both by field ID and by name
    if (priorityField && customFields?.[priorityField.id.toString()] !== undefined) {
      updateData.priority = customFields[priorityField.id.toString()] || null
    } else if (customFields?.priority !== undefined) {
      updateData.priority = customFields.priority || null
    } else if (investorData.priority !== undefined) {
      updateData.priority = investorData.priority || null
    }

    if (investorData.notes !== undefined) {
      updateData.notes = investorData.notes
    }

    const investor = await prisma.investors.update({
      where: { id: BigInt(id) },
      data: updateData,
    })

    // Update custom field values
    if (customFields && typeof customFields === "object") {
      // Delete existing custom field values
      await prisma.investor_field_values.deleteMany({
        where: { investor_id: BigInt(id) },
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
          investor_id: BigInt(id),
          investor_field_id: parseInt(fieldId),
          value: typeof value === "object" ? JSON.stringify(value) : String(value),
          created_at: new Date(),
          updated_at: new Date(),
        }))

      if (fieldValues.length > 0) {
        await prisma.investor_field_values.createMany({
          data: fieldValues,
        })
      }
    }

    // Serialize BigInt to number for JSON response
    const serializedInvestor = {
      ...investor,
      id: Number(investor.id),
      lead_id: investor.lead_id ? Number(investor.lead_id) : null,
      created_by: investor.created_by ? Number(investor.created_by) : null,
      updated_by: investor.updated_by ? Number(investor.updated_by) : null,
    }

    return NextResponse.json(serializedInvestor)
  } catch (error: any) {
    console.error("Error updating investor:", error)
    console.error("Error message:", error?.message)
    console.error("Error stack:", error?.stack)
    return NextResponse.json({
      error: "Failed to update investor",
    }, { status: 500 })
  }
}

// PATCH update user assignment
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { user_id } = body

    // Check if investor exists
    const investor = await prisma.investors.findUnique({
      where: { id: BigInt(id) },
    })

    if (!investor) {
      return NextResponse.json({ error: "Investor not found" }, { status: 404 })
    }

    // If user_id is null, unassign the user
    if (user_id === null || user_id === undefined) {
      await prisma.user_assignments.deleteMany({
        where: {
          entity_type: "investor",
          entity_id: BigInt(id),
        },
      })

      return NextResponse.json({ success: true, assigned_user: null })
    }

    // Validate user exists and is active
    const user = await prisma.users.findUnique({
      where: { id: BigInt(user_id) },
    })

    if (!user || user.status !== "active") {
      return NextResponse.json({ error: "User not found or inactive" }, { status: 400 })
    }

    // Delete existing assignment
    await prisma.user_assignments.deleteMany({
      where: {
        entity_type: "investor",
        entity_id: BigInt(id),
      },
    })

    // Create new assignment
    const assignment = await prisma.user_assignments.create({
      data: {
        user_id: BigInt(user_id),
        entity_type: "investor",
        entity_id: BigInt(id),
        assigned_by: BigInt(session.user.id),
        assigned_at: new Date(),
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

    // Serialize response
    const response = {
      success: true,
      assigned_user: {
        id: Number(assignment.user_assigned.id),
        name: assignment.user_assigned.name,
        email: assignment.user_assigned.email,
        assigned_at: assignment.assigned_at,
        assigned_by: {
          id: Number(assignment.user_assigner.id),
          name: assignment.user_assigner.name,
        },
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error updating user assignment:", error)
    return NextResponse.json({ error: "Failed to update user assignment" }, { status: 500 })
  }
}

// DELETE investor
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
    await prisma.investors.delete({
      where: { id: BigInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting investor:", error)
    return NextResponse.json({ error: "Failed to delete investor" }, { status: 500 })
  }
}
