import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth-config"

// GET all leads
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const leads = await prisma.leads.findMany({
      orderBy: { created_at: "desc" },
      take: 100,
    })

    // Convert BigInt to number
    const serializedLeads = leads.map(lead => ({
      ...lead,
      id: Number(lead.id),
      activity_id: lead.activity_id ? Number(lead.activity_id) : null,
    }))

    return NextResponse.json(serializedLeads)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 })
  }
}

// POST create lead
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { customFields, ...leadData } = body

    // Check for unique email
    const existingEmail = await prisma.leads.findUnique({
      where: { email: leadData.email },
    })

    if (existingEmail) {
      return NextResponse.json(
        { error: "A lead with this email already exists" },
        { status: 400 }
      )
    }

    // Check for unique phone
    const existingPhone = await prisma.leads.findUnique({
      where: { phone: leadData.phone },
    })

    if (existingPhone) {
      return NextResponse.json(
        { error: "A lead with this phone number already exists" },
        { status: 400 }
      )
    }

    // Validate required fields
    const requiredFields = await prisma.lead_fields.findMany({
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
          error: "Required fields are missing",
          details: `Please fill in the following required fields: ${missingFields.join(', ')}`,
          missingFields
        },
        { status: 400 }
      )
    }

    // Get system field values from customFields
    const sourceFieldId = await prisma.lead_fields.findFirst({
      where: { name: "source" },
      select: { id: true }
    })
    const statusFieldId = await prisma.lead_fields.findFirst({
      where: { name: "status" },
      select: { id: true }
    })
    const priorityFieldId = await prisma.lead_fields.findFirst({
      where: { name: "priority" },
      select: { id: true }
    })

    const sourceValue = sourceFieldId && customFields?.[sourceFieldId.id.toString()]
      ? customFields[sourceFieldId.id.toString()]
      : "other"
    const statusValue = statusFieldId && customFields?.[statusFieldId.id.toString()]
      ? customFields[statusFieldId.id.toString()]
      : "new"
    const priorityValue = priorityFieldId && customFields?.[priorityFieldId.id.toString()]
      ? customFields[priorityFieldId.id.toString()]
      : null

    const lead = await prisma.leads.create({
      data: {
        full_name: leadData.full_name,
        email: leadData.email,
        phone: leadData.phone,
        source: sourceValue,
        status: statusValue,
        priority: priorityValue,
        notes_text: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    })

    // Save custom field values (exclude system fields from field_values table)
    if (customFields && typeof customFields === "object") {
      // Get system field IDs to exclude from lead_field_values
      const systemFieldIds = [
        sourceFieldId?.id.toString(),
        statusFieldId?.id.toString(),
        priorityFieldId?.id.toString()
      ].filter(Boolean)

      const fieldValues = Object.entries(customFields)
        .filter(([fieldId, value]) => {
          // Filter out system fields by name
          if (["source", "status", "priority"].includes(fieldId)) return false
          // Filter out system fields by ID
          if (systemFieldIds.includes(fieldId)) return false
          // Filter out empty values
          if (value === null || value === undefined || value === "") return false
          return true
        })
        .map(([fieldId, value]) => ({
          lead_id: lead.id,
          lead_field_id: BigInt(fieldId),
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

    return NextResponse.json({
      ...lead,
      id: Number(lead.id),
      activity_id: lead.activity_id ? Number(lead.activity_id) : null,
    }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating lead:", error)
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    )
  }
}
