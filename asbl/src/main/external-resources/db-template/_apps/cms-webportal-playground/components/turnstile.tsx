import { useEffect } from "react"

// Extend the Window interface to include onTurnstileSuccess.
declare global {
  interface Window {
    onTurnstileSuccess: (token: string) => void
  }
}

export default function Turnstile({
  onVerify,
}: {
  onVerify: (token: string) => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      onVerify("dev-token")
      return
    }

    // Set up the global callback for Cloudflare Turnstile.
    window.onTurnstileSuccess = (token: string) => {
      onVerify(token)
    }

    // Always add the script with a random query parameter to avoid caching issues.
    const script = document.createElement("script")
    script.src = `https://challenges.cloudflare.com/turnstile/v0/api.js`
    script.async = true
    document.body.appendChild(script)

    // Cleanup: remove the script when component is unmounted to avoid duplicates.
    return () => {
      document.body.removeChild(script)
    }
  }, [onVerify])

  if (process.env.NODE_ENV === "development") {
    return null
  }

  return (
    <div
      id="cf-turnstile"
      className="cf-turnstile"
      data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      data-callback="onTurnstileSuccess"
    />
  )
}
