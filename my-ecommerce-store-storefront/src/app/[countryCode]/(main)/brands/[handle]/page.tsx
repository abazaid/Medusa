import { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { HttpTypes } from "@medusajs/types"
import { Pool } from "pg"

import { getLocale } from "@lib/data/locale-actions"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { brands, getBrandByHandle, getProductBrand } from "@lib/data/brands"
import { getBaseURL } from "@lib/util/env"
import { buildBrandImageAlt } from "@lib/util/image-alt"
import { isProductInStock, sortByAvailability } from "@lib/util/product-availability"
import { generateBreadcrumbJsonLd } from "@lib/util/structured-data"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Breadcrumbs from "@modules/common/components/breadcrumbs"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"

type PageProps = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ page?: string }>
}

export const dynamic = "force-dynamic"

type BrandProductsCacheEntry = {
  productIds: string[]
  expiresAt: number
}

declare global {
  var __brand_products_cache__: Record<string, BrandProductsCacheEntry> | undefined
  var __brand_products_inflight__: Record<string, Promise<string[]>> | undefined
}

const BRAND_PRODUCTS_CACHE_TTL_MS = 5 * 60 * 1000

let dbPool: Pool | null = null
const getDatabaseUrl = () => process.env.DATABASE_URL || ""
const getDbPool = () => {
  if (!dbPool) {
    dbPool = new Pool({
      connectionString: getDatabaseUrl(),
    })
  }
  return dbPool
}

const getBrandProductsCache = () => {
  if (!globalThis.__brand_products_cache__) {
    globalThis.__brand_products_cache__ = {}
  }

  return globalThis.__brand_products_cache__
}

const getBrandProductsInflight = () => {
  if (!globalThis.__brand_products_inflight__) {
    globalThis.__brand_products_inflight__ = {}
  }

  return globalThis.__brand_products_inflight__
}

const matchesBrand = (
  product: Pick<HttpTypes.StoreProduct, "metadata">,
  brand: { handle: string; nameAr: string; nameEn: string }
) => {
  return getProductBrand(product)?.handle === brand.handle
}

const getBrandProductIdsFromDatabase = async (brandHandle: string) => {
  const databaseUrl = getDatabaseUrl()
  if (!databaseUrl) {
    return null
  }

  const pool = getDbPool()
  const { rows } = await pool.query<{ id: string; metadata: Record<string, unknown> | null }>(
    `
      SELECT id, metadata
      FROM product
      WHERE deleted_at IS NULL
        AND metadata IS NOT NULL
    `
  )

  const ids: string[] = []
  const seen = new Set<string>()

  for (const row of rows || []) {
    const productBrand = getProductBrand({ metadata: row.metadata } as Pick<
      HttpTypes.StoreProduct,
      "metadata"
    >)

    if (productBrand?.handle === brandHandle && row.id && !seen.has(row.id)) {
      seen.add(row.id)
      ids.push(row.id)
    }
  }

  return ids
}

const getBrandProductIdsFromStoreFallback = async ({
  countryCode,
  brand,
}: {
  countryCode: string
  brand: { handle: string; nameAr: string; nameEn: string }
}) => {
  const ids: string[] = []
  const seen = new Set<string>()
  let page = 1
  const limit = 100

  while (true) {
    const { response, nextPage } = await listProducts({
      countryCode,
      pageParam: page,
      queryParams: {
        limit,
        fields: "id,+metadata",
      },
      disableCache: true,
    })

    for (const product of response.products || []) {
      if (product.id && matchesBrand(product, brand) && !seen.has(product.id)) {
        seen.add(product.id)
        ids.push(product.id)
      }
    }

    if (!nextPage) {
      break
    }

    page = nextPage
  }

  return ids
}

const chunkArray = <T,>(items: T[], chunkSize: number) => {
  if (chunkSize <= 0) return [items]

  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize))
  }
  return chunks
}

const orderProductIdsByAvailability = async ({
  countryCode,
  productIds,
}: {
  countryCode: string
  productIds: string[]
}) => {
  if (!productIds.length) {
    return productIds
  }

  const stockByProductId = new Map<string, boolean>()
  const idChunks = chunkArray(productIds, 100)

  for (const idsChunk of idChunks) {
    const { response } = await listProducts({
      countryCode,
      queryParams: {
        id: idsChunk,
        limit: idsChunk.length,
      },
      disableCache: true,
    })

    for (const product of response.products || []) {
      if (product.id) {
        stockByProductId.set(product.id, isProductInStock(product))
      }
    }
  }

  const inStockIds = productIds.filter((id) => stockByProductId.get(id) === true)
  const outOfStockIds = productIds.filter((id) => stockByProductId.get(id) !== true)

  return [...inStockIds, ...outOfStockIds]
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
  const inflight = getBrandProductsInflight()
  const cached = cache[cacheKey]

  if (cached && cached.expiresAt > Date.now()) {
    return cached.productIds
  }

  if (inflight[cacheKey]) {
    return inflight[cacheKey]
  }

  inflight[cacheKey] = (async () => {
    const dbIds = await getBrandProductIdsFromDatabase(brand.handle)
    const matchedIds = dbIds || (await getBrandProductIdsFromStoreFallback({ countryCode, brand }))
    const orderedByAvailability = await orderProductIdsByAvailability({
      countryCode,
      productIds: matchedIds,
    })

    if (!orderedByAvailability.length) {
      cache[cacheKey] = {
        productIds: [],
        expiresAt: Date.now() + BRAND_PRODUCTS_CACHE_TTL_MS,
      }
      return [] as string[]
    }

    cache[cacheKey] = {
      productIds: orderedByAvailability,
      expiresAt: Date.now() + BRAND_PRODUCTS_CACHE_TTL_MS,
    }

    return orderedByAvailability
  })()
    .finally(() => {
      delete inflight[cacheKey]
    })

  return inflight[cacheKey]
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
  const searchParams = await props.searchParams
  const brand = getBrandByHandle(params.handle)

  if (!brand) {
    notFound()
  }

  const [locale, region, brandProductIds] = await Promise.all([
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
  const pageSize = 10
  const requestedPage = Number(searchParams?.page || "1")
  const currentPage =
    Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1
  const totalProducts = brandProductIds.length
  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const offset = (safePage - 1) * pageSize
  const pagedIds = brandProductIds.slice(offset, offset + pageSize)

  const productsResponse = pagedIds.length
    ? await listProducts({
        countryCode: params.countryCode,
        queryParams: {
          id: pagedIds,
          limit: pagedIds.length,
        },
        disableCache: true,
      })
    : { response: { products: [] as HttpTypes.StoreProduct[] } }

  const productsById = new Map(
    (productsResponse.response.products || []).map((product) => [product.id, product] as const)
  )
  const orderedProducts = pagedIds
    .map((id) => productsById.get(id))
    .filter((product): product is HttpTypes.StoreProduct => Boolean(product))
  const sortedBrandProducts = sortByAvailability(orderedProducts)

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Brand",
    name: brandName,
    logo: brand.logo,
    url: `${getBaseURL()}/${params.countryCode}/brands/${brand.handle}`,
    description,
    numberOfItems: totalProducts,
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
                {totalProducts} {isArabic ? "منتج" : "Products"}
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
            {totalProducts > pageSize && (
              <Pagination page={safePage} totalPages={totalPages} data-testid="brand-pagination" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
