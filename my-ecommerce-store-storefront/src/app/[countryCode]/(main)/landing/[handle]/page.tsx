import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { getBaseURL } from "@lib/util/env"
import {
  getSeoLandingBySlug,
  getSeoLandingSlug,
  seoLandings,
} from "@lib/data/seo-landings"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { sortByAvailability } from "@lib/util/product-availability"
import { getProductSlug } from "@lib/util/slug"
import { generateBreadcrumbJsonLd } from "@lib/util/structured-data"
import Breadcrumbs from "@modules/common/components/breadcrumbs"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPreview from "@modules/products/components/product-preview"

type PageProps = {
  params: Promise<{ countryCode: string; handle: string }>
}

export async function generateStaticParams() {
  return ["ar"].flatMap((countryCode) =>
    seoLandings.map((landing) => ({
      countryCode,
      handle: getSeoLandingSlug(landing, "ar"),
    }))
  )
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params
  const locale: "ar" = "ar"
  const isArabic = true
  const landing = getSeoLandingBySlug(params.handle, locale)

  if (!landing) {
    return {}
  }

  const arSlug = getSeoLandingSlug(landing, "ar")
  const canonicalSlug = getSeoLandingSlug(landing, locale)
  const canonical = `${getBaseURL()}/${params.countryCode}/landing/${encodeURIComponent(canonicalSlug)}`

  return {
    title: isArabic ? landing.titleAr : landing.titleEn,
    description: isArabic ? landing.descriptionAr : landing.descriptionEn,
    alternates: {
      canonical,
      languages: {
        ar: `${getBaseURL()}/ar/landing/${encodeURIComponent(arSlug)}`,
        "x-default": `${getBaseURL()}/ar/landing/${encodeURIComponent(arSlug)}`,
      },
    },
  }
}

export default async function LandingDetailPage(props: PageProps) {
  const params = await props.params
  const locale: "ar" = "ar"
  const isArabic = true
  const landing = getSeoLandingBySlug(params.handle, locale)

  if (!landing) {
    notFound()
  }

  const canonicalSlug = getSeoLandingSlug(landing, locale)
  if (decodeURIComponent(params.handle) !== canonicalSlug) {
    redirect(`/${params.countryCode}/landing/${encodeURIComponent(canonicalSlug)}`)
  }

  const region = await getRegion(params.countryCode)
  if (!region) {
    notFound()
  }

  const {
    response: { products },
  } = await listProducts({
    countryCode: params.countryCode,
    queryParams: {
      q: isArabic ? landing.keywordAr : landing.keywordEn,
      limit: 12,
    },
  })
  const sortedProducts = sortByAvailability(products || [])

  const breadcrumbSchema = generateBreadcrumbJsonLd([
    { name: isArabic ? "الرئيسية" : "Home", url: `${getBaseURL()}/${params.countryCode}` },
    { name: isArabic ? "صفحات SEO" : "SEO Landing Pages", url: `${getBaseURL()}/${params.countryCode}/landing` },
    {
      name: isArabic ? landing.titleAr : landing.titleEn,
      url: `${getBaseURL()}/${params.countryCode}/landing/${encodeURIComponent(canonicalSlug)}`,
    },
  ])

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: isArabic ? landing.titleAr : landing.titleEn,
    itemListElement: sortedProducts.slice(0, 12).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: product.title,
      url: `${getBaseURL()}/${params.countryCode}/products/${encodeURIComponent(
        getProductSlug(product, params.countryCode)
      )}`,
    })),
  }

  return (
    <div className="bg-[#eef0f3] py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <div className="content-container rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
        <Breadcrumbs
          items={[
            { label: isArabic ? "الرئيسية" : "Home", href: "/" },
            { label: isArabic ? "صفحات SEO" : "SEO Landing Pages", href: "/landing" },
            { label: isArabic ? landing.titleAr : landing.titleEn },
          ]}
        />
        <h1 className="text-3xl font-bold text-secondary-900 md:text-4xl">
          {isArabic ? landing.titleAr : landing.titleEn}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-secondary-700">
          {isArabic ? landing.descriptionAr : landing.descriptionEn}
        </p>

        <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
          <LocalizedClientLink href="/store" className="text-primary-700 hover:text-primary-600">
            {isArabic ? "تصفح كل المنتجات" : "Browse all products"}
          </LocalizedClientLink>
          <LocalizedClientLink href="/brands" className="text-primary-700 hover:text-primary-600">
            {isArabic ? "جميع الماركات" : "All brands"}
          </LocalizedClientLink>
          <LocalizedClientLink href="/blog" className="text-primary-700 hover:text-primary-600">
            {isArabic ? "المدونة" : "Blog"}
          </LocalizedClientLink>
        </div>

        <h2 className="mt-10 text-2xl font-bold text-secondary-900">
          {isArabic ? "منتجات مقترحة" : "Suggested products"}
        </h2>

        {sortedProducts.length ? (
          <ul className="mt-6 grid grid-cols-2 gap-6 small:grid-cols-3 medium:grid-cols-4">
            {sortedProducts.map((product) => (
              <li key={product.id}>
                <ProductPreview product={product} region={region} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-sm text-slate-600">
            {isArabic ? "لا توجد منتجات مطابقة حاليًا." : "No matching products yet."}
          </div>
        )}
      </div>
    </div>
  )
}
