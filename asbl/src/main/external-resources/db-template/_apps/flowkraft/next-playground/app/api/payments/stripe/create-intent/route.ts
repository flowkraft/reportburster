import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { db, invoices } from "@/lib/db"
import { eq } from "drizzle-orm"

// Lazy initialization to avoid build-time errors
let stripe: Stripe | null = null
function getStripe() {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  }
  return stripe
}

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, amount, currency } = await request.json()

    if (!invoiceId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: invoiceId and amount" },
        { status: 400 }
      )
    }

    // Verify the invoice exists and is unpaid
    const invoice = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1)

    if (invoice.length === 0) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      )
    }

    if (invoice[0].status === "paid") {
      return NextResponse.json(
        { error: "Invoice is already paid" },
        { status: 400 }
      )
    }

    // Create a PaymentIntent with Stripe
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(amount), // Amount in cents
      currency: currency?.toLowerCase() || "usd",
      metadata: {
        invoiceId: invoiceId.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    )
  }
}
