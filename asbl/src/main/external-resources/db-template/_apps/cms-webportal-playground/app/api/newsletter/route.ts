import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const data = await req.json()

    const response = await fetch(
      "https://m.cfsf.flowkraft.com/api/contacts/new",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    )

    if (!response.ok) {
      throw new Error("Failed to subscribe")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 })
  }
}
