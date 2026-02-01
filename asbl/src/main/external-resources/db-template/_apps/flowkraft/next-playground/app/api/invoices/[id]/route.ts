import { NextRequest, NextResponse } from "next/server";
import { db, invoices } from "@/lib/db";
import { eq } from "drizzle-orm";

// GET /api/invoices/[id] - Get a single invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, parseInt(id)));

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

// PUT /api/invoices/[id] - Update an invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const result = await db
      .update(invoices)
      .set({
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
        status: body.status,
        notes: body.notes || null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(invoices.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

// DELETE /api/invoices/[id] - Delete an invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await db
      .delete(invoices)
      .where(eq(invoices.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
}
