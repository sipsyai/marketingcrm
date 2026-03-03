import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth-config"

// GET all investors
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const investors = await prisma.investors.findMany({
      orderBy: { created_at: "desc" },
      take: 100,
    })

    // Convert BigInt to number
    const serializedInvestors = investors.map(investor => ({
      ...investor,
      id: Number(investor.id),
      lead_id: investor.lead_id ? Number(investor.lead_id) : null,
      created_by: investor.created_by ? Number(investor.created_by) : null,
      updated_by: investor.updated_by ? Number(investor.updated_by) : null,
    }))

    return NextResponse.json(serializedInvestors)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch investors" }, { status: 500 })
  }
}

// POST create investor
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    // Check for unique phone
    if (investorData.phone) {
      const existingPhone = await prisma.investors.findUnique({
        where: { phone: investorData.phone },
      })

      if (existingPhone) {
        return NextResponse.json(
          { error: "An investor with this phone number already exists" },
          { status: 400 }
        )
      }
    }

    // Get system field values from customFields
    const sourceFieldId = await prisma.investor_fields.findFirst({
      where: { name: "source" },
      select: { id: true }
    })
    const statusFieldId = await prisma.investor_fields.findFirst({
      where: { name: "status" },
      select: { id: true }
    })
    const priorityFieldId = await prisma.investor_fields.findFirst({
      where: { name: "priority" },
      select: { id: true }
    })

    const sourceValue = sourceFieldId && customFields?.[sourceFieldId.id.toString()]
      ? customFields[sourceFieldId.id.toString()]
      : "referral"
    const statusValue = statusFieldId && customFields?.[statusFieldId.id.toString()]
      ? customFields[statusFieldId.id.toString()]
      : "potential"
    const priorityValue = priorityFieldId && customFields?.[priorityFieldId.id.toString()]
      ? customFields[priorityFieldId.id.toString()]
      : null

    const investor = await prisma.investors.create({
      data: {
        full_name: investorData.full_name,
        email: investorData.email,
        phone: investorData.phone || null,
        source: sourceValue,
        status: statusValue,
        priority: priorityValue,
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    })

    // Save custom field values
    if (customFields && typeof customFields === "object") {
      const fieldValues = Object.entries(customFields)
        .filter(([_, value]) => value !== null && value !== undefined && value !== "")
        .map(([fieldId, value]) => ({
          investor_id: investor.id,
          investor_field_id: BigInt(fieldId),
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

    return NextResponse.json({
      ...investor,
      id: Number(investor.id),
      lead_id: investor.lead_id ? Number(investor.lead_id) : null,
      created_by: investor.created_by ? Number(investor.created_by) : null,
      updated_by: investor.updated_by ? Number(investor.updated_by) : null,
    }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating investor:", error)
    return NextResponse.json(
      { error: "Failed to create investor" },
      { status: 500 }
    )
  }
}
