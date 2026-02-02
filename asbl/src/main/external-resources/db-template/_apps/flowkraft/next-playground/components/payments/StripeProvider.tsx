"use client"

import { Elements } from "@stripe/react-stripe-js"
import { loadStripe, Stripe } from "@stripe/stripe-js"
import { ReactNode, useEffect, useState } from "react"

// Initialize Stripe with publishable key
let stripePromise: Promise<Stripe | null> | null = null

const getStripe = () => {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!key) {
      console.warn("Stripe publishable key not configured")
      return null
    }
    stripePromise = loadStripe(key)
  }
  return stripePromise
}

interface StripeProviderProps {
  children: ReactNode
  clientSecret?: string
}

export function StripeProvider({ children, clientSecret }: StripeProviderProps) {
  const [stripe, setStripe] = useState<Promise<Stripe | null> | null>(null)

  useEffect(() => {
    setStripe(getStripe())
  }, [])

  if (!stripe) {
    return <>{children}</>
  }

  const options = clientSecret
    ? {
        clientSecret,
        appearance: {
          theme: "stripe" as const,
          variables: {
            colorPrimary: "#0070f3",
          },
        },
      }
    : undefined

  return (
    <Elements stripe={stripe} options={options}>
      {children}
    </Elements>
  )
}
