import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import * as z from "zod"

import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

const routeContextSchema = z.object({
  params: z.object({
    userId: z.string(),
  }),
})

interface RouteParams extends Promise<{ userId: string }> {}

export async function PATCH(
  req: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const resolvedParams = await params
    const json = await req.json()
    const session = await getServerSession(authOptions)

    if (!session?.user || resolvedParams.userId !== session?.user.id) {
      return new NextResponse(null, { status: 403 })
    }

    // Handle user update logic
    const user = await db.user.update({
      where: {
        id: resolvedParams.userId,
      },
      data: {
        name: json.name,
        email: json.email,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}
