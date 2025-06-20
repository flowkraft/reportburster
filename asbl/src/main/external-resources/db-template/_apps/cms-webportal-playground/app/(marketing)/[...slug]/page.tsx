import { notFound } from "next/navigation"
import { allPages, Page } from "contentlayer2/generated" // Assuming 'Page' is the type from contentlayer

import { Mdx } from "@/components/mdx-components"

import "@/styles/mdx.css"

import { Metadata } from "next"

import { env } from "@/env.mjs"
import { siteConfig } from "@/config/site"
import { absoluteUrl } from "@/lib/utils"

// Define a type for the resolved parameters
type ResolvedPageParams = {
  slug: string[]
}

// Update PageProps so params is a Promise of ResolvedPageParams
interface PageProps {
  params: Promise<ResolvedPageParams>
}

// Modify getPageFromParams to accept resolved parameters
// It's good practice to type the return value as well
async function getPageFromParams(
  resolvedParams: ResolvedPageParams | null
): Promise<Page | null> {
  // Guard against resolvedParams or resolvedParams.slug being null/undefined.
  if (!resolvedParams || !resolvedParams.slug) {
    return null
  }

  const slug = resolvedParams.slug.join("/")
  // Ensure 'allPages' elements conform to a type that includes 'slugAsParams'
  const page = allPages.find((p: Page) => p.slugAsParams === slug)

  if (!page) {
    return null // Correctly return null if no page is found
  }

  return page
}

export async function generateMetadata({
  params: paramsPromise, // Rename for clarity, this is the Promise
}: PageProps): Promise<Metadata> {
  const resolvedParams = await paramsPromise // Await the params prop
  const page = await getPageFromParams(resolvedParams)

  if (!page) {
    return {}
  }

  const url = env.NEXT_PUBLIC_APP_URL

  const ogUrl = new URL(`${url}/api/og`)
  ogUrl.searchParams.set("heading", page.title)
  ogUrl.searchParams.set("type", siteConfig.name)
  ogUrl.searchParams.set("mode", "light")

  return {
    title: page.title,
    description: page.description,
    openGraph: {
      title: page.title,
      description: page.description,
      type: "article",
      url: absoluteUrl(page.slug), // Ensure 'page.slug' exists and is the correct URL path
      images: [
        {
          url: ogUrl.toString(),
          width: 1200,
          height: 630,
          alt: page.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [ogUrl.toString()],
    },
  }
}

// Ensure generateStaticParams returns an array of resolved parameter shapes
export async function generateStaticParams(): Promise<ResolvedPageParams[]> {
  return allPages.map((page: Page) => ({
    // Assuming 'Page' type for elements in allPages
    slug: page.slugAsParams.split("/"),
  }))
}

export default async function PagePage({ params: paramsPromise }: PageProps) {
  // Rename for clarity
  const resolvedParams = await paramsPromise // Await the params prop
  const page = await getPageFromParams(resolvedParams)

  if (!page) {
    notFound()
  }

  return (
    <article className="container max-w-3xl py-6 lg:py-12">
      <div className="space-y-4">
        <h1 className="inline-block font-heading text-4xl lg:text-5xl">
          {page.title}
        </h1>
        {page.description && (
          <p className="text-xl text-muted-foreground">{page.description}</p>
        )}
      </div>
      <hr className="my-4" />
      <Mdx code={page.body.code} />
    </article>
  )
}
