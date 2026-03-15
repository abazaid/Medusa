import React, { Suspense } from "react"
import { notFound } from "next/navigation"

import { HttpTypes } from "@medusajs/types"

import Breadcrumbs from "@modules/common/components/breadcrumbs"
import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { listProductReviews } from "@lib/data/product-reviews"

import ProductActionsWrapper from "./product-actions-wrapper"

import { getBaseURL } from "@lib/util/env"
import { getCategorySlug, getProductSlug } from "@lib/util/slug"
import {
  extractFaqFromMetadata,
  generateBreadcrumbJsonLd,
  generateFaqJsonLd,
  generateProductJsonLd,
} from "@lib/util/structured-data"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const parseArray = <T,>(value: unknown): T[] => {
  if (!value) return []
  if (Array.isArray(value)) return value as T[]
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? (parsed as T[]) : []
    } catch {
      return []
    }
  }
  return []
}

const sanitizeDescription = (value?: string | null) =>
  (value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/ on\w+="[^"]*"/gi, "")
    .replace(/ on\w+='[^']*'/gi, "")
    // Remove legacy injected SEO blocks from product descriptions.
    .replace(
      /<h[1-6][^>]*>\s*(تفاصيل المميزات|Feature Sections)\s*<\/h[1-6]>[\s\S]*?(?=<h[1-6][^>]*>|$)/gi,
      ""
    )
    .replace(
      /<h[1-6][^>]*>\s*(المواصفات|Specifications)\s*<\/h[1-6]>[\s\S]*?(?=<h[1-6][^>]*>|$)/gi,
      ""
    )
    .replace(
      /<h[1-6][^>]*>\s*(محتويات العلبة|What's in the Box)\s*<\/h[1-6]>[\s\S]*?(?=<h[1-6][^>]*>|$)/gi,
      ""
    )
    .replace(
      /<h[1-6][^>]*>\s*(دليل قوة النيكوتين|Nicotine Strength Guide)\s*<\/h[1-6]>[\s\S]*?(?=<h[1-6][^>]*>|$)/gi,
      ""
    )
    .replace(
      /<table[\s\S]*?(عدد\s*السجائر|النيكوتين\s*المناسب|Cigarettes\s*per\s*day|Recommended\s*nicotine)[\s\S]*?<\/table>/gi,
      ""
    )

const isSaltNicotineProduct = (product: HttpTypes.StoreProduct) => {
  const metadata = (product.metadata as Record<string, unknown> | null) || {}
  const hint = [
    product.title,
    product.description,
    ...(product.categories || []).map((c) => c.name),
    ...(product.tags || []).map((t) => t.value),
    String(metadata.nicotine_type || ""),
    String(metadata.product_type || ""),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return /(nic\s*salt|salt\s*nicotine|salt\s*e-?liquid|سولت|nicotine salt)/i.test(hint)
}

const renderStars = (rating: number) =>
  "★".repeat(Math.max(0, Math.min(5, Math.round(rating))))

const ProductTemplate = async ({
  product,
  region,
  countryCode,
  images,
}: ProductTemplateProps) => {
  if (!product || !product.id) {
    return notFound()
  }

  const baseUrl = getBaseURL()
  const locale = countryCode.toLowerCase() === "ar" ? "ar" : "en"
  const isArabic = locale === "ar"
  const labels =
    locale === "ar"
      ? {
          home: "الرئيسية",
          store: "المتجر",
          description: "وصف المنتج",
          reviews: "تقييمات العملاء",
          delivery: "معلومات التوصيل والإرجاع",
          replacement: "منتجات بديلة ومرتبطة",
          related: "منتجات ذات صلة",
          tabDescription: "الوصف",
          tabReplacements: "البدائل",
          tabDelivery: "التوصيل",
          tabReviews: "التقييمات",
        }
      : {
          home: "Home",
          store: "Store",
          description: "Product Description",
          reviews: "Customer Reviews",
          delivery: "Delivery Information",
          replacement: "Replacement Items",
          related: "Related Products",
          tabDescription: "Description",
          tabReplacements: "Replacements",
          tabDelivery: "Delivery",
          tabReviews: "Reviews",
        }

  const metadata = (product.metadata as Record<string, unknown> | null) || {}
  const productSlug = getProductSlug(product, countryCode)
  const firstCategory = product.categories?.[0]
  const descriptionHtml = sanitizeDescription(product.description)

  const faqItems = extractFaqFromMetadata(metadata, locale)
  const reviewCount =
    typeof metadata.review_count === "number"
      ? metadata.review_count
      : typeof metadata.review_count === "string"
        ? Number(metadata.review_count) || 0
        : 0
  const ratingValue =
    typeof metadata.rating_value === "number"
      ? metadata.rating_value
      : typeof metadata.rating_value === "string"
        ? Number(metadata.rating_value) || 0
        : 0
  const { reviews } = await listProductReviews({
    productId: product.id,
    limit: 8,
  })

  const isSaltProduct = isSaltNicotineProduct(product)
  const showReplacementTab = !isSaltProduct
  const deliveryCards =
    locale === "ar"
      ? [
          "اطلب قبل 6 مساء للشحن السريع",
          "توصيل سريع داخل السعودية",
        ]
      : [
          "Order before 6 PM for faster dispatch",
          "Fast delivery across Saudi Arabia",
        ]


  const deliveryItems = parseArray<string>(metadata.delivery_information)
  const fallbackDeliveryItems = isArabic
    ? [
        "شحن سريع داخل السعودية خلال 1-3 أيام عمل.",
        "الدفع الإلكتروني والدفع عند الاستلام حسب المدينة.",
        "إمكانية الإرجاع وفق سياسة المتجر.",
      ]
    : [
        "Fast shipping across Saudi Arabia in 1-3 business days.",
        "Online payment and cash-on-delivery availability depends on city.",
        "Returns accepted according to store policy.",
      ]

  const jsonLd = generateProductJsonLd(product, region, countryCode)
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

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <ImageGallery
                images={images}
                productTitle={product.title || ""}
                locale={locale}
              />
            </div>

            <div className="space-y-5">
              <ProductInfo
                product={product}
                countryCode={countryCode}
                showDescription={false}
              />
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="mb-1 font-semibold">
                  {ratingValue.toFixed(1)} / 5
                </div>
                <div className="text-amber-500">{renderStars(ratingValue)}</div>
                <div className="text-slate-600">
                  {reviewCount > 0
                    ? `${reviewCount} ${isArabic ? "مراجعة" : "reviews"}`
                    : isArabic
                      ? "لا توجد مراجعات حتى الآن"
                      : "No reviews yet"}
                </div>
              </div>

              <Suspense
                fallback={
                  <ProductActions
                    disabled
                    product={product}
                    region={region}
                  />
                }
              >
                <ProductActionsWrapper id={product.id} region={region} />
              </Suspense>

              <div className="grid gap-2">
                {deliveryCards.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 md:p-6">
          <div className="product-tabs">
            <input
              id="product-tab-description"
              className="product-tab-input"
              type="radio"
              name="product-tab-group"
              defaultChecked
            />
            {showReplacementTab ? (
              <input
                id="product-tab-replacements"
                className="product-tab-input"
                type="radio"
                name="product-tab-group"
              />
            ) : null}
            <input
              id="product-tab-delivery"
              className="product-tab-input"
              type="radio"
              name="product-tab-group"
            />
            <input
              id="product-tab-reviews"
              className="product-tab-input"
              type="radio"
              name="product-tab-group"
            />

            <div className="tab-nav border-b border-slate-200">
              <label htmlFor="product-tab-description" className="tab-label">
                {labels.tabDescription}
              </label>
              {showReplacementTab ? (
                <label htmlFor="product-tab-replacements" className="tab-label">
                  {labels.tabReplacements}
                </label>
              ) : null}
              <label htmlFor="product-tab-delivery" className="tab-label">
                {labels.tabDelivery}
              </label>
              <label htmlFor="product-tab-reviews" className="tab-label">
                {labels.tabReviews}
              </label>
            </div>

            <div className="tab-panels mt-6">
              <div className="tab-panel tab-panel-description">
                <h2 className="text-xl font-bold text-secondary-900">{labels.description}</h2>
                {descriptionHtml ? (
                  <div
                    className="mt-3 text-medium text-ui-fg-subtle leading-8 break-words [&_a]:text-primary-700 [&_a]:underline [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-bold [&_iframe]:w-full [&_iframe]:min-h-[220px] [&_iframe]:rounded-2xl [&_li]:mb-2 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pr-6 [&_p]:mb-4 [&_strong]:font-bold [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pr-6"
                    dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                  />
                ) : (
                  <p className="mt-3 text-sm text-slate-600">
                    {isArabic
                      ? "لا يوجد وصف مفصل لهذا المنتج بعد."
                      : "No detailed description available yet."}
                  </p>
                )}

              </div>

              {showReplacementTab ? (
                <div className="tab-panel tab-panel-replacements">
                <Suspense fallback={<SkeletonRelatedProducts />}>
                  <RelatedProducts
                    product={product}
                    countryCode={countryCode}
                    title={labels.replacement}
                    subtitle={
                      isArabic
                        ? "بودات بديلة، كويلات، وسوائل مرتبطة بهذا المنتج."
                        : "Replacement pods, coils, and related e-liquids."
                    }
                  />
                </Suspense>
                </div>
              ) : null}

              <div className="tab-panel tab-panel-delivery">
                <h2 className="text-xl font-bold text-secondary-900">{labels.delivery}</h2>
                <ul className="mt-4 list-disc space-y-2 pr-5 text-sm text-slate-700">
                  {(deliveryItems.length ? deliveryItems : fallbackDeliveryItems).map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="tab-panel tab-panel-reviews">
                <h2 className="text-xl font-bold text-secondary-900">{labels.reviews}</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <div className="text-2xl font-bold text-secondary-900">
                      {ratingValue.toFixed(1)} / 5
                    </div>
                    <div className="mt-1 text-amber-500">{renderStars(ratingValue)}</div>
                    <p className="mt-2 text-sm text-slate-600">
                      {reviewCount > 0
                        ? `${reviewCount} ${isArabic ? "مراجعة موثقة" : "verified reviews"}`
                        : isArabic
                          ? "أول من يضيف تقييمًا لهذا المنتج."
                          : "Be the first to review this product."}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    {isArabic
                      ? "يمكنك إضافة تقييمك بعد شراء المنتج لتساعد العملاء على اختيار أفضل جهاز مناسب."
                      : "You can leave a review after purchase to help other customers choose the right device."}
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  {reviews.length ? (
                    reviews.map((review) => (
                      <article
                        key={review.id}
                        className="rounded-lg border border-slate-200 bg-white p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-secondary-900">
                              {review.name || (isArabic ? "عميل موثق" : "Verified customer")}
                            </p>
                            <div className="mt-1 text-sm text-amber-500">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                          <p className="text-xs text-slate-500">
                            {review.created_at
                              ? new Intl.DateTimeFormat(isArabic ? "ar-SA" : "en-US", {
                                  dateStyle: "medium",
                                }).format(new Date(review.created_at))
                              : ""}
                          </p>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-700">
                          {review.content || (isArabic ? "لا يوجد نص للمراجعة." : "No review text provided.")}
                        </p>
                        {review.response?.content ? (
                          <div className="mt-4 rounded-md border border-sky-100 bg-sky-50 p-3 text-sm text-slate-700">
                            <p className="font-semibold text-sky-900">
                              {isArabic ? "رد المتجر" : "Store response"}
                            </p>
                            <p className="mt-1 leading-7">{review.response.content}</p>
                          </div>
                        ) : null}
                      </article>
                    ))
                  ) : (
                    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                      {isArabic
                        ? "لا توجد مراجعات حقيقية لهذا المنتج حتى الآن. ستظهر هنا التقييمات المعتمدة بعد إضافتها."
                        : "No approved reviews for this product yet. Approved customer reviews will appear here."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <style>{`
            .product-tab-input {
              position: absolute;
              opacity: 0;
              pointer-events: none;
            }
            .tab-nav {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
            }
            .tab-label {
              cursor: pointer;
              border-bottom: 2px solid transparent;
              border-top-left-radius: 8px;
              border-top-right-radius: 8px;
              padding: 12px 20px;
              font-size: 14px;
              font-weight: 700;
              color: #64748b;
            }
            .tab-panel {
              display: none;
            }
            #product-tab-description:checked ~ .tab-nav label[for="product-tab-description"],
            #product-tab-replacements:checked ~ .tab-nav label[for="product-tab-replacements"],
            #product-tab-delivery:checked ~ .tab-nav label[for="product-tab-delivery"],
            #product-tab-reviews:checked ~ .tab-nav label[for="product-tab-reviews"] {
              background: #e0f2fe;
              border-bottom-color: #0ea5e9;
              color: #0f172a;
            }
            #product-tab-description:checked ~ .tab-panels .tab-panel-description,
            #product-tab-replacements:checked ~ .tab-panels .tab-panel-replacements,
            #product-tab-delivery:checked ~ .tab-panels .tab-panel-delivery,
            #product-tab-reviews:checked ~ .tab-panels .tab-panel-reviews {
              display: block;
            }
          `}</style>
        </section>
      </div>

      <div className="content-container my-12">
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts
            product={product}
            countryCode={countryCode}
            title={labels.related}
            subtitle={
              isArabic
                ? "منتجات أخرى مشابهة قد تناسبك."
                : "More products you may also like."
            }
          />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate

