import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { getCategoryByHandle, listCategories } from "@lib/data/categories"
import { getBaseURL } from "@lib/util/env"
import {
  getCategorySlug,
  getProductSlug,
  normalizeComparableSlug,
} from "@lib/util/slug"
import {
  extractFaqFromMetadata,
  generateBreadcrumbJsonLd,
  generateFaqJsonLd,
} from "@lib/util/structured-data"
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

  const countryCodes = ["ar", "en"]

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
  const searchParams = await props.searchParams
  try {
    const productCategory = await getCategoryByHandle(params.category, params.countryCode)
    if (!productCategory) {
      notFound()
    }
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

    const canonicalSlug = getCategorySlug(productCategory, params.countryCode)
    const canonical = `${getBaseURL()}/${params.countryCode}/categories/${encodeURIComponent(
      canonicalSlug
    )}`
    const arSlug = getCategorySlug(productCategory, "ar")
    const enSlug = getCategorySlug(productCategory, "en")

    return {
      title: metaTitle,
      description: metaDescription,
      robots:
        searchParams?.page || searchParams?.sortBy
          ? {
              index: false,
              follow: true,
            }
          : {
              index: true,
              follow: true,
            },
      alternates: {
        canonical,
        languages: {
          ar: `${getBaseURL()}/ar/categories/${encodeURIComponent(arSlug)}`,
          en: `${getBaseURL()}/en/categories/${encodeURIComponent(enSlug)}`,
          "x-default": `${getBaseURL()}/ar/categories/${encodeURIComponent(arSlug)}`,
        },
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

  const productCategory = await getCategoryByHandle(params.category, params.countryCode)

  if (!productCategory) {
    notFound()
  }
  const canonicalCategorySlug = getCategorySlug(productCategory, params.countryCode)
  if (
    normalizeComparableSlug(params.category.join("/")) !==
    normalizeComparableSlug(canonicalCategorySlug)
  ) {
    redirect(
      `/${params.countryCode}/categories/${encodeURIComponent(canonicalCategorySlug)}`
    )
  }

  const baseUrl = getBaseURL()
  const locale = params.countryCode.toLowerCase() === "ar" ? "ar" : "en"
  const labels =
    locale === "ar"
      ? { home: "الرئيسية", store: "المتجر" }
      : { home: "Home", store: "Store" }
  const parentChain: { name: string; handle: string }[] = []
  let pointer = productCategory.parent_category
  while (pointer) {
    parentChain.unshift({ name: pointer.name || pointer.handle, handle: pointer.handle })
    pointer = pointer.parent_category
  }

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: labels.home, url: `${baseUrl}/${params.countryCode}` },
    { name: labels.store, url: `${baseUrl}/${params.countryCode}/store` },
    ...parentChain.map((parent) => ({
      name: parent.name,
      url: `${baseUrl}/${params.countryCode}/categories/${encodeURIComponent(
        getCategorySlug(parent, params.countryCode)
      )}`,
    })),
    {
      name: productCategory.name || productCategory.handle,
      url: `${baseUrl}/${params.countryCode}/categories/${encodeURIComponent(
        getCategorySlug(productCategory, params.countryCode)
      )}`,
    },
  ])

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: productCategory.name || productCategory.handle,
    itemListElement: (productCategory.products || []).slice(0, 24).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${baseUrl}/${params.countryCode}/products/${encodeURIComponent(
        getProductSlug(product, params.countryCode)
      )}`,
      name: product.title || product.handle,
    })),
  }
  const categoryMetadata =
    (productCategory.metadata as Record<string, unknown> | null) || {}
  const faqItems = extractFaqFromMetadata(categoryMetadata, locale)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      {faqItems.length ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateFaqJsonLd(faqItems)),
          }}
        />
      ) : null}
      <CategoryTemplate
        category={productCategory}
        sortBy={sortBy}
        page={page}
        countryCode={params.countryCode}
      />
    </>
  )
}
