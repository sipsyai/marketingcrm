import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAuth } from "@/lib/api-auth"

// GET - Get single lead field
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireApiAuth("settings.leadFields")
  if (authError) return authError

  try {
    const { id } = await params
    const field = await prisma.lead_fields.findUnique({
      where: { id: parseInt(id) },
      include: {
        lead_field_options: {
          orderBy: { sort_order: "asc" },
        },
      },
    })

    if (!field) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 })
    }

    // Serialize BigInt fields
    const serializedField = {
      ...field,
      id: Number(field.id),
      lead_field_options: field.lead_field_options.map(opt => ({
        ...opt,
        id: Number(opt.id),
        lead_field_id: Number(opt.lead_field_id),
      })),
    }

    return NextResponse.json(serializedField)
  } catch (error) {
    console.error("Error fetching lead field:", error)
    return NextResponse.json(
      { error: "Failed to fetch lead field" },
      { status: 500 }
    )
  }
}

// PUT - Update lead field
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireApiAuth("settings.leadFields")
  if (authError) return authError

  try {
    const { id } = await params
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
      options,
    } = body

    const fieldId = BigInt(id)

    // Update field
    const field = await prisma.lead_fields.update({
      where: { id: fieldId },
      data: {
        name,
        label,
        type: type as any,
        is_required,
        is_active,
        placeholder: placeholder || null,
        help_text: help_text || null,
        default_value: default_value || null,
        validation_rules: validation_rules || null,
        updated_at: new Date(),
      },
    })

    // Update options if provided and field is select type
    if (options && Array.isArray(options) && (type === "select" || type === "multiselect" || type === "multiselect_dropdown")) {
      // Delete existing options
      await prisma.lead_field_options.deleteMany({
        where: { lead_field_id: fieldId },
      })

      // Create new options
      if (options.length > 0) {
        await prisma.lead_field_options.createMany({
          data: options.map((opt: any, index: number) => ({
            lead_field_id: fieldId,
            value: opt.value,
            label: opt.label,
            sort_order: opt.sort_order !== undefined ? opt.sort_order : index,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          })),
        })
      }
    }

    // Fetch updated field with options
    const updatedField = await prisma.lead_fields.findUnique({
      where: { id: fieldId },
      include: {
        lead_field_options: {
          orderBy: { sort_order: "asc" },
        },
      },
    })

    // Serialize BigInt values to number
    const serializedField = {
      ...updatedField,
      id: updatedField ? Number(updatedField.id) : null,
      lead_field_options: updatedField?.lead_field_options?.map(opt => ({
        ...opt,
        id: Number(opt.id),
        lead_field_id: Number(opt.lead_field_id),
      })),
    }

    return NextResponse.json(serializedField)
  } catch (error) {
    console.error("Error updating lead field:", error)
    return NextResponse.json(
      { error: "Failed to update lead field" },
      { status: 500 }
    )
  }
}

// DELETE - Delete lead field
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireApiAuth("settings.leadFields")
  if (authError) return authError

  try {
    const { id } = await params
    const field = await prisma.lead_fields.findUnique({
      where: { id: parseInt(id) },
    })

    if (!field) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 })
    }

    // Prevent deletion of system fields
    if (field.is_system_field) {
      return NextResponse.json(
        { error: "Cannot delete system fields" },
        { status: 400 }
      )
    }

    // Delete field (cascade will handle options and values)
    await prisma.lead_fields.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting lead field:", error)
    return NextResponse.json(
      { error: "Failed to delete lead field" },
      { status: 500 }
    )
  }
}
