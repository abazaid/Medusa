import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { cache } from "react"
import { listProducts } from "@lib/data/products"
import { resolveProductIdFromSlugIndex } from "@lib/data/product-slug-index"
import { getRegion } from "@lib/data/regions"
import { getBaseURL } from "@lib/util/env"
import { getProductSlug, normalizeComparableSlug, stripSkuSuffix } from "@lib/util/slug"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

export const dynamic = "force-dynamic"

const findProductBySlug = cache(async (countryCode: string, rawHandle: string) => {
  const normalizedTarget = normalizeComparableSlug(rawHandle)
  const decodedHandle = decodeURIComponent(rawHandle)
  const exactCandidates = Array.from(
    new Set([decodedHandle, stripSkuSuffix(decodedHandle)].filter(Boolean))
  )

  for (const candidate of exactCandidates) {
    const exactMatch = await listProducts({
      countryCode,
      queryParams: { handle: candidate },
    }).then(({ response }) => response.products[0])

    if (exactMatch) {
      return exactMatch
    }
  }

  const searchCandidates = Array.from(
    new Set([
      stripSkuSuffix(decodedHandle).replace(/-/g, " "),
    ].filter(Boolean))
  )

  for (const q of searchCandidates) {
    const { response } = await listProducts({
      countryCode,
      queryParams: {
        q,
        limit: 30,
        fields: "id,handle,title,metadata",
      },
    })

    const matched = (response.products || []).find((product) => {
      const slugAr = normalizeComparableSlug(getProductSlug(product, "ar"))
      const slugEn = normalizeComparableSlug(getProductSlug(product, "en"))
      const handleRaw = normalizeComparableSlug(product.handle || "")
      const handleClean = normalizeComparableSlug(stripSkuSuffix(product.handle || ""))
      return (
        normalizedTarget === slugAr ||
        normalizedTarget === slugEn ||
        normalizedTarget === handleRaw ||
        normalizedTarget === handleClean
      )
    })

    if (matched?.id) {
      const fullProduct = await listProducts({
        countryCode,
        queryParams: {
          id: [matched.id],
          limit: 1,
        },
      }).then(({ response }) => response.products[0])

      if (fullProduct) {
        return fullProduct
      }
    }
  }

  const indexedId = await resolveProductIdFromSlugIndex({
    countryCode,
    rawSlug: decodedHandle,
  })

  if (indexedId) {
    const fullProduct = await listProducts({
      countryCode,
      queryParams: {
        id: [indexedId],
        limit: 1,
      },
    }).then(({ response }) => response.products[0])

    if (fullProduct) {
      return fullProduct
    }
  }

  return undefined
})

function getImagesForVariant(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string
) {
  const fallbackImages = product.images || []

  if (!selectedVariantId || !product.variants) {
    return fallbackImages
  }

  const variant = product.variants.find((v) => v.id === selectedVariantId)
  if (!variant || !variant.images?.length) {
    return fallbackImages
  }

  const imageIdsMap = new Map(variant.images.map((i) => [i.id, true]))
  return fallbackImages.filter((i) => imageIdsMap.has(i.id))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params

  const product = await findProductBySlug(params.countryCode, handle)

  if (!product) {
    notFound()
  }

  const metadata =
    (product.metadata as Record<string, unknown> | null) || {}
  const metaTitle =
    typeof metadata.page_title === "string" && metadata.page_title.trim()
      ? metadata.page_title.trim()
      : typeof metadata.meta_title === "string" && metadata.meta_title.trim()
      ? metadata.meta_title.trim()
      : `${product.title} | Vape Hub KSA`
  const metaDescription =
    typeof metadata.page_description === "string" &&
    metadata.page_description.trim()
      ? metadata.page_description.trim()
      : typeof metadata.meta_description === "string" &&
        metadata.meta_description.trim()
      ? metadata.meta_description.trim()
      : product.description ||
        `Shop ${product.title} at Vape Hub KSA. Premium vape products with fast delivery across Saudi Arabia.`
  const canonicalSlug = getProductSlug(product, params.countryCode)
  const canonical = `${getBaseURL()}/${params.countryCode}/products/${encodeURIComponent(canonicalSlug)}`
  const arSlug = getProductSlug(product, "ar")

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical,
      languages: {
        ar: `${getBaseURL()}/ar/products/${encodeURIComponent(arSlug)}`,
        "x-default": `${getBaseURL()}/ar/products/${encodeURIComponent(arSlug)}`,
      },
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: canonical,
      images: product.thumbnail ? [{ url: product.thumbnail }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const region = await getRegion(params.countryCode)
  const searchParams = await props.searchParams

  const selectedVariantId = searchParams.v_id

  if (!region) {
    notFound()
  }

  const pricedProduct = await findProductBySlug(params.countryCode, params.handle)

  if (!pricedProduct) {
    notFound()
  }
  const canonicalSlug = getProductSlug(pricedProduct, params.countryCode)
  if (
    normalizeComparableSlug(params.handle) !==
    normalizeComparableSlug(canonicalSlug)
  ) {
    const suffix = selectedVariantId
      ? `?v_id=${encodeURIComponent(selectedVariantId)}`
      : ""
    redirect(
      `/${params.countryCode}/products/${encodeURIComponent(canonicalSlug)}${suffix}`
    )
  }
  const images = getImagesForVariant(pricedProduct, selectedVariantId)

  return (
    <ProductTemplate
      product={pricedProduct}
      region={region}
      countryCode={params.countryCode}
      images={images}
    />
  )
}
