import { notFound } from "next/navigation"
import { Suspense } from "react"

import { HttpTypes } from "@medusajs/types"
import { getProductFacets, type ProductFilters } from "@lib/data/products"
import { getCategorySlug } from "@lib/util/slug"
import Breadcrumbs from "@modules/common/components/breadcrumbs"
import InteractiveLink from "@modules/common/components/interactive-link"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"

const buildSeoContent = ({
  categoryName,
  description,
  isArabic,
}: {
  categoryName: string
  description?: string | null
  isArabic: boolean
}) => {
  if (!isArabic) {
    return {
      title: `Best ${categoryName} in Saudi Arabia`,
      paragraphs: [
        description ||
          `Browse original ${categoryName} products with fast shipping and verified availability in Saudi Arabia.`,
        `This category is curated to surface top-selling options, trusted brands, and high-demand variants so shoppers can compare quickly and buy with confidence.`,
      ],
      faqs: [
        {
          q: `How do I choose the right ${categoryName}?`,
          a: "Check stock status, nicotine strength (if applicable), and product type before checkout.",
        },
        {
          q: "How fast is delivery?",
          a: "Orders are processed quickly and delivered across Saudi Arabia based on city coverage.",
        },
      ],
    }
  }

  return {
    title: `أفضل منتجات ${categoryName} الأصلية في السعودية`,
    paragraphs: [
      description ||
        `تصفح تشكيلة ${categoryName} الأصلية مع شحن سريع داخل السعودية وتحديث مستمر على المنتجات المتوفرة بالمخزون.`,
      `تم تصميم هذه الصفحة لتسهيل المقارنة بين المنتجات حسب السعر والتوفر والماركة، حتى تصل إلى الخيار المناسب بسرعة وبثقة أكبر.`,
      `جميع المنتجات المعروضة هنا تخضع لتحديثات مستمرة في البيانات والأسعار، مع إبراز الخيارات الأكثر طلبًا والأعلى تقييمًا.`,
    ],
    faqs: [
      {
        q: `كيف أختار ${categoryName} المناسب؟`,
        a: "اعتمد على نوع المنتج، قوة النيكوتين، والتوفر بالمخزون قبل إتمام الطلب.",
      },
      {
        q: "هل الأسعار محدثة؟",
        a: "نعم، الأسعار والمخزون تتحدث بشكل دوري لضمان عرض بيانات دقيقة قبل الشراء.",
      },
      {
        q: "كم مدة التوصيل؟",
        a: "يتم تجهيز الطلبات بسرعة، وتختلف مدة التوصيل حسب المدينة وشركة الشحن.",
      },
    ],
  }
}

export default async function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
  filters,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
  filters?: ProductFilters
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  if (!category || !countryCode) notFound()

  const parents = [] as HttpTypes.StoreProductCategory[]
  const isArabic = countryCode.toLowerCase() === "ar"

  const getParents = (currentCategory: HttpTypes.StoreProductCategory) => {
    if (currentCategory.parent_category) {
      parents.push(currentCategory.parent_category)
      getParents(currentCategory.parent_category)
    }
  }

  getParents(category)

  const topCategories = (category.category_children || []).slice(0, 4)
  const seo = buildSeoContent({
    categoryName: category.name || category.handle || "",
    description: category.description,
    isArabic,
  })
  const facets = await getProductFacets({
    countryCode,
    queryParams: {
      category_id: [category.id],
    },
  })

  return (
    <div className="bg-[#eceff3] py-6" data-testid="category-container">
      <div className="content-container">
        <Breadcrumbs
          items={[
            { label: isArabic ? "الرئيسية" : "Home", href: "/" },
            { label: isArabic ? "المتجر" : "Store", href: "/store" },
            ...parents
              .slice()
              .reverse()
              .map((parent) => ({
                label: parent.name || "",
                href: `/categories/${encodeURIComponent(getCategorySlug(parent, countryCode))}`,
              })),
            { label: category.name || category.handle || "" },
          ]}
        />

        <section className="mt-4 rounded-md bg-[#3a4457] p-6 text-white">
          <h1 className="text-4xl font-extrabold leading-tight" data-testid="category-page-title">
            {category.name}
          </h1>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-100">
            {category.description ||
              (isArabic
                ? `تسوق أفضل منتجات ${category.name} الأصلية مع خيارات متنوعة وأسعار محدثة وتوصيل سريع داخل السعودية.`
                : `Shop original ${category.name} products with fast delivery and updated pricing.`)}
          </p>
          {topCategories.length ? (
            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {topCategories.map((c) => (
                <LocalizedClientLink
                  key={c.id}
                  href={`/categories/${encodeURIComponent(getCategorySlug(c, countryCode))}`}
                  className="rounded-sm bg-white px-4 py-3 text-[#1f2b44] transition-colors hover:bg-slate-100"
                >
                  <div className="text-xs font-bold uppercase tracking-[0.14em]">
                    {isArabic ? "تصفح القسم" : "Browse Category"}
                  </div>
                  <div className="mt-1 text-base font-extrabold">{c.name}</div>
                </LocalizedClientLink>
              ))}
            </div>
          ) : null}
        </section>

        <div className="mt-5">
          <RefinementList sortBy={sort} variant="toolbar" data-testid="sort-by-container" />
        </div>

        <div className="mt-4 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <RefinementList sortBy={sort} variant="sidebar" facets={facets} selected={filters} />
          <div>
            <Suspense
              fallback={
                <SkeletonProductGrid
                  numberOfProducts={category.products?.length ?? 8}
                />
              }
            >
              <PaginatedProducts
                sortBy={sort}
                page={pageNumber}
                categoryId={category.id}
                countryCode={countryCode}
                cardVariant="category"
                showQuickAdd
                filters={filters}
              />
            </Suspense>
          </div>
        </div>

        <section className="mt-8 rounded-md bg-white p-6">
          <h2 className="text-3xl font-extrabold text-[#163b66]">{seo.title}</h2>
          <div className="mt-4 space-y-4 text-sm leading-8 text-slate-700">
            {seo.paragraphs.map((paragraph, index) => (
              <p key={`seo-paragraph-${index}`}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-8 space-y-3">
            {seo.faqs.map((faq, index) => (
              <details key={`faq-${index}`} className="rounded border border-slate-200 p-4">
                <summary className="cursor-pointer font-bold text-[#1f2b44]">{faq.q}</summary>
                <p className="mt-3 text-sm text-slate-700">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {category.category_children?.length ? (
          <section className="mt-8 rounded-md bg-white p-6">
            <h3 className="text-xl font-bold text-[#1f2b44]">
              {isArabic ? "أقسام مرتبطة" : "Related Categories"}
            </h3>
            <ul className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
              {category.category_children?.map((c) => (
                <li key={c.id}>
                  <InteractiveLink
                    href={`/categories/${encodeURIComponent(
                      getCategorySlug(c, countryCode)
                    )}`}
                  >
                    {c.name}
                  </InteractiveLink>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  )
}
