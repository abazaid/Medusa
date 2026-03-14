import { Suspense } from "react"

import { getProductFacets, type ProductFilters } from "@lib/data/products"
import Breadcrumbs from "@modules/common/components/breadcrumbs"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

import PaginatedProducts from "./paginated-products"

const buildStoreSeo = (isArabic: boolean, query?: string) => {
  if (!isArabic) {
    return {
      title: query ? `Search Results for ${query}` : "Shop All Vape Products in Saudi Arabia",
      desc: query
        ? `Browse matching vape products for ${query} with updated pricing and stock status.`
        : "Discover devices, pods, salts, coils, and accessories from trusted brands with fast shipping in Saudi Arabia.",
      paragraphs: [
        "Our store page is structured to help customers compare products quickly through sorting, filtering, and clear card summaries.",
        "You can prioritize best-selling products, latest arrivals, or price-based sorting to find the right product faster.",
      ],
    }
  }

  return {
    title: query ? `نتائج البحث عن: ${query}` : "تسوق جميع منتجات الفيب الأصلية في السعودية",
    desc: query
      ? `اعرض المنتجات المطابقة لعبارة ${query} مع أسعار محدثة وحالة مخزون واضحة قبل الشراء.`
      : "اكتشف الأجهزة، البودات، النكهات، الكويلات، والإكسسوارات من ماركات موثوقة مع شحن سريع داخل السعودية.",
    paragraphs: [
      "تم تصميم صفحة المتجر لتسهيل المقارنة بين المنتجات بسرعة عبر الفرز والفلاتر مع عرض معلومات واضحة لكل منتج.",
      "يمكنك ترتيب النتائج حسب الأكثر مبيعًا أو الأحدث أو السعر للعثور على المنتج المناسب بأقل وقت ممكن.",
      "جميع البيانات المعروضة تخضع للتحديث المستمر لضمان دقة الأسعار وحالة التوفر قبل إتمام الطلب.",
    ],
  }
}

const StoreTemplate = async ({
  sortBy,
  page,
  searchQuery,
  filters,
  countryCode,
}: {
  sortBy?: SortOptions
  page?: string
  searchQuery?: string
  filters?: ProductFilters
  countryCode: string
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  const normalizedQuery = (searchQuery || "").trim()
  const isArabic = countryCode.toLowerCase() === "ar"
  const seo = buildStoreSeo(isArabic, normalizedQuery || undefined)
  const facets = await getProductFacets({
    countryCode,
    queryParams: normalizedQuery ? { q: normalizedQuery } : undefined,
  })

  return (
    <div className="bg-[#eceff3] py-6" data-testid="category-container">
      <div className="content-container">
        <Breadcrumbs
          items={[
            { label: isArabic ? "الرئيسية" : "Home", href: "/" },
            { label: isArabic ? "المتجر" : "Store" },
          ]}
        />

        <section className="mt-4 rounded-md bg-[#3a4457] p-6 text-white">
          <h1 className="text-4xl font-extrabold leading-tight" data-testid="store-page-title">
            {seo.title}
          </h1>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-100">{seo.desc}</p>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <LocalizedClientLink href="/store?sortBy=best_selling" className="rounded-sm bg-white px-4 py-3 text-[#1f2b44] hover:bg-slate-100">
              <div className="text-xs font-bold uppercase tracking-[0.14em]">{isArabic ? "الأكثر مبيعًا" : "Best selling"}</div>
              <div className="mt-1 text-base font-extrabold">{isArabic ? "منتجات رائجة" : "Trending picks"}</div>
            </LocalizedClientLink>
            <LocalizedClientLink href="/store?sortBy=created_at" className="rounded-sm bg-white px-4 py-3 text-[#1f2b44] hover:bg-slate-100">
              <div className="text-xs font-bold uppercase tracking-[0.14em]">{isArabic ? "وصل حديثًا" : "New arrivals"}</div>
              <div className="mt-1 text-base font-extrabold">{isArabic ? "أحدث المنتجات" : "Latest products"}</div>
            </LocalizedClientLink>
            <LocalizedClientLink href="/store?sortBy=price_asc" className="rounded-sm bg-white px-4 py-3 text-[#1f2b44] hover:bg-slate-100">
              <div className="text-xs font-bold uppercase tracking-[0.14em]">{isArabic ? "وفر أكثر" : "Save more"}</div>
              <div className="mt-1 text-base font-extrabold">{isArabic ? "السعر الأقل أولًا" : "Lowest prices"}</div>
            </LocalizedClientLink>
            <LocalizedClientLink href="/store?sortBy=price_desc" className="rounded-sm bg-white px-4 py-3 text-[#1f2b44] hover:bg-slate-100">
              <div className="text-xs font-bold uppercase tracking-[0.14em]">{isArabic ? "فئات مميزة" : "Premium"}</div>
              <div className="mt-1 text-base font-extrabold">{isArabic ? "خيارات عالية الأداء" : "High-end options"}</div>
            </LocalizedClientLink>
          </div>
        </section>

        <div className="mt-5">
          <RefinementList sortBy={sort} variant="toolbar" data-testid="sort-by-container" />
        </div>

        <div className="mt-4 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <RefinementList sortBy={sort} variant="sidebar" facets={facets} selected={filters} />
          <div>
            <Suspense fallback={<SkeletonProductGrid />}>
              <PaginatedProducts
                sortBy={sort}
                page={pageNumber}
                searchQuery={normalizedQuery || undefined}
                countryCode={countryCode}
                cardVariant="category"
                showQuickAdd
                filters={filters}
              />
            </Suspense>
          </div>
        </div>

        <section className="mt-8 rounded-md bg-white p-6">
          <h2 className="text-3xl font-extrabold text-[#163b66]">
            {isArabic ? "دليل شامل للتسوق من المتجر" : "Complete Shopping Guide"}
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-8 text-slate-700">
            {seo.paragraphs.map((paragraph, index) => (
              <p key={`store-seo-${index}`}>{paragraph}</p>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default StoreTemplate
