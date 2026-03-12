import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCollectionByHandle, listCollections } from "@lib/data/collections"
import { getBaseURL } from "@lib/util/env"
import { StoreCollection } from "@medusajs/types"
import CollectionTemplate from "@modules/collections/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type Props = {
  params: Promise<{ handle: string; countryCode: string }>
  searchParams: Promise<{
    page?: string
    sortBy?: SortOptions
  }>
}

export const PRODUCT_LIMIT = 12

export async function generateStaticParams() {
  const { collections } = await listCollections({
    fields: "handle",
  })

  if (!collections) {
    return []
  }

  const countryCodes = ["ar"]

  const collectionHandles = collections.map(
    (collection: StoreCollection) => collection.handle
  )

  const staticParams = countryCodes
    ?.map((countryCode: string) =>
      collectionHandles.map((handle: string | undefined) => ({
        countryCode,
        handle,
      }))
    )
    .flat()

  return staticParams
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const collection = await getCollectionByHandle(params.handle)

  if (!collection) {
    notFound()
  }
  const isArabic = params.countryCode.toLowerCase() === "ar"
  const title = isArabic
    ? `${collection.title} | مجموعة منتجات فيب في السعودية`
    : `${collection.title} | Vape Collection in Saudi Arabia`
  const description = isArabic
    ? `تصفح مجموعة ${collection.title} مع أفضل منتجات الفيب الأصلية والتوصيل السريع داخل السعودية.`
    : `Browse ${collection.title} with original vape products and fast shipping across Saudi Arabia.`
  const canonical = `${getBaseURL()}/${params.countryCode}/collections/${collection.handle}`

  const metadata = {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ar: `${getBaseURL()}/ar/collections/${collection.handle}`,
        "x-default": `${getBaseURL()}/ar/collections/${collection.handle}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
  } as Metadata

  return metadata
}

export default async function CollectionPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page } = searchParams

  const collection = await getCollectionByHandle(params.handle).then(
    (collection: StoreCollection) => collection
  )

  if (!collection) {
    notFound()
  }

  return (
    <CollectionTemplate
      collection={collection}
      page={page}
      sortBy={sortBy}
      countryCode={params.countryCode}
    />
  )
}
