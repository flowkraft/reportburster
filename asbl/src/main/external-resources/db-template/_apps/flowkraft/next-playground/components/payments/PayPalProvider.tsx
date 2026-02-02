"use client"

import { PayPalScriptProvider, PayPalScriptOptions } from "@paypal/react-paypal-js"
import { ReactNode } from "react"

interface PayPalProviderProps {
  children: ReactNode
}

export function PayPalProvider({ children }: PayPalProviderProps) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID

  if (!clientId) {
    console.warn("PayPal client ID not configured")
    return <>{children}</>
  }

  const initialOptions: PayPalScriptOptions = {
    clientId,
    currency: "USD",
    intent: "capture",
  }

  return (
    <PayPalScriptProvider options={initialOptions}>
      {children}
    </PayPalScriptProvider>
  )
}
