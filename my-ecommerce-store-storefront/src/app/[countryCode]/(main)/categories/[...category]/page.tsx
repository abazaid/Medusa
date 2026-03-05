import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle, listCategories } from "@lib/data/categories"
import { listRegions } from "@lib/data/regions"
import { getBaseURL } from "@lib/util/env"
import { StoreRegion } from "@medusajs/types"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type Props = {
  params: Promise<{ category: string[]; countryCode: string }>
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
}

export async function generateStaticParams() {
  const product_categories = await listCategories()

  if (!product_categories) {
    return []
  }

  const countryCodes = await listRegions().then((regions: StoreRegion[]) =>
    regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
  )

  const categoryHandles = product_categories.map(
    (category: any) => category.handle
  )

  const staticParams = countryCodes
    ?.map((countryCode: string | undefined) =>
      categoryHandles.map((handle: any) => ({
        countryCode,
        category: [handle],
      }))
    )
    .flat()

  return staticParams
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  try {
    const productCategory = await getCategoryByHandle(params.category)
    const metadata =
      (productCategory.metadata as Record<string, unknown> | null) || {}
    const metaTitle =
      typeof metadata.page_title === "string" && metadata.page_title.trim()
        ? metadata.page_title.trim()
        : typeof metadata.meta_title === "string" && metadata.meta_title.trim()
        ? metadata.meta_title.trim()
        : productCategory.name
    const metaDescription =
      typeof metadata.page_description === "string" &&
      metadata.page_description.trim()
        ? metadata.page_description.trim()
        : typeof metadata.meta_description === "string" &&
          metadata.meta_description.trim()
        ? metadata.meta_description.trim()
        : productCategory.description ??
          `تسوق منتجات ${productCategory.name} الأصلية داخل السعودية مع شحن سريع.`

    const canonical = `${getBaseURL()}/${params.countryCode}/categories/${params.category.join("/")}`

    return {
      title: metaTitle,
      description: metaDescription,
      alternates: {
        canonical,
      },
      openGraph: {
        title: metaTitle,
        description: metaDescription,
        url: canonical,
      },
    }
  } catch (error) {
    notFound()
  }
}

export default async function CategoryPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page } = searchParams

  const productCategory = await getCategoryByHandle(params.category)

  if (!productCategory) {
    notFound()
  }

  return (
    <CategoryTemplate
      category={productCategory}
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
    />
  )
}
