"use client"

import { useDeferredValue, useState } from "react"

import type { Brand } from "@lib/data/brands"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type BrandsArchiveProps = {
  brands: Brand[]
  locale: string
}

type FilterKey = "all" | "0-9" | string

const getFilterKey = (value: string) => {
  const firstCharacter = value.trim().charAt(0).toUpperCase()

  if (!firstCharacter) {
    return "#"
  }

  return /[A-Z]/.test(firstCharacter) ? firstCharacter : "0-9"
}

export default function BrandsArchive({
  brands,
  locale,
}: BrandsArchiveProps) {
  const isArabic = locale.toLowerCase() === "ar"
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all")
  const deferredSearch = useDeferredValue(search)

  const availableFilters = [
    "all",
    ...Array.from(new Set(brands.map((brand) => getFilterKey(brand.nameEn)))).sort(
      (first, second) => {
        if (first === "0-9") {
          return 1
        }

        if (second === "0-9") {
          return -1
        }

        return first.localeCompare(second)
      }
    ),
  ]

  const normalizedSearch = deferredSearch.trim().toLowerCase()

  const filteredBrands = brands.filter((brand) => {
    const matchesFilter =
      activeFilter === "all" || getFilterKey(brand.nameEn) === activeFilter
    const matchesSearch =
      !normalizedSearch ||
      `${brand.nameAr} ${brand.nameEn} ${brand.handle}`
        .toLowerCase()
        .includes(normalizedSearch)

    return matchesFilter && matchesSearch
  })

  return (
    <section className="bg-[#eef0f3] py-12">
      <div className="content-container">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] md:p-8">
          <div className="flex flex-col gap-5 border-b border-slate-200 pb-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="inline-flex rounded-full bg-primary-100 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-primary-800">
                  {isArabic ? "الماركات التجارية" : "Brands Directory"}
                </span>
                <h1 className="mt-3 text-3xl font-bold text-secondary-900 md:text-4xl">
                  {isArabic ? "جميع الماركات" : "All Brands"}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-secondary-700 md:text-base">
                  {isArabic
                    ? "تصفح كل الماركات المتوفرة، وابحث بالاسم العربي أو الإنجليزي أو عبر اسم الرابط، ثم انتقل مباشرة إلى صفحة كل ماركة."
                    : "Browse every available brand, search by Arabic name, English name, or handle, and jump directly to each brand page."}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-secondary-800">
                {isArabic
                  ? `${filteredBrands.length} من ${brands.length} ماركة`
                  : `${filteredBrands.length} of ${brands.length} brands`}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <label className="relative block">
                <span className="sr-only">
                  {isArabic ? "ابحث عن ماركة" : "Search brands"}
                </span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  type="search"
                  placeholder={
                    isArabic
                      ? "ابحث باسم الماركة أو الرابط..."
                      : "Search by brand name or handle..."
                  }
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-secondary-900 outline-none transition-colors placeholder:text-slate-400 focus:border-primary-500 focus:bg-white"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  setSearch("")
                  setActiveFilter("all")
                }}
                className="h-12 rounded-2xl border border-slate-200 px-5 text-sm font-semibold text-secondary-800 transition-colors hover:border-primary-500 hover:text-primary-700"
              >
                {isArabic ? "إعادة الضبط" : "Reset"}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {availableFilters.map((filter) => {
                const isActive = activeFilter === filter
                const label =
                  filter === "all"
                    ? isArabic
                      ? "الكل"
                      : "All"
                    : filter

                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
                      isActive
                        ? "bg-secondary-900 text-white"
                        : "bg-slate-100 text-secondary-700 hover:bg-primary-100 hover:text-primary-800"
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {filteredBrands.length ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredBrands.map((brand) => {
                const brandName = isArabic ? brand.nameAr : brand.nameEn

                return (
                  <LocalizedClientLink
                    key={brand.handle}
                    href={`/brands/${brand.handle}`}
                    className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary-400 hover:shadow-[0_16px_34px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex h-24 items-center justify-center rounded-2xl bg-slate-50 p-4">
                      <img
                        src={brand.logo}
                        alt={brandName}
                        className="max-h-16 max-w-full object-contain"
                      />
                    </div>
                    <div className="mt-4 flex flex-1 flex-col">
                      <h2 className="text-base font-bold text-secondary-900">
                        {brandName}
                      </h2>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {brand.handle}
                      </p>
                      <span className="mt-4 inline-flex text-sm font-semibold text-primary-700 transition-colors group-hover:text-primary-600">
                        {isArabic ? "عرض الماركة" : "View brand"}
                      </span>
                    </div>
                  </LocalizedClientLink>
                )
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <h2 className="text-lg font-bold text-secondary-900">
                {isArabic ? "لا توجد نتائج" : "No results found"}
              </h2>
              <p className="mt-3 text-sm leading-7 text-secondary-700">
                {isArabic
                  ? "جرّب اسمًا آخر أو أزل الفلتر الحالي لعرض جميع الماركات."
                  : "Try a different search term or clear the active filter to see every brand."}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
