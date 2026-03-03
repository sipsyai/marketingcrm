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

    // Fetch all investors
    const investors = await prisma.investors.findMany({
      include: {
        investor_field_values: {
          include: {
            investor_fields: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Fetch all active investor fields
    const investorFields = await prisma.investor_fields.findMany({
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
      "company",
      "position",
      "source",
      "status",
      "priority",
      "budget",
      "timeline",
      "assigned_to",
      "notes",
      "created_at",
      "updated_at",
    ];

    // Generate CSV headers
    const headers = generateHeaders(
      staticFields,
      investorFields.map((f) => ({
        name: f.name,
        label: f.label,
        type: f.type,
        is_required: f.is_required,
      }))
    );

    // Transform investors to CSV rows
    const csvData = investors.map((investor) => {
      const row: any = {
        full_name: investor.full_name || "",
        email: investor.email || "",
        phone: investor.phone || "",
        company: investor.company || "",
        position: investor.position || "",
        source: investor.source || "",
        status: investor.status || "",
        priority: investor.priority || "",
        budget: investor.budget || "",
        timeline: investor.timeline || "",
        assigned_to: "",
        notes: investor.notes || "",
        created_at: investor.created_at ? new Date(investor.created_at).toISOString() : "",
        updated_at: investor.updated_at ? new Date(investor.updated_at).toISOString() : "",
      };

      // Add dynamic field values
      investorFields.forEach((field) => {
        const fieldValue = investor.investor_field_values.find(
          (fv) => Number(fv.investor_field_id) === Number(field.id)
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
        "Content-Disposition": `attachment; filename="investors_export_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Investor export error:", error);
    return NextResponse.json(
      { error: "Failed to export investors" },
      { status: 500 }
    );
  }
}
