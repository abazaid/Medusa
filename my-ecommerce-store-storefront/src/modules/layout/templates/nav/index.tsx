import { Suspense } from "react"

import { listCategories } from "@lib/data/categories"
import { getLocale } from "@lib/data/locale-actions"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import NavSearchAutocomplete from "@modules/layout/components/nav-search-autocomplete"

type MenuItem = {
  ar: string
  en: string
  href?: string
  tone?: string
  categoryCandidates?: string[]
}

const flattenCategories = (
  categories: HttpTypes.StoreProductCategory[]
): HttpTypes.StoreProductCategory[] =>
  categories.flatMap((category) => [
    category,
    ...flattenCategories(
      (category.category_children as HttpTypes.StoreProductCategory[] | undefined) || []
    ),
  ])

const normalize = (value?: string | null) => (value || "").trim().toLowerCase()

const resolveCategoryHref = (
  categories: HttpTypes.StoreProductCategory[],
  candidates?: string[]
) => {
  if (!candidates?.length) {
    return "/store"
  }

  const all = flattenCategories(categories)
  const normalizedCandidates = candidates.map((candidate) => normalize(candidate))

  const exact = all.find((category) => {
    const handle = normalize(category.handle)
    const name = normalize(category.name)
    return normalizedCandidates.some((candidate) => candidate === handle || candidate === name)
  })

  if (exact?.handle) {
    return `/categories/${encodeURIComponent(exact.handle)}`
  }

  const fuzzy = all.find((category) => {
    const handle = normalize(category.handle)
    const name = normalize(category.name)
    return normalizedCandidates.some(
      (candidate) =>
        candidate &&
        (handle.includes(candidate) ||
          name.includes(candidate) ||
          candidate.includes(handle) ||
          candidate.includes(name))
    )
  })

  return fuzzy?.handle ? `/categories/${encodeURIComponent(fuzzy.handle)}` : "/store"
}

const topMenuItems: MenuItem[] = [
  { ar: "جديد", en: "NEW", href: "/store?sortBy=created_at" },
  {
    ar: "الأكثر رواجًا",
    en: "TRENDING",
    href: "/store?sortBy=best_selling",
    tone: "from-orange-500 to-red-500",
  },
  {
    ar: "السوائل",
    en: "E-LIQUIDS",
    categoryCandidates: ["نكهات-فيب-شيشة", "نكهات-سحبة-سولت-e-juice", "نكهات"],
  },
  {
    ar: "الأجهزة",
    en: "KITS",
    categoryCandidates: ["أجهزة-شيشة-الكترونية", "أجهزة شيشة الكترونية", "اجهزة"],
  },
  {
    ar: "البودات والتانكات",
    en: "PODS & TANKS",
    categoryCandidates: ["بودات-pods", "بودات", "تانكات"],
  },
  {
    ar: "الكويلات",
    en: "COILS",
    categoryCandidates: ["كويلات"],
  },
  {
    ar: "أكياس النيكوتين",
    en: "NIC POUCHES",
    categoryCandidates: ["اظرف-النيكوتين-nicotine-pouches", "اظرف النيكوتين", "nicotine pouches"],
  },
  {
    ar: "الإكسسوارات",
    en: "ACCESSORIES",
    categoryCandidates: ["ملحقات-accessories", "ملحقات", "accessories"],
  },
  {
    ar: "البدائل",
    en: "ALTERNATIVES",
    categoryCandidates: ["ايكوس-جهاز-ايكوس-ايكوس-السعودية-iqos-saudi", "ايكوس", "iqos"],
  },
  { ar: "المدونة", en: "BLOGS", href: "/blog" },
  { ar: "الأدلة", en: "GUIDES", href: "/store" },
  {
    ar: "عرض متعددة",
    en: "MULTIBUY",
    categoryCandidates: ["بكجات-فيب-توفير"],
    tone: "from-sky-500 to-cyan-500",
  },
  {
    ar: "عروض خاصة",
    en: "SPECIAL OFFERS",
    categoryCandidates: ["عروض-خاصة"],
  },
  {
    ar: "تصفية نهائية",
    en: "CLEARANCE",
    categoryCandidates: ["عروض-فيب-عروض-تصفية", "تصفية"],
    tone: "from-rose-600 to-red-700",
  },
]

const trustBarItems = {
  ar: [
    "توصيل مجاني سريع",
    "نشحن 7 أيام بالأسبوع",
    "تقييمات ممتازة",
    "شحن في نفس اليوم حتى 9 مساءً",
  ],
  en: [
    "FREE FAST DELIVERY",
    "WE SHIP 7 DAYS A WEEK",
    "EXCELLENT REVIEWS",
    "SAME-DAY DISPATCH UP TO 9PM",
  ],
}

export default async function Nav() {
  const [currentLocale, categories] = await Promise.all([
    getLocale(),
    listCategories({ limit: 1000 }).catch(() => []),
  ])
  const isArabic = currentLocale.toLowerCase() === "ar"

  const labels = {
    logoMain: "Vape Hub",
    logoAccent: "KSA",
    announcement: isArabic
      ? "مركز الفيب السعودي - مركزك لكل ما يخص الفيب"
      : "Your Vaping Hub in Saudi Arabia",
    searchPlaceholder: isArabic
      ? "ابحث عن المنتجات والماركات..."
      : "Search products, brands and help...",
    accountTop: isArabic ? "مرحبًا! تسجيل الدخول" : "Hello! Log in",
    accountSub: isArabic ? "إنشاء حساب" : "Create account",
    cartLabel: isArabic ? "السلة" : "Cart",
  }

  return (
    <div className="sticky inset-x-0 top-0 z-50">
      <header className="relative mx-auto border-b border-slate-700 bg-gradient-to-r from-[#12233d] to-[#1f2f4d] shadow-sm">
        <div className="content-container border-b border-white/10 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <LocalizedClientLink
              href="/"
              className="flex items-end gap-2 text-white"
              data-testid="nav-store-link"
            >
              <span className="text-5xl font-light leading-none tracking-tight">{labels.logoMain}</span>
              <span className="text-6xl font-extrabold uppercase leading-none text-sky-400">
                {labels.logoAccent}
              </span>
            </LocalizedClientLink>

            <div className="hidden flex-1 text-sm font-bold text-white/90 xl:block">
              {labels.announcement}
            </div>

            <NavSearchAutocomplete placeholder={labels.searchPlaceholder} />

            <div className="flex items-center gap-5 text-white">
              <LocalizedClientLink
                href="/account"
                className="hidden flex-col text-sm leading-5 small:flex"
                data-testid="nav-account-link"
              >
                <span className="font-bold">{labels.accountTop}</span>
                <span className="text-white/80">{labels.accountSub}</span>
              </LocalizedClientLink>
              <Suspense
                fallback={
                  <LocalizedClientLink
                    className="text-sm font-bold text-white"
                    href="/cart"
                    data-testid="nav-cart-link"
                  >
                    {labels.cartLabel} (0)
                  </LocalizedClientLink>
                }
              >
                <CartButton />
              </Suspense>
            </div>
          </div>
        </div>

        <div className="content-container border-b border-white/10 py-3">
          <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap">
            {topMenuItems.map((item) => {
              const href = item.href || resolveCategoryHref(categories, item.categoryCandidates)

              return (
                <LocalizedClientLink
                  key={item.en}
                  href={href}
                  className={
                    item.tone
                      ? `bg-gradient-to-r ${item.tone} px-4 py-2 text-sm font-bold text-white`
                      : "px-1 text-sm font-bold text-white transition-colors hover:text-primary-300"
                  }
                >
                  {isArabic ? item.ar : item.en}
                </LocalizedClientLink>
              )
            })}
          </div>
        </div>

        <div className="bg-[#1b2f4d]">
          <div className="content-container flex min-h-[58px] items-center justify-between gap-4 overflow-x-auto py-3 text-sm font-bold text-white">
            {(isArabic ? trustBarItems.ar : trustBarItems.en).map((item, index) => (
              <div key={item} className="flex shrink-0 items-center gap-3 whitespace-nowrap">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-sky-400/40 text-sky-300">
                  {index + 1}
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </header>
    </div>
  )
}
