import { Metadata } from "next"

import { getBaseURL } from "@lib/util/env"
import { getSeoLandingSlug, seoLandings } from "@lib/data/seo-landings"
import { generateBreadcrumbJsonLd } from "@lib/util/structured-data"
import Breadcrumbs from "@modules/common/components/breadcrumbs"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type PageProps = {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params
  const isArabic = params.countryCode.toLowerCase() === "ar"
  const title = isArabic
    ? "صفحات SEO المخصصة | Vape Hub KSA"
    : "SEO Landing Pages | Vape Hub KSA"
  const description = isArabic
    ? "أرشيف صفحات SEO المخصصة لاستهداف كلمات بحث عالية النية الشرائية داخل السعودية."
    : "A curated archive of SEO landing pages targeting high-intent vaping searches in Saudi Arabia."
  const canonical = `${getBaseURL()}/${params.countryCode}/landing`

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ar: `${getBaseURL()}/ar/landing`,
        "x-default": `${getBaseURL()}/ar/landing`,
      },
    },
  }
}

export default async function LandingArchivePage(props: PageProps) {
  const params = await props.params
  const locale: "ar" = "ar"
  const isArabic = true
  const pageTitle = isArabic ? "صفحات SEO المخصصة" : "SEO Landing Pages"
  const pageUrl = `${getBaseURL()}/${params.countryCode}/landing`

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: pageTitle,
    itemListElement: seoLandings.map((landing, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: isArabic ? landing.titleAr : landing.titleEn,
      url: `${pageUrl}/${encodeURIComponent(getSeoLandingSlug(landing, locale))}`,
    })),
  }

  const breadcrumbSchema = generateBreadcrumbJsonLd([
    { name: isArabic ? "الرئيسية" : "Home", url: `${getBaseURL()}/${params.countryCode}` },
    { name: pageTitle, url: pageUrl },
  ])

  return (
    <div className="bg-[#eef0f3] py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="content-container rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
        <Breadcrumbs
          items={[
            { label: isArabic ? "الرئيسية" : "Home", href: "/" },
            { label: pageTitle },
          ]}
        />
        <h1 className="text-3xl font-bold text-secondary-900 md:text-4xl">
          {pageTitle}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-secondary-700">
          {isArabic
            ? "صفحات هبوط مهيكلة لاستهداف كلمات بحث تجارية وربطها مباشرة بالمنتجات ذات الصلة."
            : "Structured landing pages targeting commercial intent keywords and directly linking to relevant products."}
        </p>

        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {seoLandings.map((landing) => (
            <li key={landing.id} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-xl font-bold text-secondary-900">
                {isArabic ? landing.titleAr : landing.titleEn}
              </h2>
              <p className="mt-2 text-sm leading-7 text-secondary-700">
                {isArabic ? landing.descriptionAr : landing.descriptionEn}
              </p>
              <LocalizedClientLink
                href={`/landing/${encodeURIComponent(getSeoLandingSlug(landing, locale))}`}
                className="mt-4 inline-flex text-sm font-semibold text-primary-700 hover:text-primary-600"
              >
                {isArabic ? "فتح الصفحة" : "Open page"}
              </LocalizedClientLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
