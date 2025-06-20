import { notFound, redirect } from "next/navigation"
import { Post, User } from "@prisma/client"

import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"
import { Editor } from "@/components/editor"

async function getPostForUser(postId: Post["id"], userId: User["id"]) {
  return await db.post.findFirst({
    where: {
      id: postId,
      authorId: userId,
    },
  })
}

interface EditorPageParams extends Promise<{ postId: string }> {}

interface EditorPageProps {
  params: EditorPageParams
}

export default async function EditorPage({ params }: EditorPageProps) {
  const resolvedParams = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect(authOptions?.pages?.signIn || "/login")
  }

  const post = await getPostForUser(resolvedParams.postId, user.id)

  if (!post) {
    notFound()
  }

  return (
    <Editor
      post={{
        id: post.id,
        title: post.title,
        content: post.content,
        published: post.published,
      }}
    />
  )
}
