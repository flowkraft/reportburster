import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

const corsHeaders = {
  development: {
    "Access-Control-Allow-Origin": "http://localhost:5173",
    "Access-Control-Allow-Methods": "GET, OPTIONS, DELETE",
    "Access-Control-Allow-Headers": "*",
  },
  production: {
    "Access-Control-Allow-Origin": "https://refine-admin.bkstg.flowkraft.com",
    "Access-Control-Allow-Methods": "GET, OPTIONS, DELETE",
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

export async function GET(request: NextRequest) {
  try {
    //console.log("GET request URL:", request.url)
    const { searchParams } = new URL(request.url)

    const start = Number(searchParams.get("_start") || 0)
    const end = Number(searchParams.get("_end") || 25)
    const form_type = searchParams.get("form_type")
    const id = searchParams.get("id")

    //console.log("Search params:", { start, end, form_type, id })

    // Single record fetch
    if (id) {
      //console.log("Fetching single record with ID:", id)
      const form = await db.form.findUnique({
        where: { id: Number(id) },
      })

      if (!form) {
        //console.log("Form not found for ID:", id)
        return NextResponse.json(
          { error: "Form not found" },
          { status: 404, headers: getCurrentCorsHeaders() }
        )
      }

      //console.log("Found form:", form)
      return NextResponse.json(form, { headers: getCurrentCorsHeaders() })
    }

    // List records
    //console.log("Fetching list with params:", {
    //  form_type,
    //  skip: start,
    //  take: end - start,
    //})

    // Debug the where clause
    const whereClause = form_type ? { formType: form_type } : undefined
    //console.log("Where clause:", whereClause)

    const [forms, total] = await Promise.all([
      db.form.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip: Math.max(0, start - 1), // Adjust skip to handle 1-based indexing
        take: end - start + 1, // Adjust take to include the end record
      }),
      db.form.count({
        where: whereClause,
      }),
    ])

    //console.log("Query results:", {
    //  totalRecords: total,
    //  recordsReturned: forms.length,
    //  firstRecord: forms[0],
    //  whereClause,
    //  skip: Math.max(0, start - 1),
    //  take: end - start + 1,
    //})

    const headers = {
      ...getCurrentCorsHeaders(),
      "Content-Range": `Form ${start}-${end}/${total}`,
      "X-Total-Count": total.toString(),
    }

    //console.log("Response headers:", headers)

    return NextResponse.json(forms, { headers })
  } catch (error) {
    //console.error("GET Error:", {
    //  name: error?.name,
    //  message: error?.message,
    //  stack: error?.stack,
    //})

    const errorResponse = {
      status: 500,
      headers: getCurrentCorsHeaders(),
    }
    //console.log("Error response:", errorResponse)

    return NextResponse.json([], errorResponse)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch (error) {
      //console.error("Error parsing request body:", error)
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400, headers: getCurrentCorsHeaders() }
      )
    }

    //console.log("DELETE request body:", body)
    const { ids } = body

    if (!ids) {
      return NextResponse.json(
        { error: "No ids provided" },
        { status: 400, headers: getCurrentCorsHeaders() }
      )
    }

    //console.log("Deleting form(s) with IDs:", ids)

    if (Array.isArray(ids)) {
      // Bulk delete
      const deletedForms = await db.form.deleteMany({
        where: {
          id: {
            in: ids.map(Number),
          },
        },
      })

      //console.log("Deleted forms:", deletedForms)
      return NextResponse.json(deletedForms, {
        headers: getCurrentCorsHeaders(),
      })
    } else {
      // Single delete
      const deletedForm = await db.form.delete({
        where: { id: Number(ids) },
      })

      //console.log("Deleted form:", deletedForm)
      return NextResponse.json(deletedForm, {
        headers: getCurrentCorsHeaders(),
      })
    }
  } catch (error) {
    //console.error("DELETE Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: getCurrentCorsHeaders() }
    )
  }
}
