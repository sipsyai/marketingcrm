import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import {
  parseCSV,
  validateFieldValue,
  parseValueFromCSV,
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

    // Fetch investor fields
    const investorFields = await prisma.investor_fields.findMany({
      where: { is_active: true },
      include: {
        investor_field_options: true,
      },
    });

    // Process each row
    const errors: CSVValidationError[] = [];
    let successCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because row 1 is headers and array is 0-indexed

      try {
        // Validate email (optional for investors but good to have)
        const email = row.email?.trim() || null;
        const phone = row.phone?.trim() || null;

        // At least one of email or phone should exist
        if (!email && !phone) {
          errors.push({
            row: rowNumber,
            field: "email/phone",
            message: "Either email or phone is required",
          });
          continue;
        }

        // Check if investor exists (by email or phone)
        let existingInvestor = null;

        if (email) {
          existingInvestor = await prisma.investors.findFirst({
            where: { email },
          });
        }

        if (!existingInvestor && phone) {
          existingInvestor = await prisma.investors.findUnique({
            where: { phone },
          });
        }

        // Prepare investor data
        const investorData: any = {
          full_name: row.full_name || "",
          email: email,
          phone: phone,
          company: row.company || null,
          position: row.position || null,
          source: row.source || "other",
          status: row.status || "potential",
          priority: row.priority || null,
          budget: row.budget || null,
          timeline: row.timeline || null,
          notes: row.notes || null,
        };

        let investor;

        if (existingInvestor) {
          // Update existing investor
          investor = await prisma.investors.update({
            where: { id: existingInvestor.id },
            data: investorData,
          });
        } else {
          // Create new investor
          investor = await prisma.investors.create({
            data: investorData,
          });
        }

        // Process dynamic fields
        for (const field of investorFields) {
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
            await prisma.investor_field_values.upsert({
              where: {
                investor_id_investor_field_id: {
                  investor_id: investor.id,
                  investor_field_id: field.id,
                },
              },
              update: {
                value: valueString,
              },
              create: {
                investor_id: investor.id,
                investor_field_id: field.id,
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
    console.error("Investor import error:", error);
    return NextResponse.json(
      { error: "Failed to import investors" },
      { status: 500 }
    );
  }
}
