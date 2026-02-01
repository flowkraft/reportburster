import { NextRequest, NextResponse } from "next/server";
import { db, invoices } from "@/lib/db";
import { desc, like, eq, or } from "drizzle-orm";

// GET /api/invoices - List all invoices
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let result;

    if (status && search) {
      result = await db
        .select()
        .from(invoices)
        .where(
          or(
            like(invoices.customerName, `%${search}%`),
            like(invoices.invoiceNumber, `%${search}%`),
            like(invoices.customerId, `%${search}%`)
          )
        )
        .orderBy(desc(invoices.createdAt));
      result = result.filter((inv) => inv.status === status);
    } else if (status) {
      result = await db
        .select()
        .from(invoices)
        .where(eq(invoices.status, status as "draft" | "sent" | "paid" | "overdue" | "cancelled"))
        .orderBy(desc(invoices.createdAt));
    } else if (search) {
      result = await db
        .select()
        .from(invoices)
        .where(
          or(
            like(invoices.customerName, `%${search}%`),
            like(invoices.invoiceNumber, `%${search}%`),
            like(invoices.customerId, `%${search}%`)
          )
        )
        .orderBy(desc(invoices.createdAt));
    } else {
      result = await db.select().from(invoices).orderBy(desc(invoices.createdAt));
    }

    return NextResponse.json(result);
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
