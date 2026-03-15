import { listBlogPosts } from "@lib/data/blog"
import { listProducts } from "@lib/data/products"
import { getBaseURL } from "@lib/util/env"
import { getProductSlug } from "@lib/util/slug"

const LOCALES = ["ar"] as const
const STORE_COUNTRY_CODE = "sa"

const xmlEscape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")

const toISODate = (value?: string | Date | null) => {
  if (!value) return new Date().toISOString()
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

const listProductsWithImages = async () => {
  const products: any[] = []
  let page = 1

  while (true) {
    const { response, nextPage } = await listProducts({
      countryCode: STORE_COUNTRY_CODE,
      pageParam: page,
      disableCache: true,
      queryParams: {
        limit: 100,
        fields: "handle,title,metadata,thumbnail,updated_at",
      },
    })

    products.push(...response.products)

    if (!nextPage) break
    page = nextPage
  }

  return products
}

const renderImageSitemapXml = (entries: Array<{
  loc: string
  lastmod: string
  images: string[]
}>) => {
  const rows = entries
    .map((entry) => {
      const imageRows = entry.images
        .map(
          (image) =>
            `<image:image><image:loc>${xmlEscape(image)}</image:loc></image:image>`
        )
        .join("")

      return `<url><loc>${xmlEscape(entry.loc)}</loc><lastmod>${xmlEscape(
        entry.lastmod
      )}</lastmod>${imageRows}</url>`
    })
    .join("")

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${rows}</urlset>`
  )
}

export async function GET() {
  const baseUrl = getBaseURL()

  const [products, blogPosts] = await Promise.all([
    listProductsWithImages().catch(() => []),
    listBlogPosts({ locale: "ar", limit: 200 }).catch(() => []),
  ])

  const productEntries = LOCALES.flatMap((locale) =>
    (products || [])
      .filter((product) => !!product.thumbnail)
      .map((product) => ({
        loc: `${baseUrl}/${locale}/products/${encodeURIComponent(
          getProductSlug(product, locale)
        )}`,
        lastmod: toISODate(product.updated_at),
        images: product.thumbnail ? [product.thumbnail] : [],
      }))
  )

  const blogEntries = LOCALES.flatMap((locale) =>
    blogPosts
      .filter((post) => !!post.handle && !!post.cover_image)
      .map((post) => ({
        loc: `${baseUrl}/${locale}/blog/${encodeURIComponent(post.handle)}`,
        lastmod: toISODate(post.updated_at || post.published_at),
        images: post.cover_image ? [post.cover_image] : [],
      }))
  )

  const xml = renderImageSitemapXml([...productEntries, ...blogEntries])

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
