import { Metadata } from "next"

import { getLocale } from "@lib/data/locale-actions"
import { listProducts } from "@lib/data/products"
import StorefrontHome from "@modules/home/templates/storefront-home"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "Vape Hub KSA | Best Vape Shop in Saudi Arabia - Free Delivery",
  description:
    "Vape Hub KSA is your one-stop shop for premium vape devices, e-liquids, and accessories in Saudi Arabia. Free same-day delivery in Riyadh, Jeddah & Dammam. Shop now!",
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
      limit: 12,
    },
  })

  if (!region) {
    return null
  }

  return (
    <StorefrontHome
      collections={collections || []}
      locale={locale}
      products={products || []}
      region={region}
    />
  )
}
