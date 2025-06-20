import { NextResponse } from "next/server"

export async function POST(request: Request) {
  // Parse the request body to get the token
  const { token } = await request.json()

  // Get the secret key from environment variables
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  // Verify the token with Cloudflare's API
  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    }
  )

  // Parse the response from Cloudflare
  const data = await response.json()

  // Check if the verification was successful
  if (data.success) {
    return NextResponse.json({ success: true })
  } else {
    // Return an error if verification failed
    return NextResponse.json(
      { success: false, error: "CAPTCHA verification failed" },
      { status: 400 }
    )
  }
}
