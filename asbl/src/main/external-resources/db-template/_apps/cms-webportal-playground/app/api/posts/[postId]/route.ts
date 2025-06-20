import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import * as z from "zod"

import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { postPatchSchema } from "@/lib/validations/post"

const routeContextSchema = z.object({
  params: z.object({
    postId: z.string(),
  }),
})

interface RouteParams extends Promise<{ postId: string }> {}

export async function DELETE(
  req: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const resolvedParams = await params

    // Check if the user has access to this post.
    if (!(await verifyCurrentUserHasAccessToPost(resolvedParams.postId))) {
      return new NextResponse(null, { status: 403 })
    }

    await db.post.delete({
      where: {
        id: resolvedParams.postId,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const resolvedParams = await params
    const json = await req.json()
    const body = postPatchSchema.parse(json)

    // Check if the user has access to this post.
    if (!(await verifyCurrentUserHasAccessToPost(resolvedParams.postId))) {
      return new NextResponse(null, { status: 403 })
    }

    await db.post.update({
      where: {
        id: resolvedParams.postId,
      },
      data: {
        title: body.title,
        content: body.content,
      },
    })

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}

async function verifyCurrentUserHasAccessToPost(postId: string) {
  const session = await getServerSession(authOptions)
  const count = await db.post.count({
    where: {
      id: postId,
      authorId: session?.user.id,
    },
  })

  return count > 0
}
