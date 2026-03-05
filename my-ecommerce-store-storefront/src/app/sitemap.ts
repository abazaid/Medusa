import { MetadataRoute } from "next"

import { brands } from "@lib/data/brands"
import { listBlogPosts } from "@lib/data/blog"
import { listCategories } from "@lib/data/categories"
import { listProducts } from "@lib/data/products"
import { getBaseURL } from "@lib/util/env"

const COUNTRY_CODE = "sa"

const flattenCategoryHandles = (categories: any[]): string[] =>
  categories.flatMap((category) => {
    const children = Array.isArray(category.category_children)
      ? flattenCategoryHandles(category.category_children)
      : []

    return [category.handle, ...children].filter(Boolean) as string[]
  })

const listAllProductHandles = async () => {
  const handles: string[] = []
  let page = 1

  while (true) {
    const { response, nextPage } = await listProducts({
      countryCode: COUNTRY_CODE,
      pageParam: page,
      disableCache: true,
      queryParams: {
        limit: 100,
        fields: "handle,updated_at,thumbnail",
      },
    })

    handles.push(
      ...(response.products
        .map((product) => product.handle)
        .filter(Boolean) as string[])
    )

    if (!nextPage) {
      break
    }

    page = nextPage
  }

  return Array.from(new Set(handles))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseURL()

  const [categories, productHandles, blogPosts] = await Promise.all([
    listCategories({ limit: 1000 }).catch(() => []),
    listAllProductHandles().catch(() => []),
    listBlogPosts({ locale: "ar", limit: 200 }).catch(() => []),
  ])

  const now = new Date()
  const categoryHandles = Array.from(
    new Set(flattenCategoryHandles(categories || []))
  )

  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/${COUNTRY_CODE}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/${COUNTRY_CODE}/store`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/${COUNTRY_CODE}/brands`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/${COUNTRY_CODE}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ]

  const categoryUrls: MetadataRoute.Sitemap = categoryHandles.map((handle) => ({
    url: `${baseUrl}/${COUNTRY_CODE}/categories/${encodeURIComponent(handle)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  const brandUrls: MetadataRoute.Sitemap = brands.map((brand) => ({
    url: `${baseUrl}/${COUNTRY_CODE}/brands/${brand.handle}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  const productUrls: MetadataRoute.Sitemap = productHandles.map((handle) => ({
    url: `${baseUrl}/${COUNTRY_CODE}/products/${encodeURIComponent(handle)}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.9,
  }))

  const blogUrls: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/${COUNTRY_CODE}/blog/${encodeURIComponent(post.handle)}`,
    lastModified: post.updated_at ? new Date(post.updated_at) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  return [...staticUrls, ...categoryUrls, ...brandUrls, ...productUrls, ...blogUrls]
}
