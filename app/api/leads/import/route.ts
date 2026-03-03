import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import {
  parseCSV,
  validateHeaders,
  validateFieldValue,
  parseValueFromCSV,
  mapLabelToFieldName,
  type CSVValidationError,
  type ImportResult,
} from "@/lib/csv-utils";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get CSV content from request
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const csvContent = await file.text();

    // Parse CSV
    const rows = parseCSV(csvContent);

    if (rows.length === 0) {
      return NextResponse.json({ error: "CSV file is empty" }, { status: 400 });
    }

    // Fetch lead fields
    const leadFields = await prisma.lead_fields.findMany({
      where: { is_active: true },
      include: {
        lead_field_options: true,
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
      "notes_text",
    ];

    // Validate headers
    const csvHeaders = Object.keys(rows[0]);
    const expectedHeaders = [
      ...staticFields,
      ...leadFields.map((f) => f.label),
    ];

    // Process each row
    const errors: CSVValidationError[] = [];
    let successCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because row 1 is headers and array is 0-indexed

      try {
        // Validate required static fields
        if (!row.email || !row.email.trim()) {
          errors.push({
            row: rowNumber,
            field: "email",
            message: "Email is required",
          });
          continue;
        }

        // Check if lead exists (by email)
        const existingLead = await prisma.leads.findUnique({
          where: { email: row.email },
        });

        // Prepare lead data
        const leadData: any = {
          full_name: row.full_name || "",
          email: row.email,
          phone: row.phone || null,
          source: row.source || null,
          status: row.status || null,
          priority: row.priority || null,
          notes_text: row.notes_text || null,
        };

        let lead;

        if (existingLead) {
          // Update existing lead
          lead = await prisma.leads.update({
            where: { id: existingLead.id },
            data: leadData,
          });
        } else {
          // Create new lead
          lead = await prisma.leads.create({
            data: leadData,
          });
        }

        // Process dynamic fields
        for (const field of leadFields) {
          const csvValue = row[field.label];

          // Validate field value
          const validation = validateFieldValue(csvValue, {
            name: field.name,
            label: field.label,
            type: field.type,
            is_required: field.is_required,
          });

          if (!validation.valid) {
            errors.push({
              row: rowNumber,
              field: field.label,
              message: validation.error || "Invalid value",
            });
            continue;
          }

          if (csvValue && csvValue.trim() !== "") {
            // Parse value based on field type
            const parsedValue = parseValueFromCSV(csvValue, field.type);

            // Convert to string for storage
            const valueString =
              typeof parsedValue === "object"
                ? JSON.stringify(parsedValue)
                : String(parsedValue);

            // Upsert field value
            await prisma.lead_field_values.upsert({
              where: {
                lead_id_lead_field_id: {
                  lead_id: lead.id,
                  lead_field_id: field.id,
                },
              },
              update: {
                value: valueString,
              },
              create: {
                lead_id: lead.id,
                lead_field_id: field.id,
                value: valueString,
              },
            });
          }
        }

        successCount++;
      } catch (error: any) {
        console.error(`Error processing row ${rowNumber}:`, error);

        // Handle unique constraint violations
        if (error.code === "P2002") {
          const field = error.meta?.target?.[0] || "unknown";
          errors.push({
            row: rowNumber,
            field: field,
            message: `Duplicate ${field}: ${row[field]}`,
          });
        } else {
          errors.push({
            row: rowNumber,
            field: "general",
            message: "Failed to import row",
          });
        }
      }
    }

    const result: ImportResult = {
      success: errors.length === 0,
      totalRows: rows.length,
      successCount,
      errorCount: errors.length,
      errors,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Lead import error:", error);
    return NextResponse.json(
      { error: "Failed to import leads" },
      { status: 500 }
    );
  }
}
