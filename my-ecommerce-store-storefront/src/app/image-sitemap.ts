import { MetadataRoute } from "next"

import { listBlogPosts } from "@lib/data/blog"
import { listProducts } from "@lib/data/products"
import { getBaseURL } from "@lib/util/env"

const COUNTRY_CODE = "sa"

const listProductImageEntries = async () => {
  const entries: MetadataRoute.Sitemap = []
  let page = 1

  while (true) {
    const { response, nextPage } = await listProducts({
      countryCode: COUNTRY_CODE,
      pageParam: page,
      disableCache: true,
      queryParams: {
        limit: 100,
        fields: "handle,thumbnail,updated_at",
      },
    })

    entries.push(
      ...response.products
        .filter((product) => !!product.handle && !!product.thumbnail)
        .map((product) => ({
          url: `${getBaseURL()}/${COUNTRY_CODE}/products/${encodeURIComponent(product.handle!)}`,
          lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
          images: product.thumbnail ? [product.thumbnail] : [],
        }))
    )

    if (!nextPage) {
      break
    }

    page = nextPage
  }

  return entries
}

export default async function imageSitemap(): Promise<MetadataRoute.Sitemap> {
  const [productEntries, blogPosts] = await Promise.all([
    listProductImageEntries().catch(() => []),
    listBlogPosts({ locale: "ar", limit: 200 }).catch(() => []),
  ])

  const blogEntries: MetadataRoute.Sitemap = blogPosts
    .filter((post) => !!post.handle && !!post.cover_image)
    .map((post) => ({
      url: `${getBaseURL()}/${COUNTRY_CODE}/blog/${encodeURIComponent(post.handle)}`,
      lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
      images: post.cover_image ? [post.cover_image] : [],
    }))

  return [...productEntries, ...blogEntries]
}
