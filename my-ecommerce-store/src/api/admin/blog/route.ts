import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BLOG_MODULE } from "../../../modules/blog"

type BlogPostInput = {
  handle?: string
  status?: string
  title_ar?: string
  title_en?: string
  excerpt_ar?: string
  excerpt_en?: string
  content_ar?: string
  content_en?: string
  cover_image?: string
  meta_title_ar?: string
  meta_title_en?: string
  meta_description_ar?: string
  meta_description_en?: string
  canonical_url?: string
  published_at?: string
}

const cleanText = (value?: unknown) =>
  typeof value === "string" ? value.trim() : ""

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")

const normalizeHandle = (value: string, fallback: string) => {
  const fromValue = slugify(value)
  if (fromValue) return fromValue
  return slugify(fallback) || `post-${Date.now()}`
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const blogService = req.scope.resolve(BLOG_MODULE) as any
  const q = cleanText((req.query as any)?.q).toLowerCase()
  const status = cleanText((req.query as any)?.status).toLowerCase()

  const posts = await blogService.listPosts(
    {},
    {
      order: {
        published_at: "DESC",
        created_at: "DESC",
      },
      take: 500,
    } as any
  )

  const filtered = (posts || []).filter((post: any) => {
    if (status && status !== "all" && cleanText(post.status).toLowerCase() !== status) {
      return false
    }

    if (!q) return true

    const searchText = [
      post.title_ar,
      post.title_en,
      post.handle,
      post.excerpt_ar,
      post.excerpt_en,
    ]
      .map((value) => cleanText(value).toLowerCase())
      .join(" ")

    return searchText.includes(q)
  })

  res.status(200).json({
    posts: filtered,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const blogService = req.scope.resolve(BLOG_MODULE) as any
  const body = (req.body || {}) as BlogPostInput

  const titleAr = cleanText(body.title_ar)
  const titleEn = cleanText(body.title_en)

  if (!titleAr && !titleEn) {
    res.status(400).json({ message: "title_ar or title_en is required." })
    return
  }

  const baseTitle = titleAr || titleEn
  const handle = normalizeHandle(cleanText(body.handle), baseTitle)
  const existing = await blogService.listPosts(
    {
      handle,
    },
    { take: 1 } as any
  )

  if (existing?.length) {
    res.status(409).json({ message: "Handle already exists." })
    return
  }

  const nowIso = new Date().toISOString()
  const status = cleanText(body.status) || "draft"
  const publishedAt =
    status === "published" ? cleanText(body.published_at) || nowIso : ""

  const created = await blogService.createPosts({
    handle,
    status,
    title_ar: titleAr,
    title_en: titleEn,
    excerpt_ar: cleanText(body.excerpt_ar),
    excerpt_en: cleanText(body.excerpt_en),
    content_ar: cleanText(body.content_ar),
    content_en: cleanText(body.content_en),
    cover_image: cleanText(body.cover_image),
    meta_title_ar: cleanText(body.meta_title_ar) || titleAr,
    meta_title_en: cleanText(body.meta_title_en) || titleEn,
    meta_description_ar: cleanText(body.meta_description_ar),
    meta_description_en: cleanText(body.meta_description_en),
    canonical_url: cleanText(body.canonical_url),
    published_at: publishedAt,
    created_by: "admin",
    updated_by: "admin",
  })

  res.status(201).json({
    post: created,
  })
}
