import { Metadata } from "next"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

export const metadata: Metadata = {
  title: "Shop All Products | Vape Hub KSA",
  description:
    "Browse all vape devices, e-liquids, and accessories at Vape Hub KSA with fast delivery across Saudi Arabia.",
}

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
