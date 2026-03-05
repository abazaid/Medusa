import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BLOG_MODULE } from "../../../../modules/blog"

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
  const id = req.params.id

  const [post] = await blogService.listPosts({ id }, { take: 1 } as any)

  if (!post) {
    res.status(404).json({ message: "Post not found." })
    return
  }

  res.status(200).json({ post })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const blogService = req.scope.resolve(BLOG_MODULE) as any
  const id = req.params.id
  const body = (req.body || {}) as BlogPostInput

  const [post] = await blogService.listPosts({ id }, { take: 1 } as any)

  if (!post) {
    res.status(404).json({ message: "Post not found." })
    return
  }

  const titleAr = cleanText(body.title_ar) || cleanText(post.title_ar)
  const titleEn = cleanText(body.title_en) || cleanText(post.title_en)
  const baseTitle = titleAr || titleEn || cleanText(post.title_ar) || cleanText(post.title_en)
  const handle = normalizeHandle(cleanText(body.handle) || cleanText(post.handle), baseTitle)

  const existingSameHandle = await blogService.listPosts(
    {
      handle,
    },
    {
      take: 10,
    } as any
  )

  const hasConflict = (existingSameHandle || []).some((item: any) => item.id !== id)
  if (hasConflict) {
    res.status(409).json({ message: "Handle already exists." })
    return
  }

  const nextStatus = cleanText(body.status) || cleanText(post.status) || "draft"
  const nextPublishedAt =
    nextStatus === "published"
      ? cleanText(body.published_at) || cleanText(post.published_at) || new Date().toISOString()
      : ""

  const updated = await blogService.updatePosts({
    id,
    handle,
    status: nextStatus,
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
    published_at: nextPublishedAt,
    updated_by: "admin",
  })

  res.status(200).json({
    post: updated,
  })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const blogService = req.scope.resolve(BLOG_MODULE) as any
  const id = req.params.id

  const [post] = await blogService.listPosts({ id }, { take: 1 } as any)
  if (!post) {
    res.status(404).json({ message: "Post not found." })
    return
  }

  await blogService.deletePosts(id)
  res.status(200).json({ id })
}
