import { revalidatePath } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

const normalizeLocale = (value?: string | null) =>
  value?.toLowerCase() === "en" ? "en" : "ar"

const clean = (value?: string | null) => (value || "").trim()

const slugifyEnglish = (value: string) =>
  clean(value)
    .normalize("NFKD")
    .replace(/[\u0600-\u06FF]/g, " ")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")

const getMetadataString = (
  metadata: Record<string, unknown>,
  keys: string[]
) => {
  for (const key of keys) {
    const value = metadata[key]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return ""
}

const getProductSlug = (product: {
  title?: string | null
  handle?: string | null
  metadata?: Record<string, unknown> | null
}) => {
  const metadata = product.metadata || {}
  const preferred = getMetadataString(metadata, [
    "slug_en",
    "product_slug_en",
    "handle_en",
    "product_slug",
    "slug",
  ])

  if (preferred) {
    return slugifyEnglish(preferred)
  }

  const fromHandle = slugifyEnglish(product.handle || "")
  if (fromHandle) {
    return fromHandle
  }

  return slugifyEnglish(product.title || "")
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.STOREFRONT_REVALIDATE_SECRET
    const authHeader = req.headers.get("x-revalidate-secret")

    if (!secret || authHeader !== secret) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = (await req.json().catch(() => ({}))) as {
      product?: {
        title?: string | null
        handle?: string | null
        metadata?: Record<string, unknown> | null
      }
      locales?: string[]
    }

    if (!body.product) {
      return NextResponse.json(
        { message: "Missing product payload." },
        { status: 400 }
      )
    }

    const locales =
      Array.isArray(body.locales) && body.locales.length
        ? Array.from(new Set(body.locales.map((locale) => normalizeLocale(locale))))
        : ["ar"]

    const slug = getProductSlug(body.product)

    if (!slug) {
      return NextResponse.json(
        { message: "Unable to resolve product slug." },
        { status: 400 }
      )
    }

    for (const locale of locales) {
      revalidatePath(`/${locale}/products/${encodeURIComponent(slug)}`)
      revalidatePath(`/${locale}/store`)
    }

    return NextResponse.json({ revalidated: true, slug, locales })
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to revalidate SEO.",
      },
      { status: 500 }
    )
  }
}
