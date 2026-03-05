import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type ProductRecord = {
  id: string
  title?: string | null
  handle?: string | null
  metadata?: Record<string, unknown> | null
}

type CategoryRecord = {
  id: string
  name?: string | null
  handle?: string | null
  metadata?: Record<string, unknown> | null
}

const clean = (value?: string | null) => (value || "").trim()

const stripSkuSuffix = (value: string) =>
  clean(value)
    .replace(/-?vape\d+$/i, "")
    .replace(/-?(sku)?\d{4,}$/i, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")

const slugifyAr = (value: string) =>
  clean(value)
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[^\u0600-\u06FF0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")

const slugifyEn = (value: string) =>
  clean(value)
    .normalize("NFKD")
    .replace(/[\u0600-\u06FF]/g, " ")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")

const ensureUnique = (
  base: string,
  used: Set<string>,
  fallbackPrefix: string,
  id: string
) => {
  const fallbackId = id.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(-8)
  const seed = (base || `${fallbackPrefix}-${fallbackId}`)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
  let slug = seed
  let index = 2
  while (used.has(slug)) {
    slug = `${seed}-${index}`
    index += 1
  }
  used.add(slug)
  return slug
}

export default async function normalizeStoreSlugs({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModuleService = container.resolve("product")

  logger.info("Starting slug normalization for products and categories...")

  const { data: productData } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "metadata"],
  })

  const products = (productData || []) as ProductRecord[]
  const usedProductHandles = new Set<string>()
  let updatedProducts = 0

  for (const product of products) {
    const title = clean(product.title)
    const previousHandle = clean(product.handle)
    const metadata = (product.metadata || {}) as Record<string, unknown>

    const preferredEn =
      (typeof metadata.slug_en === "string" && clean(metadata.slug_en)) ||
      slugifyEn(title) ||
      slugifyEn(stripSkuSuffix(previousHandle))
    const nextHandle = ensureUnique(preferredEn, usedProductHandles, "product", product.id)
    const nextSlugAr =
      (typeof metadata.slug_ar === "string" && clean(metadata.slug_ar)) || slugifyAr(title)

    const nextMetadata = {
      ...metadata,
      slug_en: nextHandle,
      slug_ar: nextSlugAr || null,
    }

    const shouldUpdate =
      nextHandle !== previousHandle ||
      nextMetadata.slug_en !== metadata.slug_en ||
      nextMetadata.slug_ar !== metadata.slug_ar

    if (!shouldUpdate) {
      continue
    }

    await productModuleService.updateProducts(product.id, {
      handle: nextHandle,
      metadata: nextMetadata,
    })
    updatedProducts += 1
  }

  const { data: categoryData } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle", "metadata"],
  })

  const categories = (categoryData || []) as CategoryRecord[]
  const usedCategoryHandles = new Set<string>()
  let updatedCategories = 0

  for (const category of categories) {
    const name = clean(category.name)
    const previousHandle = clean(category.handle)
    const metadata = (category.metadata || {}) as Record<string, unknown>
    const sourcePageLink =
      typeof metadata.source_page_link === "string"
        ? metadata.source_page_link.split("/").filter(Boolean).pop() || ""
        : ""

    const preferredEn =
      (typeof metadata.slug_en === "string" && clean(metadata.slug_en)) ||
      (typeof metadata.category_slug_en === "string" && clean(metadata.category_slug_en)) ||
      slugifyEn(name) ||
      slugifyEn(previousHandle)
    const nextHandle = ensureUnique(preferredEn, usedCategoryHandles, "category", category.id)
    const nextSlugAr =
      (typeof metadata.slug_ar === "string" && clean(metadata.slug_ar)) ||
      (typeof metadata.category_slug_ar === "string" && clean(metadata.category_slug_ar)) ||
      slugifyAr(name) ||
      slugifyAr(sourcePageLink)

    const nextMetadata = {
      ...metadata,
      slug_en: nextHandle,
      category_slug_en: nextHandle,
      slug_ar: nextSlugAr || null,
      category_slug_ar: nextSlugAr || null,
    }

    const shouldUpdate =
      nextHandle !== previousHandle ||
      nextMetadata.slug_en !== metadata.slug_en ||
      nextMetadata.slug_ar !== metadata.slug_ar ||
      nextMetadata.category_slug_en !== metadata.category_slug_en ||
      nextMetadata.category_slug_ar !== metadata.category_slug_ar

    if (!shouldUpdate) {
      continue
    }

    await productModuleService.updateProductCategories(category.id, {
      handle: nextHandle,
      metadata: nextMetadata,
    })
    updatedCategories += 1
  }

  logger.info(
    `Slug normalization complete. Products updated: ${updatedProducts}. Categories updated: ${updatedCategories}.`
  )
}
