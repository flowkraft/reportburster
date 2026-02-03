"use client"

import { useEffect, useState } from "react"
import Script from "next/script"

// URL for the ReportBurster web components script
const RB_WEBCOMPONENTS_URL = process.env.NEXT_PUBLIC_RB_API_BASE_URL
  ? `${process.env.NEXT_PUBLIC_RB_API_BASE_URL}/rb-webcomponents/rb-webcomponents.umd.js`
  : "http://localhost:9090/rb-webcomponents/rb-webcomponents.umd.js"

/**
 * RbWebComponentsLoader
 * 
 * Loads the ReportBurster web components script globally.
 * Also sets up the window.rbConfig object needed by the components.
 * 
 * This should be included in the root layout to ensure the script
 * is loaded once and available to all pages.
 */
export function RbWebComponentsLoader() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Set up the rbConfig object that web components need
    const apiBaseUrl = process.env.NEXT_PUBLIC_RB_API_BASE_URL || "http://localhost:9090"
    const apiKey = process.env.NEXT_PUBLIC_RB_API_KEY || "123"
    
    // @ts-expect-error - Global window extension
    window.rbConfig = {
      apiBaseUrl,
      apiKey,
    }
  }, [])

  return (
    <Script
      src={RB_WEBCOMPONENTS_URL}
      strategy="afterInteractive"
      onLoad={() => {
        console.log("ReportBurster web components loaded successfully")
        setIsLoaded(true)
        // Dispatch a custom event that pages can listen for
        window.dispatchEvent(new CustomEvent("rb-components-loaded"))
      }}
      onError={(e) => {
        console.error("Failed to load ReportBurster web components:", e)
      }}
    />
  )
}
