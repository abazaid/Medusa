import { Metadata } from "next"

import { getLocale } from "@lib/data/locale-actions"
import { listProducts } from "@lib/data/products"
import { getBaseURL } from "@lib/util/env"
import { sortByAvailability } from "@lib/util/product-availability"
import {
  generateOrganizationJsonLd,
} from "@lib/util/structured-data"
import StorefrontHome from "@modules/home/templates/storefront-home"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const params = await props.params
  const canonical = `${getBaseURL()}/${params.countryCode}`

  return {
    title: "Vape Hub KSA | Best Vape Shop in Saudi Arabia - Free Delivery",
    description:
      "Vape Hub KSA is your one-stop shop for premium vape devices, e-liquids, and accessories in Saudi Arabia. Free same-day delivery in Riyadh, Jeddah & Dammam. Shop now!",
    alternates: {
      canonical,
      languages: {
        ar: `${getBaseURL()}/ar`,
        "x-default": `${getBaseURL()}/ar`,
      },
    },
    openGraph: {
      title: "Vape Hub KSA | Best Vape Shop in Saudi Arabia - Free Delivery",
      description:
        "Vape Hub KSA is your one-stop shop for premium vape devices, e-liquids, and accessories in Saudi Arabia. Free same-day delivery in Riyadh, Jeddah & Dammam. Shop now!",
      url: canonical,
      type: "website",
    },
  }
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const locale = await getLocale()
  const region = await getRegion(countryCode)

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  const {
    response: { products },
  } = await listProducts({
    countryCode,
    queryParams: {
      limit: 24,
      fields:
        "id,title,handle,thumbnail,*images,*categories,*variants,*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,+metadata,+tags",
    },
  })
  const sortedProducts = sortByAvailability(products || [])

  if (!region) {
    return null
  }

  const organizationJsonLd = generateOrganizationJsonLd()
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Vape Hub KSA",
    alternateName: "مركز الفيب السعودي",
    url: `${getBaseURL()}/${countryCode}`,
    inLanguage: ["ar-SA"],
    potentialAction: {
      "@type": "SearchAction",
      target: `${getBaseURL()}/${countryCode}/store?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <StorefrontHome
        collections={collections || []}
        locale={locale}
        products={sortedProducts}
        region={region}
      />
    </>
  )
}
