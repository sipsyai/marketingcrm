import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth-config"

// POST - Promote lead to investor
export async function POST(
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
    const { description } = body

    // Validate description
    if (!description || description.trim().length < 3) {
      return NextResponse.json(
        { error: "Description is required and must be at least 3 characters" },
        { status: 400 }
      )
    }

    // Fetch lead with custom field values
    const lead = await prisma.leads.findUnique({
      where: { id: BigInt(id) },
      include: {
        lead_field_values: {
          include: {
            lead_fields: true
          }
        }
      }
    })

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Check if lead already converted
    const existingInvestor = await prisma.investors.findFirst({
      where: { lead_id: BigInt(id) }
    })

    if (existingInvestor) {
      return NextResponse.json(
        {
          error: "This lead has already been converted to an investor",
          investorId: Number(existingInvestor.id)
        },
        { status: 400 }
      )
    }

    // Check phone uniqueness for investor
    if (lead.phone) {
      const existingPhone = await prisma.investors.findUnique({
        where: { phone: lead.phone }
      })

      if (existingPhone) {
        return NextResponse.json(
          { error: "An investor with this phone number already exists" },
          { status: 400 }
        )
      }
    }

    // Get all investor fields for mapping
    const investorFields = await prisma.investor_fields.findMany({
      where: { is_active: true },
      include: {
        investor_field_options: {
          orderBy: { sort_order: "asc" }
        }
      }
    })

    // Create investor
    const investor = await prisma.investors.create({
      data: {
        lead_id: BigInt(id),
        full_name: lead.full_name,
        email: lead.email,
        phone: lead.phone || null,
        source: lead.source || "other",
        status: "potential",
        priority: lead.priority || "medium",
        notes: description,
        created_at: new Date(),
        updated_at: new Date(),
      }
    })

    // Map custom fields from lead to investor
    const customFieldMapping: Array<{
      investor_id: bigint
      investor_field_id: number
      value: string
      created_at: Date
      updated_at: Date
    }> = []

    for (const leadFieldValue of lead.lead_field_values) {
      const leadFieldName = leadFieldValue.lead_fields.name

      // Skip system fields (already mapped above)
      if (leadFieldName === "source" || leadFieldName === "status" || leadFieldName === "priority") {
        continue
      }

      // Find matching investor field by name
      const matchingInvestorField = investorFields.find(
        f => f.name === leadFieldName
      )

      if (matchingInvestorField && leadFieldValue.value) {
        customFieldMapping.push({
          investor_id: investor.id,
          investor_field_id: Number(matchingInvestorField.id),
          value: leadFieldValue.value,
          created_at: new Date(),
          updated_at: new Date(),
        })
      }
    }

    // Insert mapped custom fields
    if (customFieldMapping.length > 0) {
      await prisma.investor_field_values.createMany({
        data: customFieldMapping
      })
    }

    // Copy user assignment from lead to investor
    const leadAssignment = await prisma.user_assignments.findFirst({
      where: {
        entity_type: "lead",
        entity_id: BigInt(id)
      }
    })

    if (leadAssignment) {
      await prisma.user_assignments.create({
        data: {
          user_id: leadAssignment.user_id,
          entity_type: "investor",
          entity_id: investor.id,
          assigned_by: leadAssignment.assigned_by,
          created_at: new Date(),
          updated_at: new Date()
        }
      })
    }

    // Create "converted" activity for lead
    await prisma.activities.create({
      data: {
        lead_id: BigInt(id),
        investor_id: investor.id,
        type: "converted",
        subject: "Lead converted to Investor",
        description: description,
        status: "completed",
        completed_at: new Date(),
        user_id: session.user?.id ? BigInt(session.user.id) : null,
        created_at: new Date(),
        updated_at: new Date(),
      }
    })

    // Update lead status to "won"
    await prisma.leads.update({
      where: { id: BigInt(id) },
      data: {
        status: "won",
        updated_at: new Date(),
      }
    })

    // Serialize response
    const response = {
      success: true,
      investorId: Number(investor.id),
      message: "Lead successfully converted to investor"
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error: any) {
    console.error("Error promoting lead to investor:", error)
    return NextResponse.json(
      { error: "Failed to promote lead to investor" },
      { status: 500 }
    )
  }
}
