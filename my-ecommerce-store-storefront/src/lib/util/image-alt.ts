const normalizeWords = (value: string) =>
  value
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const clampWords = (value: string, maxWords: number) =>
  normalizeWords(value).split(" ").filter(Boolean).slice(0, maxWords).join(" ")

export const buildProductImageAlt = ({
  productTitle,
  brandName,
  context,
  locale = "ar",
}: {
  productTitle: string
  brandName?: string | null
  context?: string
  locale?: string
}) => {
  const isArabic = locale.toLowerCase() === "ar"
  const title = clampWords(productTitle || "", 8)
  const brand = clampWords(brandName || "", 3)
  const normalizedContext = clampWords(context || "", 4)

  const fallback = isArabic
    ? "منتج فيب أصلي للشراء داخل السعودية"
    : "Original vape product available in Saudi Arabia"

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
