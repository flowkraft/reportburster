import { NextRequest, NextResponse } from "next/server";
import { db, payslips } from "@/lib/db";
import { desc, like, eq, or, and, count as countFn, type SQL } from "drizzle-orm";

// GET /api/payslips - List payslips with server-side pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25")));
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions: SQL[] = [];
    if (status) {
      conditions.push(eq(payslips.status, status as "draft" | "sent" | "viewed" | "downloaded"));
    }
    if (search) {
      conditions.push(
        or(
          like(payslips.employeeName, `%${search}%`),
          like(payslips.payslipNumber, `%${search}%`),
          like(payslips.employeeId, `%${search}%`)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count with same filters
    const [{ total }] = await db
      .select({ total: countFn() })
      .from(payslips)
      .where(whereClause);

    // Get paginated data
    const data = await db
      .select()
      .from(payslips)
      .where(whereClause)
      .orderBy(desc(payslips.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data,
      total,
      page,
      pageSize: limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
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
