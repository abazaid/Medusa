"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

import type { ProductFacets, ProductFilters } from "@lib/data/products"
import SortProducts, { SortOptions } from "./sort-products"

type RefinementListProps = {
  sortBy: SortOptions
  search?: boolean
  variant?: "default" | "toolbar" | "sidebar"
  facets?: ProductFacets
  selected?: ProductFilters
  "data-testid"?: string
}

const toolbarOptions: { value: SortOptions; labelAr: string; labelEn: string }[] = [
  { value: "best_selling", labelAr: "الأكثر مبيعًا", labelEn: "Best selling" },
  { value: "created_at", labelAr: "الأحدث", labelEn: "Newest" },
  { value: "price_asc", labelAr: "السعر: الأقل أولًا", labelEn: "Price low to high" },
  { value: "price_desc", labelAr: "السعر: الأعلى أولًا", labelEn: "Price high to low" },
]

const splitCsv = (value?: string | null) =>
  (value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)

const unique = (values: string[]) => Array.from(new Set(values))

const toggleFromCsv = (current: string[], value: string) => {
  const set = new Set(current)
  if (set.has(value)) {
    set.delete(value)
  } else {
    set.add(value)
  }
  return Array.from(set)
}

const priceLabel = (value: string, isArabic: boolean) => {
  if (!isArabic) {
    if (value === "lt50") return "Under 50"
    if (value === "50_100") return "50 - 100"
    if (value === "100_200") return "100 - 200"
    if (value === "200_plus") return "200+"
    return value
  }

  if (value === "lt50") return "أقل من 50"
  if (value === "50_100") return "50 - 100"
  if (value === "100_200") return "100 - 200"
  if (value === "200_plus") return "200+"
  return value
}

const stockLabel = (value: string, isArabic: boolean) => {
  if (value === "in") return isArabic ? "متوفر بالمخزون" : "In stock"
  if (value === "out") return isArabic ? "غير متوفر بالمخزون" : "Out of stock"
  return value
}

const RefinementList = ({
  sortBy,
  variant = "default",
  facets,
  selected,
  "data-testid": dataTestId,
}: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isArabic = pathname?.startsWith("/ar")

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const setQueryParams = (name: string, value: string) => {
    const query = createQueryString(name, value)
    router.push(`${pathname}?${query}`)
  }

  const updateMultiFilter = (key: keyof ProductFilters, value: string) => {
    const params = new URLSearchParams(searchParams)
    const current = splitCsv(params.get(key as string))
    const nextValues = toggleFromCsv(current, value)

    if (nextValues.length) {
      params.set(key as string, unique(nextValues).join(","))
    } else {
      params.delete(key as string)
    }

    // Reset pagination after changing filters
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }

  const selectedValues = {
    brand: selected?.brand || splitCsv(searchParams.get("brand")),
    nicotine: selected?.nicotine || splitCsv(searchParams.get("nicotine")),
    resistance: selected?.resistance || splitCsv(searchParams.get("resistance")),
    flavor: selected?.flavor || splitCsv(searchParams.get("flavor")),
    stock: selected?.stock || splitCsv(searchParams.get("stock")),
    price: selected?.price || splitCsv(searchParams.get("price")),
  }

  if (variant === "toolbar") {
    return (
      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-md border border-slate-300 bg-white p-3">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-600">
          {isArabic ? "ترتيب حسب" : "Sort by"}
        </span>
        {toolbarOptions.map((item) => (
          <button
            key={item.value}
            onClick={() => setQueryParams("sortBy", item.value)}
            className={`rounded-sm border px-3 py-1.5 text-xs font-semibold transition-colors ${
              sortBy === item.value
                ? "border-[#1f2b44] bg-[#1f2b44] text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-[#1f2b44] hover:text-[#1f2b44]"
            }`}
          >
            {isArabic ? item.labelAr : item.labelEn}
          </button>
        ))}
      </div>
    )
  }

  if (variant === "sidebar") {
    const groups = [
      {
        key: "brand" as const,
        title: isArabic ? "الماركة" : "Brand",
        options: facets?.brands || [],
        format: (value: string) => value,
      },
      {
        key: "nicotine" as const,
        title: isArabic ? "قوة النيكوتين" : "Nicotine Strength",
        options: facets?.nicotine || [],
        format: (value: string) => value,
      },
      {
        key: "resistance" as const,
        title: isArabic ? "المقاومة" : "Resistance",
        options: facets?.resistance || [],
        format: (value: string) => value,
      },
      {
        key: "flavor" as const,
        title: isArabic ? "النكهة" : "Flavor",
        options: facets?.flavor || [],
        format: (value: string) => value,
      },
      {
        key: "price" as const,
        title: isArabic ? "السعر" : "Price",
        options: facets?.price || [],
        format: (value: string) => priceLabel(value, !!isArabic),
      },
      {
        key: "stock" as const,
        title: isArabic ? "التوفر" : "Availability",
        options: facets?.stock || [],
        format: (value: string) => stockLabel(value, !!isArabic),
      },
    ]

    return (
      <aside className="w-full rounded-md border border-slate-300 bg-white p-4 lg:sticky lg:top-24">
        <h3 className="mb-4 text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700">
          {isArabic ? "تصفية المنتجات" : "Filter Products"}
        </h3>
        <div className="space-y-5">
          {groups
            .filter((group) => group.options.length > 0)
            .map((group) => (
              <div key={group.key} className="border-t border-slate-200 pt-4 first:border-t-0 first:pt-0">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  {group.title}
                </h4>
                <ul className="space-y-2">
                  {group.options.map((option) => {
                    const checked = selectedValues[group.key].includes(option.value)
                    return (
                      <li
                        key={`${group.key}-${option.value}`}
                        className="flex cursor-pointer items-center justify-between gap-2 text-sm text-slate-700"
                        onClick={() => updateMultiFilter(group.key, option.value)}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            readOnly
                            checked={checked}
                            className="h-3.5 w-3.5 rounded border-slate-300"
                          />
                          <span>{group.format(option.value)}</span>
                        </span>
                        <span className="text-xs text-slate-400">({option.count})</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
        </div>
      </aside>
    )
  }

  return (
    <div className="mb-8 flex gap-12 py-4 pl-6 small:ml-[1.675rem] small:min-w-[250px] small:flex-col small:px-0">
      <SortProducts sortBy={sortBy} setQueryParams={setQueryParams} data-testid={dataTestId} />
    </div>
  )
}

export default RefinementList

