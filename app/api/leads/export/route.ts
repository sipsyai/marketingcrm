import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { arrayToCSV, formatValueForCSV, generateHeaders } from "@/lib/csv-utils";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all leads
    const leads = await prisma.leads.findMany({
      include: {
        lead_field_values: {
          include: {
            lead_fields: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Fetch all active lead fields
    const leadFields = await prisma.lead_fields.findMany({
      where: {
        is_active: true,
      },
      orderBy: {
        sort_order: "asc",
      },
    });

    // Define static fields
    const staticFields = [
      "full_name",
      "email",
      "phone",
      "source",
      "status",
      "priority",
      "assigned_to",
      "notes_text",
      "created_at",
      "updated_at",
    ];

    // Generate CSV headers
    const headers = generateHeaders(
      staticFields,
      leadFields.map((f) => ({
        name: f.name,
        label: f.label,
        type: f.type,
        is_required: f.is_required,
      }))
    );

    // Transform leads to CSV rows
    const csvData = leads.map((lead) => {
      const row: any = {
        full_name: lead.full_name,
        email: lead.email,
        phone: lead.phone || "",
        source: lead.source || "",
        status: lead.status || "",
        priority: lead.priority || "",
        assigned_to: "",
        notes_text: lead.notes_text || "",
        created_at: lead.created_at ? new Date(lead.created_at).toISOString() : "",
        updated_at: lead.updated_at ? new Date(lead.updated_at).toISOString() : "",
      };

      // Add dynamic field values
      leadFields.forEach((field) => {
        const fieldValue = lead.lead_field_values.find(
          (fv) => Number(fv.lead_field_id) === Number(field.id)
        );

        if (fieldValue) {
          row[field.label] = formatValueForCSV(fieldValue.value, field.type);
        } else {
          row[field.label] = "";
        }
      });

      return row;
    });

    // Generate CSV content
    const csvContent = arrayToCSV(csvData, headers);

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv;charset=utf-8;",
        "Content-Disposition": `attachment; filename="leads_export_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Lead export error:", error);
    return NextResponse.json(
      { error: "Failed to export leads" },
      { status: 500 }
    );
  }
}
