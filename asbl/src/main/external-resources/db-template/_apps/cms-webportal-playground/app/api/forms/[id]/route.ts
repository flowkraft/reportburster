import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { db } from "@/lib/db"

const corsHeaders = {
  development: {
    "Access-Control-Allow-Origin": "http://localhost:5173", // or your dev domain
    "Access-Control-Allow-Methods": "GET, OPTIONS, DELETE, PATCH",
    "Access-Control-Allow-Headers": "*",
  },
  production: {
    "Access-Control-Allow-Origin": "https://refine-admin.bkstg.flowkraft.com",
    "Access-Control-Allow-Methods": "GET, OPTIONS, DELETE, PATCH",
    "Access-Control-Allow-Headers": "*",
  },
}

const getCurrentCorsHeaders = () => {
  return process.env.NODE_ENV === "development"
    ? corsHeaders.development
    : corsHeaders.production
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: getCurrentCorsHeaders() })
}

interface RouteParams extends Promise<{ id: string }> {}

export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const resolvedParams = await params
    const form = await db.form.findUnique({
      where: { id: Number(resolvedParams.id) },
    })

    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404, headers: getCurrentCorsHeaders() }
      )
    }

    return NextResponse.json(form, { headers: getCurrentCorsHeaders() })
  } catch (error) {
    console.error("Database Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: getCurrentCorsHeaders() }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const resolvedParams = await params
    const { status } = await request.json()

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400, headers: getCurrentCorsHeaders() }
      )
    }

    const updatedForm = await db.form.update({
      where: { id: Number(resolvedParams.id) },
      data: {
        status,
        updatedAt: new Date(), // Use updatedAt according to Prisma schema
      },
    })

    return NextResponse.json(updatedForm, { headers: getCurrentCorsHeaders() })
  } catch (error) {
    console.error("Database Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: getCurrentCorsHeaders() }
    )
  }
}
