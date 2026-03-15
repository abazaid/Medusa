import { MetadataRoute } from "next"

import { listBlogPosts } from "@lib/data/blog"
import { listProducts } from "@lib/data/products"
import { getBaseURL } from "@lib/util/env"
import { getProductSlug } from "@lib/util/slug"

const LOCALES = ["ar"] as const
const STORE_COUNTRY_CODE = "sa"

const toAbsoluteUrl = (baseUrl: string, value?: string | null) => {
  const input = (value || "").trim()

  if (!input) {
    return ""
  }

  try {
    return new URL(input, baseUrl).toString()
  } catch {
    return ""
  }
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

export default async function imageSitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseURL()

  const [products, blogPosts] = await Promise.all([
    listProductsWithImages().catch(() => []),
    listBlogPosts({ locale: "ar", limit: 200 }).catch(() => []),
  ])

  const productEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    (products || [])
      .filter((product) => !!toAbsoluteUrl(baseUrl, product.thumbnail))
      .map((product) => ({
        url: `${baseUrl}/${locale}/products/${encodeURIComponent(
          getProductSlug(product, locale)
        )}`,
        lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
        images: [toAbsoluteUrl(baseUrl, product.thumbnail)].filter(Boolean),
      }))
  )

  const blogEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    blogPosts
      .filter(
        (post) => !!post.handle && !!toAbsoluteUrl(baseUrl, post.cover_image)
      )
      .map((post) => ({
        url: `${baseUrl}/${locale}/blog/${encodeURIComponent(post.handle)}`,
        lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
        images: [toAbsoluteUrl(baseUrl, post.cover_image)].filter(Boolean),
      }))
  )

  return [...productEntries, ...blogEntries]
}
