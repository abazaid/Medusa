import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"

const flattenCategories = (
  categories: HttpTypes.StoreProductCategory[]
): HttpTypes.StoreProductCategory[] =>
  categories.flatMap((category) => [
    category,
    ...flattenCategories(
      (category.category_children as HttpTypes.StoreProductCategory[] | undefined) || []
    ),
  ])

const normalizeCategoryPath = (value: string) => {
  try {
    return decodeURIComponent(value).trim().toLowerCase()
  } catch {
    return value.trim().toLowerCase()
  }
}

export const listCategories = async (query?: Record<string, any>) => {
  const limit = query?.limit || 100

  return sdk.client
    .fetch<{ product_categories: HttpTypes.StoreProductCategory[] }>(
      "/store/product-categories",
      {
        query: {
          fields:
            "*category_children, *products, *parent_category, *parent_category.parent_category, metadata",
          limit,
          ...query,
        },
        cache: "no-store",
      }
    )
    .then(({ product_categories }) => product_categories)
}

export const getCategoryByHandle = async (categoryHandle: string[]) => {
  const requestedPath = normalizeCategoryPath(categoryHandle.join("/"))
  const categories = await listCategories({ limit: 1000 })
  const allCategories = flattenCategories(categories || [])

  return allCategories.find((category) => {
    const metadata = (category.metadata as Record<string, unknown> | null) || {}
    const categoryHandle = normalizeCategoryPath(category.handle || "")
    const sourcePageLink =
      typeof metadata.source_page_link === "string"
        ? normalizeCategoryPath(metadata.source_page_link)
        : ""

    return (
      categoryHandle === requestedPath ||
      sourcePageLink === requestedPath
    )
  })
}
