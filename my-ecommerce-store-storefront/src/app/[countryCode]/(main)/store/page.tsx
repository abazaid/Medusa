import { Metadata } from "next"

import { getBaseURL } from "@lib/util/env"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    q?: string
  }>
  params: Promise<{
    countryCode: string
  }>
}

export async function generateMetadata(props: Params): Promise<Metadata> {
  const params = await props.params
  const searchParams = await props.searchParams
  const q = (searchParams.q || "").trim()
  const canonical = `${getBaseURL()}/${params.countryCode}/store`

  return {
    title: "Shop All Products | Vape Hub KSA",
    description:
      "Browse all vape devices, e-liquids, and accessories at Vape Hub KSA with fast delivery across Saudi Arabia.",
    alternates: {
      canonical,
      languages: {
        ar: `${getBaseURL()}/ar/store`,
        "x-default": `${getBaseURL()}/ar/store`,
      },
    },
    robots: q
      ? {
          index: false,
          follow: true,
        }
      : {
          index: true,
          follow: true,
        },
    openGraph: {
      title: "Shop All Products | Vape Hub KSA",
      description:
        "Browse all vape devices, e-liquids, and accessories at Vape Hub KSA with fast delivery across Saudi Arabia.",
      url: canonical,
      type: "website",
    },
  }
}

export default async function StorePage(props: Params) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { sortBy, page, q } = searchParams

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      searchQuery={q}
      countryCode={params.countryCode}
    />
  )
}
