import { HttpTypes } from "@medusajs/types"

import { getBrandByHandle, resolveBrand } from "@lib/data/brands"

import { getBaseURL } from "./env"
import { getProductSlug } from "./slug"

const getProductBrandName = (product: HttpTypes.StoreProduct) => {
  const metadata = (product.metadata as Record<string, unknown> | null) || {}
  const brandFromHandle =
    typeof metadata.brand_handle === "string"
      ? getBrandByHandle(metadata.brand_handle)
      : undefined
  const brandFromNameAr =
    typeof metadata.brand_name_ar === "string"
      ? resolveBrand(metadata.brand_name_ar)
      : undefined
  const brandFromNameEn =
    typeof metadata.brand_name_en === "string"
      ? resolveBrand(metadata.brand_name_en)
      : undefined
  const brandFromSource =
    typeof metadata.source_brand === "string"
      ? resolveBrand(metadata.source_brand)
      : undefined
  const brand =
    brandFromHandle || brandFromNameAr || brandFromNameEn || brandFromSource

  return brand?.nameEn || "Vape Hub KSA"
}

export function generateProductJsonLd(
  product: HttpTypes.StoreProduct,
  region: HttpTypes.StoreRegion,
  countryCode: string
) {
  const defaultVariant = product.variants?.[0]
  const price = defaultVariant?.calculated_price
  const baseUrl = getBaseURL()
  const productUrl = `${baseUrl}/${countryCode}/products/${encodeURIComponent(
    getProductSlug(product, countryCode)
  )}`
  const brandName = getProductBrandName(product)

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || "",
    image: product.thumbnail ? [product.thumbnail] : [],
    sku: defaultVariant?.sku,
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: price?.currency_code || region.currency_code,
      price:
        typeof price?.calculated_amount === "number"
          ? price.calculated_amount.toFixed(2)
          : "0.00",
      availability:
        defaultVariant?.inventory_quantity && defaultVariant.inventory_quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  }
}

export function generateBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function generateOrganizationJsonLd() {
  const baseUrl = getBaseURL()

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}#organization`,
    name: "Vape Hub KSA",
    alternateName: "مركز الفيب السعودي",
    url: baseUrl,
    slogan: "Your Vaping Hub in Saudi Arabia",
    logo: `${baseUrl}/icon.png`,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        areaServed: "SA",
        availableLanguage: ["ar"],
      },
    ],
  }
}

type FaqItem = {
  question: string
  answer: string
}

const parseFaqCandidates = (value: unknown): FaqItem[] => {
  if (!value) {
    return []
  }

  let parsed: unknown = value
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value)
    } catch {
      return []
    }
  }

  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null
      }

      const asObject = entry as Record<string, unknown>
      const question = (asObject.question || asObject.q || asObject.title) as
        | string
        | undefined
      const answer = (
        asObject.answer ||
        asObject.a ||
        asObject.body ||
        asObject.content
      ) as string | undefined

      if (typeof question !== "string" || typeof answer !== "string") {
        return null
      }

      const normalizedQuestion = question.trim()
      const normalizedAnswer = answer.trim()

      if (!normalizedQuestion || !normalizedAnswer) {
        return null
      }

      return {
        question: normalizedQuestion,
        answer: normalizedAnswer,
      }
    })
    .filter(Boolean) as FaqItem[]
}

export const extractFaqFromMetadata = (
  metadata: Record<string, unknown>,
  locale: "ar" | "en"
) => {
  const keyCandidates =
    locale === "ar"
      ? ["faq_ar", "faqs_ar", "frequently_asked_questions_ar", "faq", "faqs"]
      : ["faq_en", "faqs_en", "frequently_asked_questions_en", "faq", "faqs"]

  for (const key of keyCandidates) {
    const items = parseFaqCandidates(metadata[key])
    if (items.length) {
      return items
    }
  }

  const fromPairs: FaqItem[] = []
  for (let index = 1; index <= 10; index += 1) {
    const questionRaw =
      metadata[`faq_question_${index}_${locale}`] ??
      metadata[`faq_question_${index}`]
    const answerRaw =
      metadata[`faq_answer_${index}_${locale}`] ??
      metadata[`faq_answer_${index}`]

    if (typeof questionRaw === "string" && typeof answerRaw === "string") {
      const question = questionRaw.trim()
      const answer = answerRaw.trim()
      if (question && answer) {
        fromPairs.push({ question, answer })
      }
    }
  }

  return fromPairs
}

export const generateFaqJsonLd = (items: FaqItem[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
})
