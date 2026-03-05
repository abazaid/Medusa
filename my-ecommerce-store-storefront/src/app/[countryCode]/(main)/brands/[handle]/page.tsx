import { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"

import { getLocale } from "@lib/data/locale-actions"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { brands, getBrandByHandle, resolveBrand } from "@lib/data/brands"
import { getBaseURL } from "@lib/util/env"
import { buildBrandImageAlt } from "@lib/util/image-alt"
import { sortByAvailability } from "@lib/util/product-availability"
import { generateBreadcrumbJsonLd } from "@lib/util/structured-data"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Breadcrumbs from "@modules/common/components/breadcrumbs"
import ProductPreview from "@modules/products/components/product-preview"

type PageProps = {
  params: Promise<{ countryCode: string; handle: string }>
}

type BrandProductsCacheEntry = {
  products: any[]
  expiresAt: number
}

declare global {
  var __brand_products_cache__: Record<string, BrandProductsCacheEntry> | undefined
}

const BRAND_PRODUCTS_CACHE_TTL_MS = 5 * 60 * 1000

const getBrandProductsCache = () => {
  if (!globalThis.__brand_products_cache__) {
    globalThis.__brand_products_cache__ = {}
  }

  return globalThis.__brand_products_cache__
}

const listProductsByBrand = async ({
  countryCode,
  brand,
}: {
  countryCode: string
  brand: { handle: string; nameAr: string; nameEn: string }
}) => {
  const cacheKey = `${countryCode.toLowerCase()}:${brand.handle.toLowerCase()}`
  const cache = getBrandProductsCache()
  const cached = cache[cacheKey]

  if (cached && cached.expiresAt > Date.now()) {
    return cached.products
  }

  const normalized = new Set<string>()
  const terms = [brand.handle, brand.nameEn, brand.nameAr]
    .map((value) => (value || "").trim())
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase()
      if (normalized.has(key)) {
        return false
      }
      normalized.add(key)
      return true
    })

  const merged = new Map<string, any>()

  const responses = await Promise.all(
    terms.map((term) =>
      listProducts({
        countryCode,
        queryParams: {
          q: term,
          limit: 48,
        },
      })
    )
  )

  for (const result of responses) {
    const response = result.response
    for (const product of response.products || []) {
      if (product.id) {
        merged.set(product.id, product)
      }
    }
  }

  const products = Array.from(merged.values())
  cache[cacheKey] = {
    products,
    expiresAt: Date.now() + BRAND_PRODUCTS_CACHE_TTL_MS,
  }

  return products
}

export async function generateStaticParams() {
  return brands.map((brand) => ({
    handle: brand.handle,
  }))
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params
  const brand = getBrandByHandle(params.handle)

  if (!brand) {
    return {}
  }

  const isArabic = params.countryCode.toLowerCase() === "ar"
  const title = isArabic
    ? `${brand.nameAr} | ماركة أصلية في السعودية`
    : `${brand.nameEn} | Original Brand in Saudi Arabia`
  const description = isArabic
    ? `تسوق منتجات ${brand.nameAr} الأصلية مع شحن سريع داخل السعودية عبر متجرنا.`
    : `Shop original ${brand.nameEn} products with fast shipping across Saudi Arabia.`
  const canonical = `${getBaseURL()}/${params.countryCode}/brands/${brand.handle}`

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ar: `${getBaseURL()}/ar/brands/${brand.handle}`,
        en: `${getBaseURL()}/en/brands/${brand.handle}`,
        "x-default": `${getBaseURL()}/ar/brands/${brand.handle}`,
      },
    },
    openGraph: {
      title,
      description,
      images: brand.logo ? [{ url: brand.logo }] : [],
    },
  }
}

export default async function BrandPage(props: PageProps) {
  const params = await props.params
  const brand = getBrandByHandle(params.handle)

  if (!brand) {
    notFound()
  }

  const [locale, region, productsResponse] = await Promise.all([
    getLocale(),
    getRegion(params.countryCode),
    listProductsByBrand({ countryCode: params.countryCode, brand }),
  ])

  if (!region) {
    notFound()
  }

  const isArabic = locale.toLowerCase() === "ar"
  const brandName = isArabic ? brand.nameAr : brand.nameEn
  const pageTitle = isArabic ? `تسوق ماركة ${brand.nameAr}` : `Shop ${brand.nameEn}`
  const description = isArabic
    ? `استكشف منتجات ${brand.nameAr} الأصلية وتصفح أفضل العروض المتوفرة الآن داخل السعودية.`
    : `Explore original ${brand.nameEn} products and browse the latest available offers in Saudi Arabia.`
  const brandProducts = productsResponse.filter((product) => {
    const metadata = (product.metadata as Record<string, unknown> | null) || {}
    const brandHandle =
      typeof metadata.brand_handle === "string" ? metadata.brand_handle : ""
    const sourceBrand =
      typeof metadata.source_brand === "string" ? metadata.source_brand : ""

    return (
      brandHandle === brand.handle ||
      resolveBrand(sourceBrand)?.handle === brand.handle
    )
  })
  const sortedBrandProducts = sortByAvailability(brandProducts)

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Brand",
    name: brandName,
    logo: brand.logo,
    url: `${getBaseURL()}/${params.countryCode}/brands/${brand.handle}`,
    description,
    numberOfItems: sortedBrandProducts.length,
  }
  const breadcrumbSchema = generateBreadcrumbJsonLd([
    { name: isArabic ? "الرئيسية" : "Home", url: `${getBaseURL()}/${params.countryCode}` },
    { name: isArabic ? "الماركات" : "Brands", url: `${getBaseURL()}/${params.countryCode}/brands` },
    { name: brandName, url: `${getBaseURL()}/${params.countryCode}/brands/${brand.handle}` },
  ])

  return (
    <div className="bg-[#eef0f3] py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="content-container">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
          <Breadcrumbs
            items={[
              { label: isArabic ? "الرئيسية" : "Home", href: "/" },
              { label: isArabic ? "الماركات" : "Brands", href: "/brands" },
              { label: brandName },
            ]}
          />
          <LocalizedClientLink
            href="/"
            className="text-sm font-semibold text-primary-700 transition-colors hover:text-primary-600"
          >
            {isArabic ? "العودة للرئيسية" : "Back to home"}
          </LocalizedClientLink>

          <div className="mt-6 grid gap-8 md:grid-cols-[220px_1fr]">
            <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <Image
                src={brand.logo}
                alt={buildBrandImageAlt({
                  brandName,
                  locale: isArabic ? "ar" : "en",
                })}
                width={220}
                height={110}
                className="max-h-28 max-w-full object-contain"
              />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-secondary-900 md:text-4xl">
                {pageTitle}
              </h1>
              <p className="mt-4 text-base leading-8 text-secondary-700">
                {description}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full bg-primary-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary-800">
                  {brandName}
                </span>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-700">
                  {brand.handle}
                </span>
              </div>
              <LocalizedClientLink
                href="/store"
                className="mt-8 inline-flex rounded-full bg-secondary-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-secondary-800"
              >
                {isArabic ? "تصفح منتجات المتجر" : "Browse Store Products"}
              </LocalizedClientLink>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-200 pt-10">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-secondary-900">
                {isArabic ? "منتجات الماركة" : "Brand Products"}
              </h2>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-700">
                {sortedBrandProducts.length} {isArabic ? "منتج" : "Products"}
              </span>
            </div>

            {sortedBrandProducts.length ? (
              <ul className="mt-8 grid grid-cols-2 gap-6 small:grid-cols-3 medium:grid-cols-4">
                {sortedBrandProducts.map((product) => (
                  <li key={product.id}>
                    <ProductPreview product={product} region={region} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-sm text-slate-600">
                {isArabic
                  ? "لا توجد منتجات مربوطة بهذه الماركة حتى الآن."
                  : "No products are linked to this brand yet."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
