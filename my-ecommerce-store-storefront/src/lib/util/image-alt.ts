const normalizeWords = (value: string) =>
  value
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const clampWords = (value: string, maxWords: number) =>
  normalizeWords(value).split(" ").filter(Boolean).slice(0, maxWords).join(" ")

const pickStoredAlt = (image?: unknown) => {
  if (!image || typeof image !== "object") {
    return ""
  }

  const imageRecord = image as Record<string, unknown>
  const metadata =
    imageRecord.metadata && typeof imageRecord.metadata === "object"
      ? (imageRecord.metadata as Record<string, unknown>)
      : null

  const candidates = [
    imageRecord.alt,
    imageRecord.alt_text,
    metadata?.alt,
    metadata?.alt_text,
    metadata?.image_alt,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return clampWords(candidate, 18)
    }
  }

  return ""
}

export const buildProductImageAlt = ({
  productTitle,
  brandName,
  context,
  image,
  locale = "ar",
}: {
  productTitle: string
  brandName?: string | null
  context?: string
  image?: unknown
  locale?: string
}) => {
  const isArabic = locale.toLowerCase() === "ar"
  const storedAlt = pickStoredAlt(image)

  if (storedAlt) {
    return storedAlt
  }

  const title = clampWords(productTitle || "", 10)
  const brand = clampWords(brandName || "", 4)
  const normalizedContext = clampWords(context || "", 5)

  const fallback = isArabic
    ? "صورة منتج فيب أصلية للشراء داخل السعودية"
    : "Original vape product image available in Saudi Arabia"

  const parts = [title, brand, normalizedContext].filter(Boolean)
  const combined = parts.join(" ").trim()

  return combined || fallback
}

export const buildBrandImageAlt = ({
  brandName,
  locale = "ar",
}: {
  brandName: string
  locale?: string
}) => {
  const isArabic = locale.toLowerCase() === "ar"
  const normalized = clampWords(brandName, 6)

  return isArabic
    ? `شعار ماركة ${normalized} لمنتجات الفيب`
    : `${normalized} vape brand logo`
}
