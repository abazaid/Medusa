import { HttpTypes } from "@medusajs/types"

const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670]/g
const ARABIC_CHARS = /[\u0600-\u06FF]/

const clean = (value?: string | null) =>
  (value || "").trim()

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

const getMetadataPathTail = (
  metadata: Record<string, unknown>,
  keys: string[]
) => {
  const value = getMetadataString(metadata, keys)

  if (!value) {
    return ""
  }

  return value.split("/").filter(Boolean).pop() || value
}

export const toStoreCountryCode = (segment: string) => {
  const normalized = (segment || "").toLowerCase()
  if (normalized === "ar" || normalized === "en" || normalized === "sa") {
    return "sa"
  }
  return normalized || "sa"
}

export const stripSkuSuffix = (value: string) =>
  clean(value)
    .replace(/-?vape\d+$/i, "")
    .replace(/-?(sku)?\d{4,}$/i, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")

export const slugifyArabic = (value: string) =>
  clean(value)
    .normalize("NFKC")
    .replace(ARABIC_DIACRITICS, "")
    .replace(/[^\u0600-\u06FF0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")

export const slugifyEnglish = (value: string) =>
  clean(value)
    .normalize("NFKD")
    .replace(ARABIC_CHARS, " ")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")

export const slugifyMixed = (value: string) =>
  clean(value)
    .normalize("NFKC")
    .replace(ARABIC_DIACRITICS, "")
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")

const pickLocalizedTitle = (title: string, localeSegment: string) => {
  const locale = (localeSegment || "").toLowerCase()

  if (locale === "ar") {
    const matches = title.match(/[\u0600-\u06FF0-9\s-]+/g)
    return clean(matches?.join(" ")) || title
  }

  return title.replace(/[\u0600-\u06FF]/g, " ")
}

export const getProductSlug = (
  product: Pick<HttpTypes.StoreProduct, "title" | "handle" | "metadata">,
  _localeSegment: string
) => {
  const metadata = (product.metadata as Record<string, unknown> | null) || {}

  const preferred = getMetadataString(
    metadata,
    ["slug_en", "product_slug_en", "handle_en", "product_slug", "slug"]
  )

  if (preferred) {
    return slugifyEnglish(preferred)
  }

  const fromHandle = slugifyEnglish(product.handle || "")
  if (fromHandle) {
    return fromHandle
  }

  const localizedTitle = pickLocalizedTitle(product.title || "", "en")
  const fromTitle = slugifyEnglish(localizedTitle)

  if (fromTitle) {
    return fromTitle
  }

  const cleanedHandle = stripSkuSuffix(product.handle || "")
  return slugifyEnglish(cleanedHandle)
}

export const getProductSlugCandidates = (
  product: Pick<HttpTypes.StoreProduct, "title" | "handle" | "metadata">
) => {
  const metadata = (product.metadata as Record<string, unknown> | null) || {}

  const rawCandidates = [
    getMetadataPathTail(metadata, ["slug_ar", "product_slug_ar", "handle_ar"]),
    getMetadataPathTail(metadata, [
      "slug_en",
      "product_slug_en",
      "handle_en",
      "product_slug",
      "slug",
    ]),
    getMetadataPathTail(metadata, ["source_page_link", "source_url"]),
    product.handle || "",
    stripSkuSuffix(product.handle || ""),
    product.title || "",
    pickLocalizedTitle(product.title || "", "ar"),
    pickLocalizedTitle(product.title || "", "en"),
  ].filter(Boolean)

  const slugCandidates = rawCandidates.flatMap((value) => [
    slugifyMixed(value),
    slugifyArabic(value),
    slugifyEnglish(value),
    stripSkuSuffix(slugifyMixed(value)),
    stripSkuSuffix(slugifyEnglish(value)),
  ])

  return Array.from(new Set(slugCandidates.filter(Boolean)))
}

export const getCategorySlug = (
  category: Pick<HttpTypes.StoreProductCategory, "name" | "handle" | "metadata">,
  localeSegment: string
) => {
  const metadata = (category.metadata as Record<string, unknown> | null) || {}
  const locale = (localeSegment || "").toLowerCase()

  const preferred = getMetadataString(
    metadata,
    locale === "ar"
      ? ["slug_ar", "category_slug_ar", "handle_ar", "source_page_link"]
      : ["slug_en", "category_slug_en", "handle_en"]
  )

  if (preferred) {
    const lastSegment = preferred.split("/").filter(Boolean).pop() || preferred
    return locale === "ar" ? slugifyArabic(lastSegment) : slugifyEnglish(lastSegment)
  }

  if (locale === "ar") {
    return slugifyArabic(category.name || category.handle || "")
  }

  return (
    slugifyEnglish(category.name || "") ||
    slugifyEnglish(category.handle || "") ||
    clean(category.handle)
  )
}

export const normalizeComparableSlug = (value: string) =>
  decodeURIComponent(clean(value))
    .toLowerCase()
    .normalize("NFKD")
    .replace(ARABIC_DIACRITICS, "")
    .replace(/[^\u0600-\u06FFa-z0-9]+/g, "")
