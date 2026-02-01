import { NextRequest, NextResponse } from "next/server";
import { db, payslips } from "@/lib/db";
import { desc, like, eq, or } from "drizzle-orm";

// GET /api/payslips - List all payslips
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let result;

    if (status && search) {
      result = await db
        .select()
        .from(payslips)
        .where(
          or(
            like(payslips.employeeName, `%${search}%`),
            like(payslips.payslipNumber, `%${search}%`),
            like(payslips.employeeId, `%${search}%`)
          )
        )
        .orderBy(desc(payslips.createdAt));
      result = result.filter((p) => p.status === status);
    } else if (status) {
      result = await db
        .select()
        .from(payslips)
        .where(eq(payslips.status, status as "draft" | "sent" | "viewed" | "downloaded"))
        .orderBy(desc(payslips.createdAt));
    } else if (search) {
      result = await db
        .select()
        .from(payslips)
        .where(
          or(
            like(payslips.employeeName, `%${search}%`),
            like(payslips.payslipNumber, `%${search}%`),
            like(payslips.employeeId, `%${search}%`)
          )
        )
        .orderBy(desc(payslips.createdAt));
    } else {
      result = await db.select().from(payslips).orderBy(desc(payslips.createdAt));
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching payslips:", error);
    return NextResponse.json(
      { error: "Failed to fetch payslips" },
      { status: 500 }
    );
  }
}

// POST /api/payslips - Create a new payslip
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await db
      .insert(payslips)
      .values({
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
        status: body.status || "draft",
      })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating payslip:", error);
    return NextResponse.json(
      { error: "Failed to create payslip" },
      { status: 500 }
    );
  }
}
