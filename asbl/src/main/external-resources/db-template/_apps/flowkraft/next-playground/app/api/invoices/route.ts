import { NextRequest, NextResponse } from "next/server";
import { db, invoices } from "@/lib/db";
import { desc, like, eq, or, and, count as countFn, type SQL } from "drizzle-orm";

// GET /api/invoices - List invoices with server-side pagination
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
      conditions.push(eq(invoices.status, status as "draft" | "sent" | "paid" | "overdue" | "cancelled"));
    }
    if (search) {
      conditions.push(
        or(
          like(invoices.customerName, `%${search}%`),
          like(invoices.invoiceNumber, `%${search}%`),
          like(invoices.customerId, `%${search}%`)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count with same filters
    const [{ total }] = await db
      .select({ total: countFn() })
      .from(invoices)
      .where(whereClause);

    // Get paginated data
    const data = await db
      .select()
      .from(invoices)
      .where(whereClause)
      .orderBy(desc(invoices.createdAt))
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
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await db
      .insert(invoices)
      .values({
        invoiceNumber: body.invoiceNumber,
        customerId: body.customerId,
        customerName: body.customerName,
        customerEmail: body.customerEmail || null,
        customerAddress: body.customerAddress || null,
        issueDate: body.issueDate,
        dueDate: body.dueDate,
        subtotal: parseFloat(body.subtotal),
        taxRate: parseFloat(body.taxRate || 0),
        taxAmount: parseFloat(body.taxAmount || 0),
        discount: parseFloat(body.discount || 0),
        totalAmount: parseFloat(body.totalAmount),
        currency: body.currency || "USD",
        status: body.status || "draft",
        notes: body.notes || null,
      })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
