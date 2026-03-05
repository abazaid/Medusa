import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BLOG_MODULE } from "../../../modules/blog"

const cleanText = (value?: unknown) =>
  typeof value === "string" ? value.trim() : ""

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const blogService = req.scope.resolve(BLOG_MODULE) as any
  const q = cleanText((req.query as any)?.q).toLowerCase()
  const localeParam = cleanText((req.query as any)?.locale).toLowerCase()
  const locale = localeParam === "en" ? "en" : "ar"
  const take = Math.min(Number((req.query as any)?.limit || 30), 100)

  const posts = await blogService.listPosts(
    {
      status: "published",
    },
    {
      take: Number.isFinite(take) ? take : 30,
      order: {
        published_at: "DESC",
        created_at: "DESC",
      },
    } as any
  )

  const filtered = (posts || []).filter((post: any) => {
    if (!q) return true

    const searchText = [
      post.title_ar,
      post.title_en,
      post.excerpt_ar,
      post.excerpt_en,
      post.handle,
    ]
      .map((value) => cleanText(value).toLowerCase())
      .join(" ")

    return searchText.includes(q)
  })

  const normalized = filtered.map((post: any) => ({
    id: post.id,
    handle: post.handle,
    status: post.status,
    title: locale === "en" ? cleanText(post.title_en) || cleanText(post.title_ar) : cleanText(post.title_ar) || cleanText(post.title_en),
    excerpt:
      locale === "en" ? cleanText(post.excerpt_en) || cleanText(post.excerpt_ar) : cleanText(post.excerpt_ar) || cleanText(post.excerpt_en),
    content:
      locale === "en" ? cleanText(post.content_en) || cleanText(post.content_ar) : cleanText(post.content_ar) || cleanText(post.content_en),
    cover_image: cleanText(post.cover_image),
    meta_title:
      locale === "en"
        ? cleanText(post.meta_title_en) || cleanText(post.meta_title_ar)
        : cleanText(post.meta_title_ar) || cleanText(post.meta_title_en),
    meta_description:
      locale === "en"
        ? cleanText(post.meta_description_en) || cleanText(post.meta_description_ar)
        : cleanText(post.meta_description_ar) || cleanText(post.meta_description_en),
    canonical_url: cleanText(post.canonical_url),
    published_at: cleanText(post.published_at),
    created_at: post.created_at,
    updated_at: post.updated_at,
  }))

  res.status(200).json({
    posts: normalized,
  })
}
