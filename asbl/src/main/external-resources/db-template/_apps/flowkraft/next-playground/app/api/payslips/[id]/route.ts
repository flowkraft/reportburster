import { NextRequest, NextResponse } from "next/server";
import { db, payslips } from "@/lib/db";
import { eq } from "drizzle-orm";

// GET /api/payslips/[id] - Get a single payslip
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await db
      .select()
      .from(payslips)
      .where(eq(payslips.id, parseInt(id)));

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Payslip not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error fetching payslip:", error);
    return NextResponse.json(
      { error: "Failed to fetch payslip" },
      { status: 500 }
    );
  }
}

// PUT /api/payslips/[id] - Update a payslip
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const result = await db
      .update(payslips)
      .set({
        payslipNumber: body.payslipNumber,
        employeeId: body.employeeId,
        employeeName: body.employeeName,
        employeeEmail: body.employeeEmail || null,
        department: body.department || null,
        payPeriodStart: body.payPeriodStart,
        payPeriodEnd: body.payPeriodEnd,
        grossAmount: parseFloat(body.grossAmount),
        deductions: parseFloat(body.deductions || 0),
        netAmount: parseFloat(body.netAmount),
        currency: body.currency || "USD",
        status: body.status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(payslips.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Payslip not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating payslip:", error);
    return NextResponse.json(
      { error: "Failed to update payslip" },
      { status: 500 }
    );
  }
}

// DELETE /api/payslips/[id] - Delete a payslip
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await db
      .delete(payslips)
      .where(eq(payslips.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Payslip not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting payslip:", error);
    return NextResponse.json(
      { error: "Failed to delete payslip" },
      { status: 500 }
    );
  }
}
