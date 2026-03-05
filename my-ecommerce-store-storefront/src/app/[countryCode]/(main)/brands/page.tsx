import { Metadata } from "next"

import { brands } from "@lib/data/brands"
import { getLocale } from "@lib/data/locale-actions"
import { getBaseURL } from "@lib/util/env"
import BrandsArchive from "@modules/brands/templates/brands-archive"

type PageProps = {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params
  const isArabic = params.countryCode.toLowerCase() === "ar"
  const title = isArabic
    ? "جميع الماركات | أرشيف الماركات التجارية"
    : "All Brands | Brand Directory"
  const description = isArabic
    ? "أرشيف كامل لجميع الماركات التجارية المتوفرة مع بحث سريع وفلاتر لسهولة الوصول إلى صفحة كل ماركة."
    : "A complete directory of every available brand with quick search and filters to reach each brand page easily."
  const canonical = `${getBaseURL()}/${params.countryCode}/brands`

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ar: `${getBaseURL()}/ar/brands`,
        en: `${getBaseURL()}/en/brands`,
        "x-default": `${getBaseURL()}/ar/brands`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
    },
  }
}

export default async function BrandsPage(props: PageProps) {
  const params = await props.params
  const locale = await getLocale()
  const isArabic = locale.toLowerCase() === "ar"
  const title = isArabic
    ? "أرشيف الماركات التجارية"
    : "Brand Directory"
  const description = isArabic
    ? "صفحة تجمع كل الماركات التجارية المتوفرة داخل المتجر مع إمكانية البحث والفلترة."
    : "A single page that lists every available store brand with search and filtering."
  const pageUrl = `${getBaseURL()}/${params.countryCode}/brands`

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: pageUrl,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: brands.length,
      itemListElement: brands.map((brand, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${pageUrl}/${brand.handle}`,
        name: isArabic ? brand.nameAr : brand.nameEn,
      })),
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <BrandsArchive brands={brands} locale={locale} />
    </>
  )
}
