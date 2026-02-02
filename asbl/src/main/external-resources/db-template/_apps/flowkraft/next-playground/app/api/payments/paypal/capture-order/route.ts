import { NextRequest, NextResponse } from "next/server"
import { db, invoices } from "@/lib/db"
import { eq } from "drizzle-orm"

const PAYPAL_API_BASE = process.env.PAYPAL_SANDBOX === "true"
  ? "https://api-m.sandbox.paypal.com"
  : "https://api-m.paypal.com"

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured")
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body: "grant_type=client_credentials",
  })

  if (!response.ok) {
    const error = await response.text()
    console.error("PayPal auth error:", error)
    throw new Error("Failed to authenticate with PayPal")
  }

  const data = await response.json()
  return data.access_token
}

export async function POST(request: NextRequest) {
  try {
    const { orderId, invoiceId } = await request.json()

    if (!orderId || !invoiceId) {
      return NextResponse.json(
        { error: "Missing required fields: orderId and invoiceId" },
        { status: 400 }
      )
    }

    const accessToken = await getPayPalAccessToken()

    // Capture the order
    const response = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error("PayPal capture error:", error)
      throw new Error(error.message || "Failed to capture PayPal payment")
    }

    const captureData = await response.json()

    // Verify the payment was completed
    if (captureData.status !== "COMPLETED") {
      return NextResponse.json(
        { error: `Payment not completed. Status: ${captureData.status}` },
        { status: 400 }
      )
    }

    // Verify the invoice ID matches from purchase units
    const purchaseUnit = captureData.purchase_units?.[0]
    if (purchaseUnit?.reference_id !== invoiceId.toString()) {
      console.warn("Invoice ID mismatch in PayPal order")
    }

    // Get the capture ID for reference
    const captureId = purchaseUnit?.payments?.captures?.[0]?.id

    // Update the invoice status to paid
    await db
      .update(invoices)
      .set({
        status: "paid",
        paidAt: new Date().toISOString(),
        paymentMethod: "paypal",
        paymentReference: captureId || orderId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(invoices.id, invoiceId))

    return NextResponse.json({
      success: true,
      message: "Payment captured and invoice updated",
      captureId,
    })
  } catch (error) {
    console.error("Error capturing PayPal payment:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to capture payment" },
      { status: 500 }
    )
  }
}
