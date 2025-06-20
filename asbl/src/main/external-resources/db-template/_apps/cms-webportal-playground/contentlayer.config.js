import { defineDocumentType, makeSource } from "contentlayer2/source-files"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeExternalLinks from "rehype-external-links"
import rehypePrettyCode from "rehype-pretty-code"
import rehypeSlug from "rehype-slug"
import codeImport from "remark-code-import"
import remarkGfm from "remark-gfm"
import { visit } from "unist-util-visit"

/** @type {import('contentlayer/source-files').ComputedFields} */
const computedFields = {
  slug: {
    type: "string",
    resolve: (doc) => `/${doc._raw.flattenedPath}`,
  },
  slugAsParams: {
    type: "string",
    resolve: (doc) => doc._raw.flattenedPath.split("/").slice(1).join("/"),
  },
}

export const Doc = defineDocumentType(() => ({
  name: "Doc",
  filePathPattern: `docs/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
    },
    description: {
      type: "string",
    },
    published: {
      type: "boolean",
      default: true,
    },
  },
  computedFields,
}))

export const Guide = defineDocumentType(() => ({
  name: "Guide",
  filePathPattern: `guides/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
    },
    description: {
      type: "string",
    },
    date: {
      type: "date",
      required: true,
    },
    published: {
      type: "boolean",
      default: true,
    },
    featured: {
      type: "boolean",
      default: false,
    },
  },
  computedFields,
}))

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: `blog/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
    },
    description: {
      type: "string",
    },
    date: {
      type: "date",
      required: true,
    },
    published: {
      type: "boolean",
      default: true,
    },
    image: {
      type: "string",
      required: true,
    },
    authors: {
      // Reference types are not embedded.
      // Until this is fixed, we can use a simple list.
      // type: "reference",
      // of: Author,
      type: "list",
      of: { type: "string" },
      required: true,
    },
  },
  computedFields,
}))

export const Author = defineDocumentType(() => ({
  name: "Author",
  filePathPattern: `authors/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
    },
    description: {
      type: "string",
    },
    avatar: {
      type: "string",
      required: true,
    },
    twitter: {
      type: "string",
      required: true,
    },
  },
  computedFields,
}))

export const Page = defineDocumentType(() => ({
  name: "Page",
  filePathPattern: `pages/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
    },
    description: {
      type: "string",
    },
  },
  computedFields,
}))

export default makeSource({
  contentDirPath: "./content",
  documentTypes: [Page, Doc, Guide, Post, Author],
  mdx: {
    remarkPlugins: [codeImport, remarkGfm],
    rehypePlugins: [
      // First visitor: Extract raw text from code blocks
      () => (tree) => {
        // Store raw text for each code block in a global map
        const rawTextMap = new Map()
        let codeBlockId = 0

        visit(tree, "element", (node) => {
          if (node.tagName === "pre") {
            const [codeEl] = node.children || []
            if (codeEl && codeEl.tagName === "code") {
              const textContent = codeEl.children?.[0]?.value || ""
              // Use a unique ID for each code block
              const id = `code-block-${codeBlockId++}`
              rawTextMap.set(id, textContent)
              // Store ID as property on node for later reference
              node.properties = node.properties || {}
              node.properties["data-code-id"] = id
              console.log(
                `Extracted raw code for ${id}: ${textContent.substring(0, 20)}...`
              )
            }
          }
        })

        // Save the map to the tree for use in later visitors
        tree.data = tree.data || {}
        tree.data.rawTextMap = rawTextMap
      },

      // Use rehype-pretty-code for syntax highlighting
      [
        rehypePrettyCode,
        {
          theme: "github-dark",
          showCopyButton: true,
        },
      ],

      // Second visitor: Forward raw text to pre elements after processing
      () => (tree) => {
        // Get the raw text map from the tree
        const rawTextMap = tree.data?.rawTextMap

        if (!rawTextMap) {
          console.log("No raw text map found in tree data")
          return
        }

        visit(tree, "element", (node) => {
          // Find the figure fragments created by rehype-pretty-code
          if (
            node.tagName === "figure" &&
            node.properties &&
            "data-rehype-pretty-code-figure" in node.properties
          ) {
            // Find pre elements inside the figure
            for (const child of node.children || []) {
              // The div wrapper created by our Pre component
              if (
                child.tagName === "div" &&
                child.properties?.className?.includes("relative")
              ) {
                for (const divChild of child.children || []) {
                  if (divChild.tagName === "pre") {
                    // Get original code ID from either the pre or the figure
                    const codeId = node.properties["data-code-id"]
                    if (codeId && rawTextMap.has(codeId)) {
                      // Add raw text as a property to the pre element
                      divChild.properties = divChild.properties || {}
                      divChild.properties.raw = rawTextMap.get(codeId)
                      console.log(
                        `Set raw property on pre element: ${divChild.properties.raw?.substring(0, 20)}...`
                      )
                    }
                  }
                }
              } else if (child.tagName === "pre") {
                // Direct pre child (no div wrapper yet)
                const codeId = node.properties["data-code-id"]
                if (codeId && rawTextMap.has(codeId)) {
                  child.properties = child.properties || {}
                  child.properties.raw = rawTextMap.get(codeId)
                  console.log(
                    `Set raw property directly on pre: ${child.properties.raw?.substring(0, 20)}...`
                  )
                }
              }
            }
          }
        })
      },

      // Remaining rehype plugins
      [
        rehypeAutolinkHeadings,
        {
          properties: {
            className: ["subheading-anchor"],
            ariaLabel: "Link to section",
          },
        },
      ],
      [
        rehypeExternalLinks,
        {
          target: "_blank", // Default behavior: opens in a new tab
          rel: ["noopener", "noreferrer"], // Recommended for security
          // You can also specify a condition if you only want certain links to be external
          // content: { type: 'text', value: ' 🔗' }, // Optional: append an icon/text to external links
        },
      ],
      rehypeSlug,
    ],
  },
})
