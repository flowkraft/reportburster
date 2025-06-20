import { notFound } from "next/navigation"
import { allDocs } from "contentlayer2/generated"

import { getTableOfContents } from "@/lib/toc"
import { Mdx } from "@/components/mdx-components"
import { DocsPageHeader } from "@/components/page-header"
import { DocsPager } from "@/components/pager"
import { DashboardTableOfContents } from "@/components/toc"

import "@/styles/mdx.css"

import type { Metadata } from "next"

import { env } from "@/env.mjs"
import { absoluteUrl } from "@/lib/utils"

// Updated interface to match Next.js 15 expectations
interface PageParams extends Promise<{ slug?: string[] }> {} // slug now optional

async function getDocFromParams(params: PageParams) {
  const resolvedParams = await params
  const slugArr = resolvedParams.slug || [] // handle undefined by using an empty array
  const slug = slugArr.join("/") || ""
  const doc = allDocs.find((doc) => doc.slugAsParams === slug)
  if (!doc) return null
  return doc
}

export async function generateMetadata({
  params,
}: {
  params: PageParams
}): Promise<Metadata> {
  const doc = await getDocFromParams(params)
  if (!doc) return {}

  const url = env.NEXT_PUBLIC_APP_URL
  const ogUrl = new URL(`${url}/api/og`)
  ogUrl.searchParams.set("heading", doc.description ?? doc.title)
  ogUrl.searchParams.set("type", "Documentation")
  ogUrl.searchParams.set("mode", "dark")

  return {
    title: doc.title,
    description: doc.description,
    openGraph: {
      title: doc.title,
      description: doc.description,
      type: "article",
      url: absoluteUrl(doc.slug),
      images: [
        {
          url: ogUrl.toString(),
          width: 1200,
          height: 630,
          alt: doc.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: doc.title,
      description: doc.description,
      images: [ogUrl.toString()],
    },
  }
}

export async function generateStaticParams(): Promise<{ slug?: string[] }[]> {
  return allDocs.map((doc) => ({
    slug: doc.slugAsParams ? doc.slugAsParams.split("/") : [],
  }))
}

interface PageProps {
  params: PageParams
}

export default async function DocPage({ params }: PageProps) {
  const doc = await getDocFromParams(params)
  if (!doc) {
    notFound()
  }

  const toc = await getTableOfContents(doc.body.raw)

  return (
    <main className="relative py-6 lg:gap-10 lg:py-10 xl:grid xl:grid-cols-[1fr_300px]">
      <div className="mx-auto w-full min-w-0">
        <DocsPageHeader heading={doc.title} text={doc.description} />
        <Mdx code={doc.body.code} />
        <hr className="my-4 md:my-6" />
        <DocsPager doc={doc} />
      </div>
      {/*
      Uncomment below to show the table of contents:
      <div className="hidden text-sm xl:block">
        <div className="sticky top-16 -mt-10 max-h-[calc(var(--vh)-4rem)] overflow-y-auto pt-10">
          <DashboardTableOfContents toc={toc} />
        </div>
      </div>
      */}
    </main>
  )
}
