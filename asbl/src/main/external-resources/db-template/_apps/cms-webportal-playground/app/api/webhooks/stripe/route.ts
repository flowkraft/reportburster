import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"

import { env } from "@/env.mjs"
import { db } from "@/lib/db"

const stripe = new Stripe(env.STRIPE_API_KEY, {
  apiVersion: "2024-12-18.acacia",
})

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get("Stripe-Signature") as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    )
  } catch (error) {
    return new NextResponse(
      `Webhook Error: ${error instanceof Error ? error.message : "Unknown Error"}`,
      { status: 400 }
    )
  }

  const session = event.data.object as Stripe.Checkout.Session

  if (event.type === "checkout.session.completed") {
    // Handle successful payment
    await db.user.update({
      where: {
        id: session?.metadata?.userId,
      },
      data: {
        stripeSubscriptionId: session?.subscription as string,
        stripeCustomerId: session?.customer as string,
        stripePriceId: session?.metadata?.stripePriceId,
        stripeCurrentPeriodEnd: new Date((session?.expires_at ?? 0) * 1000),
      },
    })
  }

  if (event.type === "invoice.payment_succeeded") {
    // Handle subscription renewal
    const invoice = event.data.object as Stripe.Invoice
    await db.user.update({
      where: {
        stripeSubscriptionId: session?.subscription as string,
      },
      data: {
        stripePriceId: session?.metadata?.stripePriceId,
        stripeCurrentPeriodEnd: new Date((invoice.period_end ?? 0) * 1000),
      },
    })
  }

  return new NextResponse(null, { status: 200 })
}
