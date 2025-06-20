export async function verifyTurnstileToken(token: string) {
  if (process.env.NODE_ENV === "development") {
    console.log("Development mode: Turnstile verification bypassed")
    return true
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    }
  )

  const data = await response.json()
  return data.success
}

export const validateApiKey = async () => {
  if (process.env.NODE_ENV === "development") return true
  const { headers } = await import("next/headers")
  const headersList = await headers()
  const apiKey = headersList.get("x-api-key")
  return apiKey === process.env.API_KEY
}

let cachedToken: string | null = null
let tokenExpiry: Date | null = null

export async function getMauticToken(): Promise<string> {
  if (cachedToken && tokenExpiry && tokenExpiry > new Date()) {
    return cachedToken
  }

  const clientId = process.env.MAUTIC_CLIENT_ID?.trim()
  const clientSecret = process.env.MAUTIC_CLIENT_SECRET?.trim()

  const params = new URLSearchParams({
    client_id: clientId!,
    client_secret: clientSecret!,
    grant_type: "client_credentials",
  })

  console.log("Token request:", {
    url: "https://m.cfsf.flowkraft.com/oauth/v2/token",
    params: params.toString(),
  })

  const response = await fetch("https://m.cfsf.flowkraft.com/oauth/v2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Mautic token error details:", {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      url: response.url,
    })
    throw new Error(
      `Failed to get Mautic token: ${response.status} ${errorText}`
    )
  }

  const data = await response.json()
  const token = data.access_token as string

  if (!token) {
    throw new Error("No access token received from Mautic")
  }

  cachedToken = token
  tokenExpiry = new Date(Date.now() + data.expires_in * 1000)

  return token
}
