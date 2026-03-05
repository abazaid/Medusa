import { sdk } from "@lib/config"
import {
  getCategorySlug,
  normalizeComparableSlug,
} from "@lib/util/slug"
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
            "id,name,handle,description,metadata,parent_category_id,*category_children,*parent_category",
          limit,
          ...query,
        },
        cache: "force-cache",
        next: {
          revalidate: 300,
          tags: ["categories"],
        },
      }
    )
    .then(({ product_categories }) => product_categories)
}

export const getCategoryByHandle = async (
  categoryHandle: string[],
  localeSegment: string = "ar"
) => {
  const requestedPath = normalizeCategoryPath(categoryHandle.join("/"))
  const requestedComparable = normalizeComparableSlug(requestedPath)
  const categories = await listCategories({ limit: 1000 })
  const allCategories = flattenCategories(categories || [])

  return allCategories.find((category) => {
    const metadata = (category.metadata as Record<string, unknown> | null) || {}
    const categoryHandle = normalizeCategoryPath(category.handle || "")
    const sourcePageLink =
      typeof metadata.source_page_link === "string"
        ? normalizeCategoryPath(metadata.source_page_link)
        : ""

    const slugAr = normalizeComparableSlug(getCategorySlug(category, "ar"))
    const slugEn = normalizeComparableSlug(getCategorySlug(category, "en"))
    const localeSlug = normalizeComparableSlug(
      getCategorySlug(category, localeSegment)
    )

    return (
      categoryHandle === requestedPath ||
      sourcePageLink === requestedPath ||
      requestedComparable === slugAr ||
      requestedComparable === slugEn ||
      requestedComparable === localeSlug
    )
  })
}
