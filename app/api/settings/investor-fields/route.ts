import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAuth } from "@/lib/api-auth"

// GET - List all investor fields with their options
export async function GET() {
  const authError = await requireApiAuth("settings.investorFields")
  if (authError) return authError

  try {
    const fields = await prisma.investor_fields.findMany({
      include: {
        investor_field_options: {
          orderBy: { sort_order: "asc" },
        },
      },
      orderBy: { sort_order: "asc" },
    })

    // Serialize BigInt fields
    const serializedFields = fields.map(field => ({
      ...field,
      id: Number(field.id),
      investor_field_options: field.investor_field_options.map(opt => ({
        ...opt,
        id: Number(opt.id),
        investor_field_id: Number(opt.investor_field_id),
      })),
    }))

    return NextResponse.json(serializedFields)
  } catch (error) {
    console.error("Error fetching investor fields:", error)
    return NextResponse.json(
      { error: "Failed to fetch investor fields" },
      { status: 500 }
    )
  }
}

// POST - Create new investor field
export async function POST(request: Request) {
  const authError = await requireApiAuth("settings.investorFields")
  if (authError) return authError

  try {
    const body = await request.json()

    const {
      name,
      label,
      type,
      is_required,
      is_active,
      placeholder,
      help_text,
      default_value,
      validation_rules,
      options, // Array of { value, label } for select fields
    } = body

    // Get max sort_order
    const maxField = await prisma.investor_fields.findFirst({
      orderBy: { sort_order: "desc" },
      select: { sort_order: true },
    })
    const nextSortOrder = (maxField?.sort_order || 0) + 1

    // Create field with options if provided
    const field = await prisma.investor_fields.create({
      data: {
        name,
        label,
        type: type as any,
        is_required: is_required || false,
        is_active: is_active !== undefined ? is_active : true,
        is_system_field: false,
        sort_order: nextSortOrder,
        placeholder: placeholder || null,
        help_text: help_text || null,
        default_value: default_value || null,
        validation_rules: validation_rules || null,
        created_at: new Date(),
        updated_at: new Date(),
        investor_field_options:
          options && (type === "select" || type === "multiselect" || type === "multiselect_dropdown")
            ? {
                create: options.map((opt: any, index: number) => ({
                  value: opt.value,
                  label: opt.label,
                  sort_order: index,
                  is_active: true,
                  created_at: new Date(),
                  updated_at: new Date(),
                })),
              }
            : undefined,
      },
      include: {
        investor_field_options: true,
      },
    })

    // Serialize BigInt fields
    const serializedField = {
      ...field,
      id: Number(field.id),
      investor_field_options: field.investor_field_options.map(opt => ({
        ...opt,
        id: Number(opt.id),
        investor_field_id: Number(opt.investor_field_id),
      })),
    }

    return NextResponse.json(serializedField, { status: 201 })
  } catch (error: any) {
    console.error("Error creating investor field:", error)
    console.error("Error message:", error?.message)
    console.error("Error stack:", error?.stack)
    return NextResponse.json(
      { error: "Failed to create investor field" },
      { status: 500 }
    )
  }
}
