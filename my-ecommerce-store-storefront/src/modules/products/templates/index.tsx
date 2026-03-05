import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import Breadcrumbs from "@modules/common/components/breadcrumbs"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import ProductActionsWrapper from "./product-actions-wrapper"
import {
  generateBreadcrumbJsonLd,
  generateFaqJsonLd,
  generateProductJsonLd,
  extractFaqFromMetadata,
} from "@lib/util/structured-data"
import { getBaseURL } from "@lib/util/env"
import { getCategorySlug, getProductSlug } from "@lib/util/slug"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  const jsonLd = generateProductJsonLd(product, region, countryCode)
  const baseUrl = getBaseURL()
  const locale = countryCode.toLowerCase() === "ar" ? "ar" : "en"
  const labels =
    locale === "ar"
      ? { home: "الرئيسية", store: "المتجر" }
      : { home: "Home", store: "Store" }
  const firstCategory = product.categories?.[0]
  const productSlug = getProductSlug(product, countryCode)
  const metadata = (product.metadata as Record<string, unknown> | null) || {}
  const faqItems = extractFaqFromMetadata(metadata, locale)
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    {
      name: labels.home,
      url: `${baseUrl}/${countryCode}`,
    },
    {
      name: labels.store,
      url: `${baseUrl}/${countryCode}/store`,
    },
    ...(firstCategory?.handle
      ? [
          {
            name: firstCategory.name || firstCategory.handle,
            url: `${baseUrl}/${countryCode}/categories/${encodeURIComponent(
              getCategorySlug(firstCategory, countryCode)
            )}`,
          },
        ]
      : []),
    {
      name: product.title,
      url: `${baseUrl}/${countryCode}/products/${encodeURIComponent(productSlug)}`,
    },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqItems.length ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateFaqJsonLd(faqItems)),
          }}
        />
      ) : null}
      <div className="content-container py-6">
        <Breadcrumbs
          items={[
            { label: labels.home, href: "/" },
            { label: labels.store, href: "/store" },
            ...(firstCategory?.handle
              ? [
                  {
                    label: firstCategory.name || firstCategory.handle,
                    href: `/categories/${encodeURIComponent(
                      getCategorySlug(firstCategory, countryCode)
                    )}`,
                  },
                ]
              : []),
            { label: product.title },
          ]}
        />
        <div
          className="flex flex-col small:flex-row small:items-start relative"
          data-testid="product-container"
        >
          <div className="flex flex-col small:sticky small:top-48 small:py-0 small:max-w-[300px] w-full py-8 gap-y-6">
            <ProductInfo product={product} countryCode={countryCode} />
            <ProductTabs product={product} />
          </div>
          <div className="block w-full relative">
            <ImageGallery images={images} />
          </div>
          <div className="flex flex-col small:sticky small:top-48 small:py-0 small:max-w-[300px] w-full py-8 gap-y-12">
            <ProductOnboardingCta />
            <Suspense
              fallback={
                <ProductActions
                  disabled={true}
                  product={product}
                  region={region}
                />
              }
            >
              <ProductActionsWrapper id={product.id} region={region} />
            </Suspense>
          </div>
        </div>
      </div>
      <div
        className="content-container my-16 small:my-32"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
