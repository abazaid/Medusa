import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getLocale } from "@lib/data/locale-actions"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { brands, getBrandByHandle, resolveBrand } from "@lib/data/brands"
import { getBaseURL } from "@lib/util/env"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPreview from "@modules/products/components/product-preview"

type PageProps = {
  params: Promise<{ countryCode: string; handle: string }>
}

const listAllProductsForBrandPage = async (countryCode: string) => {
  const products = []
  let pageParam = 1

  while (true) {
    const result = await listProducts({
      countryCode,
      pageParam,
      disableCache: true,
      queryParams: {
        limit: 100,
      },
    })

    products.push(...result.response.products)

    if (!result.nextPage) {
      break
    }

    pageParam = result.nextPage
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

  const locale = await getLocale()
  const isArabic = locale.toLowerCase() === "ar"
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
    listAllProductsForBrandPage(params.countryCode),
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

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Brand",
    name: brandName,
    logo: brand.logo,
    url: `${getBaseURL()}/${params.countryCode}/brands/${brand.handle}`,
    description,
    numberOfItems: brandProducts.length,
  }

  return (
    <div className="bg-[#eef0f3] py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="content-container">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
          <LocalizedClientLink
            href="/"
            className="text-sm font-semibold text-primary-700 transition-colors hover:text-primary-600"
          >
            {isArabic ? "العودة للرئيسية" : "Back to home"}
          </LocalizedClientLink>

          <div className="mt-6 grid gap-8 md:grid-cols-[220px_1fr]">
            <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <img
                src={brand.logo}
                alt={brandName}
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
                {brandProducts.length} {isArabic ? "منتج" : "Products"}
              </span>
            </div>

            {brandProducts.length ? (
              <ul className="mt-8 grid grid-cols-2 gap-6 small:grid-cols-3 medium:grid-cols-4">
                {brandProducts.map((product) => (
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
