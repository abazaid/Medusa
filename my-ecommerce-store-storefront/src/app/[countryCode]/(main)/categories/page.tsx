import { Metadata } from "next"

import { listCategories } from "@lib/data/categories"
import { getBaseURL } from "@lib/util/env"
import { getCategorySlug } from "@lib/util/slug"
import Breadcrumbs from "@modules/common/components/breadcrumbs"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Props = {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const isArabic = params.countryCode.toLowerCase() === "ar"
  const title = isArabic ? "جميع الأقسام" : "All Categories"
  const description = isArabic
    ? "تصفح جميع أقسام المتجر واختر القسم المناسب بسرعة."
    : "Browse all store categories and find the right section quickly."
  const canonical = `${getBaseURL()}/${params.countryCode}/categories`

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ar: `${getBaseURL()}/ar/categories`,
        "x-default": `${getBaseURL()}/ar/categories`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
  }
}

export default async function CategoriesArchivePage(props: Props) {
  const params = await props.params
  const isArabic = params.countryCode.toLowerCase() === "ar"
  const categories = await listCategories({ limit: 1000 })
  const rootCategories = (categories || [])
    .filter((category) => !category.parent_category_id)
    .sort((a, b) => (a.name || "").localeCompare(b.name || "", "ar"))

  return (
    <div className="bg-[#eceff3] py-6">
      <div className="content-container">
        <Breadcrumbs
          items={[
            { label: isArabic ? "الرئيسية" : "Home", href: "/" },
            { label: isArabic ? "الأقسام" : "Categories" },
          ]}
        />

        <section className="mt-4 rounded-md bg-[#3a4457] p-6 text-white">
          <h1 className="text-4xl font-extrabold leading-tight">
            {isArabic ? "جميع أقسام المتجر" : "All Store Categories"}
          </h1>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-100">
            {isArabic
              ? "اختر القسم المناسب لتصفح المنتجات بشكل أسرع مع تصفية وفرز واضح."
              : "Choose a category to browse products faster with clear filtering and sorting."}
          </p>
        </section>

        {rootCategories.length ? (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rootCategories.map((category) => (
              <li key={category.id}>
                <LocalizedClientLink
                  href={`/categories/${encodeURIComponent(
                    getCategorySlug(category, params.countryCode)
                  )}`}
                  className="block rounded-md border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-primary-400"
                >
                  <h2 className="text-lg font-bold text-secondary-900">
                    {category.name}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                    {category.description ||
                      (isArabic
                        ? "تصفح منتجات هذا القسم."
                        : "Browse products in this category.")}
                  </p>
                </LocalizedClientLink>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-6 rounded-md border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-sm text-slate-600">
            {isArabic ? "لا توجد أقسام متاحة حاليًا." : "No categories available yet."}
          </div>
        )}
      </div>
    </div>
  )
}

