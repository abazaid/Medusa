import Image from "next/image"
import { Text } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"

import { getLocale } from "@lib/data/locale-actions"
import { getProductPrice } from "@lib/util/get-product-price"
import { buildProductImageAlt } from "@lib/util/image-alt"
import { isProductInStock } from "@lib/util/product-availability"
import { getProductSlug } from "@lib/util/slug"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

const normalizeOhm = (value: string) =>
  value
    .replace(/ohm/gi, "Ohm")
    .replace(/\s+/g, "")
    .replace(/(\d)(Ohm)/, "$1 Ohm")

const extractVariantSignals = (product: HttpTypes.StoreProduct) => {
  const sourceParts: string[] = []

  for (const variant of product.variants || []) {
    if (variant.title) {
      sourceParts.push(variant.title)
    }

    for (const opt of variant.options || []) {
      if (opt.value) {
        sourceParts.push(opt.value)
      }
    }
  }

  const source = sourceParts.join(" | ")
  const ohmMatches = source.match(/\d+(?:\.\d+)?\s*(?:ohm|Ω)/gi) || []
  const mgMatches = source.match(/\d+(?:\.\d+)?\s*mg/gi) || []

  const uniqueOhm = Array.from(new Set(ohmMatches.map(normalizeOhm))).slice(0, 3)
  if (uniqueOhm.length) {
    return uniqueOhm
  }

  const uniqueMg = Array.from(new Set(mgMatches.map((v) => v.replace(/\s+/g, "")))).slice(0, 3)
  if (uniqueMg.length) {
    return uniqueMg
  }

  return []
}

export default async function ProductPreview({
  product,
  isFeatured,
  region,
  cardVariant = "category",
  showQuickAdd = true,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
  cardVariant?: "default" | "category"
  showQuickAdd?: boolean
}) {
  const { cheapestPrice } = getProductPrice({ product })
  const locale = await getLocale()
  const isArabic = locale.toLowerCase() === "ar"
  const productSlug = getProductSlug(product, locale)
  const inStock = isProductInStock(product)
  const outOfStockLabel = isArabic ? "غير متوفر" : "Out of stock"
  const quickBuyLabel = isArabic ? "شراء سريع" : "Quick Buy"
  const meta = (product.metadata as Record<string, unknown> | null) || {}
  const rating = Number(meta.rating_value) || 0
  const reviewCount = Number(meta.review_count) || 0
  const extractedSignals = extractVariantSignals(product)
  const strengthsLabel =
    extractedSignals.length > 0
      ? extractedSignals.join(", ")
      : ""

  const flavorHint =
    typeof meta.flavor_profile === "string" && meta.flavor_profile.trim()
      ? meta.flavor_profile
      : typeof meta.seo_focus_keyword === "string" && meta.seo_focus_keyword.trim()
      ? meta.seo_focus_keyword
      : ""

  const imageAlt = buildProductImageAlt({
    productTitle: product.title || "",
    image: product.images?.[0],
    context: isArabic ? "صورة منتج فيب" : "vape product image",
    locale,
  })

  const imageUrl = product.thumbnail || product.images?.[0]?.url || ""

  if (cardVariant === "category") {
    return (
      <LocalizedClientLink href={`/products/${encodeURIComponent(productSlug)}`} className="group block">
        <article
          data-testid="product-wrapper"
          className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-[0_1px_0_rgba(15,23,42,0.06)] transition-shadow hover:shadow-md"
        >
          <div className="relative border-b border-slate-200 bg-white p-2">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-white">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={imageAlt}
                  fill
                  className="object-contain p-1"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
              ) : (
                <div className="h-full w-full bg-slate-100" />
              )}
            </div>
            {!inStock ? (
              <div className="absolute inset-x-0 top-0 z-10 bg-red-600/95 px-3 py-2 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                {outOfStockLabel}
              </div>
            ) : null}
          </div>
          <div className="p-3">
            <h3 className="line-clamp-2 min-h-[40px] text-sm font-bold leading-5 text-[#1f2b44]" data-testid="product-title">
              {product.title}
            </h3>
            {reviewCount > 0 ? (
              <div className="mt-1 text-xs text-sky-600">
                {"★★★★★".slice(0, Math.max(1, Math.min(5, Math.round(rating))))}
                <span className="ms-1 text-slate-500">({rating.toFixed(1)})</span>
              </div>
            ) : null}
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="text-base font-extrabold text-[#0f172a]">{cheapestPrice?.calculated_price || ""}</div>
              {strengthsLabel ? (
                <div className="max-w-[60%] truncate rounded bg-[#1f5f97] px-2 py-0.5 text-[10px] font-bold text-white">
                  {strengthsLabel}
                </div>
              ) : null}
            </div>
            {flavorHint ? (
              <p className="mt-1 line-clamp-2 min-h-[32px] text-[11px] text-slate-600">{flavorHint}</p>
            ) : null}
          </div>
          {showQuickAdd ? (
            <div className="bg-[#1f2b44] px-3 py-2 text-center text-xs font-bold text-white">{quickBuyLabel}</div>
          ) : null}
        </article>
      </LocalizedClientLink>
    )
  }

  return (
    <LocalizedClientLink href={`/products/${encodeURIComponent(productSlug)}`} className="group">
      <div data-testid="product-wrapper">
        <div className="relative">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            alt={imageAlt}
            size="full"
            isFeatured={isFeatured}
          />
          {!inStock ? (
            <div className="absolute inset-x-0 top-0 z-10 bg-red-600/95 px-3 py-2 text-center text-xs font-bold uppercase tracking-[0.16em] text-white">
              {outOfStockLabel}
            </div>
          ) : null}
        </div>
        <div className="mt-4 flex justify-between txt-compact-medium">
          <Text className="text-ui-fg-subtle" data-testid="product-title">
            {product.title}
          </Text>
          <div className="flex items-center gap-x-2">{cheapestPrice && <PreviewPrice price={cheapestPrice} />}</div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
