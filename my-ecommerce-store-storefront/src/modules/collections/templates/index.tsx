import { Suspense } from "react"

import { HttpTypes } from "@medusajs/types"
import { getProductFacets, type ProductFilters } from "@lib/data/products"
import Breadcrumbs from "@modules/common/components/breadcrumbs"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"

const buildCollectionSeo = (
  collection: HttpTypes.StoreCollection,
  isArabic: boolean
) => {
  if (!isArabic) {
    return {
      title: `${collection.title} Collection`,
      description:
        collection.metadata?.description ||
        `Browse original products from the ${collection.title} collection with updated pricing and stock visibility.`,
      paragraphs: [
        `The ${collection.title} collection is optimized for quick product discovery through visual cards, sorting controls, and structured product details.`,
        "Customers can compare availability, price points, and top-selling variants in one focused listing page.",
      ],
    }
  }

  return {
    title: `تسوق مجموعة ${collection.title} الأصلية`,
    description:
      (collection.metadata as Record<string, unknown> | null)?.description?.toString() ||
      `اكتشف منتجات مجموعة ${collection.title} مع أسعار محدثة وتوفر فعلي بالمخزون وتصميم يساعدك على المقارنة السريعة قبل الشراء.`,
    paragraphs: [
      `تم تنظيم مجموعة ${collection.title} لعرض المنتجات الأكثر طلبًا بطريقة واضحة تساعدك على الاختيار بسرعة.`,
      "تستطيع ترتيب المنتجات حسب الأحدث أو الأكثر مبيعًا أو السعر للحصول على نتائج أدق حسب هدفك الشرائي.",
      "يتم تحديث حالة المخزون والأسعار بشكل دوري لضمان تجربة شراء مستقرة وموثوقة.",
    ],
  }
}

export default async function CollectionTemplate({
  sortBy,
  collection,
  page,
  filters,
  countryCode,
}: {
  sortBy?: SortOptions
  collection: HttpTypes.StoreCollection
  page?: string
  filters?: ProductFilters
  countryCode: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  const isArabic = countryCode.toLowerCase() === "ar"
  const seo = buildCollectionSeo(collection, isArabic)
  const facets = await getProductFacets({
    countryCode,
    queryParams: {
      collection_id: [collection.id],
    },
  })

  return (
    <div className="bg-[#eceff3] py-6">
      <div className="content-container">
        <Breadcrumbs
          items={[
            { label: isArabic ? "الرئيسية" : "Home", href: "/" },
            { label: isArabic ? "المتجر" : "Store", href: "/store" },
            { label: collection.title || "" },
          ]}
        />

        <section className="mt-4 rounded-md bg-[#3a4457] p-6 text-white">
          <h1 className="text-4xl font-extrabold leading-tight">{seo.title}</h1>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-100">{seo.description}</p>
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
                  numberOfProducts={collection.products?.length}
                />
              }
            >
              <PaginatedProducts
                sortBy={sort}
                page={pageNumber}
                collectionId={collection.id}
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
            {isArabic ? "معلومات مهمة عن هذه المجموعة" : "Collection Insights"}
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-8 text-slate-700">
            {seo.paragraphs.map((paragraph, index) => (
              <p key={`collection-seo-${index}`}>{paragraph}</p>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
