import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { db, invoices } from "@/lib/db"
import { eq } from "drizzle-orm"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId, invoiceId } = await request.json()

    if (!paymentIntentId || !invoiceId) {
      return NextResponse.json(
        { error: "Missing required fields: paymentIntentId and invoiceId" },
        { status: 400 }
      )
    }

    // Retrieve the payment intent to verify status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: `Payment not completed. Status: ${paymentIntent.status}` },
        { status: 400 }
      )
    }

    // Verify the invoice ID matches
    if (paymentIntent.metadata.invoiceId !== invoiceId.toString()) {
      return NextResponse.json(
        { error: "Invoice ID mismatch" },
        { status: 400 }
      )
    }

    // Update the invoice status to paid
    await db
      .update(invoices)
      .set({
        status: "paid",
        paidAt: new Date().toISOString(),
        paymentMethod: "stripe",
        paymentReference: paymentIntentId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(invoices.id, invoiceId))

    return NextResponse.json({
      success: true,
      message: "Payment confirmed and invoice updated",
    })
  } catch (error) {
    console.error("Error confirming payment:", error)

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to confirm payment" },
      { status: 500 }
    )
  }
}
