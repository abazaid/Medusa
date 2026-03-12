import { brands } from "@lib/data/brands"
import { listBlogPosts } from "@lib/data/blog"
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { listProducts } from "@lib/data/products"
import { getSeoLandingSlug, seoLandings } from "@lib/data/seo-landings"
import { getBaseURL } from "@lib/util/env"
import { getCategorySlug, getProductSlug } from "@lib/util/slug"

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

const flattenCategories = (categories: any[]): any[] =>
  categories.flatMap((category) => {
    const children = Array.isArray(category.category_children)
      ? flattenCategories(category.category_children)
      : []
    return [category, ...children]
  })

const listAllProducts = async () => {
  const products: any[] = []
  let page = 1

  while (true) {
    const { response, nextPage } = await listProducts({
      countryCode: STORE_COUNTRY_CODE,
      pageParam: page,
      disableCache: true,
      queryParams: {
        limit: 100,
        fields: "handle,title,metadata,updated_at",
      },
    })

    products.push(...(response.products || []))
    if (!nextPage) break
    page = nextPage
  }

  return products
}

type UrlEntry = {
  loc: string
  lastmod?: string
  changefreq?: "daily" | "weekly" | "monthly"
  priority?: number
}

const renderUrlSet = (urls: UrlEntry[]) => {
  const rows = urls
    .map((entry) => {
      const lastmod = entry.lastmod ? `<lastmod>${xmlEscape(entry.lastmod)}</lastmod>` : ""
      const changefreq = entry.changefreq
        ? `<changefreq>${entry.changefreq}</changefreq>`
        : ""
      const priority =
        typeof entry.priority === "number"
          ? `<priority>${entry.priority.toFixed(1)}</priority>`
          : ""

      return `<url><loc>${xmlEscape(entry.loc)}</loc>${lastmod}${changefreq}${priority}</url>`
    })
    .join("")

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${rows}</urlset>`
}

export const renderSitemapIndexXml = () => {
  const baseUrl = getBaseURL()
  const now = new Date().toISOString()

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    `<sitemap><loc>${xmlEscape(`${baseUrl}/sitemap-ar.xml`)}</loc><lastmod>${xmlEscape(now)}</lastmod></sitemap>` +
    `<sitemap><loc>${xmlEscape(`${baseUrl}/image-sitemap.xml`)}</loc><lastmod>${xmlEscape(now)}</lastmod></sitemap>` +
    `</sitemapindex>`
  )
}

export const buildLocaleSitemapXml = async (locale: "ar" | "en") => {
  const baseUrl = getBaseURL()
  const now = new Date()

  const [categoriesTree, products, blogPosts, collections] = await Promise.all([
    listCategories({ limit: 1000 }).catch(() => []),
    listAllProducts().catch(() => []),
    listBlogPosts({ locale, limit: 500 }).catch(() => []),
    listCollections({ fields: "id,handle,title,updated_at" }).then((r) => r.collections || []).catch(() => []),
  ])

  const categories = flattenCategories(categoriesTree || [])

  const staticUrls: UrlEntry[] = [
    {
      loc: `${baseUrl}/${locale}`,
      lastmod: now.toISOString(),
      changefreq: "daily",
      priority: 1.0,
    },
    {
      loc: `${baseUrl}/${locale}/store`,
      lastmod: now.toISOString(),
      changefreq: "daily",
      priority: 0.9,
    },
    {
      loc: `${baseUrl}/${locale}/brands`,
      lastmod: now.toISOString(),
      changefreq: "weekly",
      priority: 0.8,
    },
    {
      loc: `${baseUrl}/${locale}/blog`,
      lastmod: now.toISOString(),
      changefreq: "weekly",
      priority: 0.8,
    },
    {
      loc: `${baseUrl}/${locale}/landing`,
      lastmod: now.toISOString(),
      changefreq: "weekly",
      priority: 0.8,
    },
  ]

  const categoryUrls: UrlEntry[] = categories.map((category: any) => ({
    loc: `${baseUrl}/${locale}/categories/${encodeURIComponent(
      getCategorySlug(category, locale)
    )}`,
    lastmod: toISODate(category.updated_at || category.created_at),
    changefreq: "weekly",
    priority: 0.8,
  }))

  const productUrls: UrlEntry[] = products.map((product: any) => ({
    loc: `${baseUrl}/${locale}/products/${encodeURIComponent(
      getProductSlug(product, locale)
    )}`,
    lastmod: toISODate(product.updated_at),
    changefreq: "daily",
    priority: 0.9,
  }))

  const brandUrls: UrlEntry[] = brands.map((brand) => ({
    loc: `${baseUrl}/${locale}/brands/${brand.handle}`,
    lastmod: now.toISOString(),
    changefreq: "weekly",
    priority: 0.7,
  }))

  const collectionUrls: UrlEntry[] = collections
    .filter((collection: any) => !!collection?.handle)
    .map((collection: any) => ({
      loc: `${baseUrl}/${locale}/collections/${collection.handle}`,
      lastmod: toISODate(collection.updated_at),
      changefreq: "weekly",
      priority: 0.7,
    }))

  const blogUrls: UrlEntry[] = blogPosts
    .filter((post) => !!post.handle)
    .map((post) => ({
      loc: `${baseUrl}/${locale}/blog/${encodeURIComponent(post.handle)}`,
      lastmod: toISODate(post.updated_at || post.published_at),
      changefreq: "weekly",
      priority: 0.7,
    }))

  const landingUrls: UrlEntry[] = seoLandings.map((landing) => ({
    loc: `${baseUrl}/${locale}/landing/${encodeURIComponent(
      getSeoLandingSlug(landing, locale)
    )}`,
    lastmod: now.toISOString(),
    changefreq: "weekly",
    priority: 0.7,
  }))

  return renderUrlSet([
    ...staticUrls,
    ...categoryUrls,
    ...productUrls,
    ...brandUrls,
    ...collectionUrls,
    ...blogUrls,
    ...landingUrls,
  ])
}
