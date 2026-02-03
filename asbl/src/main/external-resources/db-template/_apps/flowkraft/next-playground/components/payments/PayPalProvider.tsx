"use client"

import { PayPalScriptProvider, ReactPayPalScriptOptions } from "@paypal/react-paypal-js"
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

  const initialOptions: ReactPayPalScriptOptions = {
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
