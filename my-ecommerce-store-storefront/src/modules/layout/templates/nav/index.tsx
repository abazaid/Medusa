import { Suspense } from "react"

import { listCategories } from "@lib/data/categories"
import { getLocale } from "@lib/data/locale-actions"
import { getCategorySlug } from "@lib/util/slug"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import MobileNavDrawer from "@modules/layout/components/mobile-nav-drawer"
import NavSearchAutocomplete from "@modules/layout/components/nav-search-autocomplete"
import StoreLogo from "@modules/layout/components/store-logo"

type NavCategoryLink = {
  id: string
  name: string
  href: string
  children: NavCategoryLink[]
}

type MenuRule = {
  key: string
  label: string
  tokens: string[]
  hrefOverride?: string
  children?: MenuRule[]
}

const trustBarItems = {
  ar: [
    "توصيل مجاني سريع",
    "نشحن 7 أيام بالأسبوع",
    "تقييمات ممتازة",
    "شحن في نفس اليوم حتى 6 مساءً",
  ],
  en: [
    "FREE FAST DELIVERY",
    "WE SHIP 7 DAYS A WEEK",
    "EXCELLENT REVIEWS",
    "SAME-DAY DISPATCH UP TO 6PM",
  ],
}

const menuRules: MenuRule[] = [
  {
    key: "offers-discounts",
    label: "عروض وخصومات",
    tokens: ["عروض وخصومات", "offers"],
    children: [
      {
        key: "limited-offers",
        label: "عروض مجنونة لفترة محدودة",
        tokens: ["عروض مجنونة", "مجنونة لفترة محدودة", "limited"],
      },
      { key: "clearance", label: "عروض تصفية", tokens: ["تصفية", "clearance"] },
      { key: "bundle-deals", label: "بكجات توفير", tokens: ["بكجات توفير", "bundle"] },
      { key: "daily-offers", label: "عروض يومية", tokens: ["عروض يومية", "daily"] },
    ],
  },
  {
    key: "disposable-vape",
    label: "سحبات جاهزة Disposable Vape",
    tokens: ["سحبات جاهزة", "disposable vape"],
    children: [
      {
        key: "mazaj-disposable",
        label: "سحبات مزاج Mazaj Disposable",
        tokens: ["مزاج", "mazaj disposable"],
      },
      {
        key: "disposable-shisha",
        label: "شيشة جاهزة لمرة واحدة - Disposable Shisha",
        tokens: ["شيشة جاهزة", "مرة واحدة", "disposable shisha"],
      },
    ],
  },
  {
    key: "system-devices",
    label: "أجهزة سحبة سيجارة - Pod System",
    tokens: ["system", "اجهزة سحبة سيجارة", "pod system"],
  },
  {
    key: "salt-nic",
    label: "نكهات سولت نيكوتين - Salt Nic",
    tokens: ["salt nic", "سولت نيكوتين"],
    children: [
      { key: "mg-20", label: "20mg", tokens: ["20mg"] },
      { key: "mg-30", label: "30mg", tokens: ["30mg"] },
      { key: "mg-50", label: "50mg", tokens: ["50mg"] },
    ],
  },
  {
    key: "mod-devices",
    label: "أجهز الشيشة الإلكترونية - Vape Mod",
    tokens: ["mod", "أجهزة الشيشة الإلكترونية", "vape mod"],
    children: [
      { key: "tanks", label: "تانكات شيشة - Tank", tokens: ["tank", "تانكات"] },
      {
        key: "batteries",
        label: "بطاريات شيشة - Vape Batteries",
        tokens: ["batter", "بطاريات", "vape batteries"],
      },
    ],
  },
  {
    key: "eliquids",
    label: "نكهات فيب شيشة الكترونية - E-Juice",
    tokens: ["نكهات فيب", "e-liquid", "e liquid"],
    children: [
      { key: "mg-0", label: "0mg نكهات بدون نيكوتين", tokens: ["0mg", "بدون نيكوتين"] },
      { key: "mg-3", label: "3mg", tokens: ["3mg"] },
      { key: "mg-6", label: "6mg", tokens: ["6mg"] },
      { key: "mg-9", label: "9mg", tokens: ["9mg"] },
      { key: "mg-12", label: "12mg", tokens: ["12mg"] },
      { key: "mg-18", label: "18mg", tokens: ["18mg"] },
    ],
  },
  {
    key: "pods",
    label: "بودات - Pods",
    tokens: ["pods", "بودات"],
    children: [
      {
        key: "prefilled-pods",
        label: "بودات معبأة جاهزة",
        tokens: ["بودات معبأة جاهزة", "prefilled"],
      },
    ],
  },
  { key: "coils", label: "كويلات - Coils", tokens: ["coils", "كويلات"] },
  {
    key: "nicotine-pouches",
    label: "أظرف النيكوتين - Nicotine Pouches",
    tokens: ["pouches", "أظرف النيكوتين"],
  },
  {
    key: "accessories",
    label: "مستلزمات التبغ - Smoking Accessories",
    tokens: ["accessories", "مستلزمات التبغ", "مستلزمات الفيب"],
    children: [
      {
        key: "lighters",
        label: "ولاعات سجائر و دخان",
        tokens: ["ولاعات", "ولاعة", "lighter"],
      },
      {
        key: "ashtrays",
        label: "طفايات سجائر و دخان",
        tokens: ["طفايات", "طفاية", "ashtray"],
      },
      {
        key: "rolling-paper",
        label: "ورق لف السجائر - Rolling Paper",
        tokens: ["rolling paper", "ورق لف"],
      },
    ],
  },
  {
    key: "shisha-molasses",
    label: "معسلات - Shisha Molasses",
    tokens: ["molasses", "معسلات"],
  },
  {
    key: "shisha-charcoal",
    label: "فحم شيشة - Shisha Charcoal",
    tokens: ["charcoal", "فحم شيشة"],
  },
  { key: "shisha", label: "شيشة تقليدية - Shisha", tokens: ["shisha", "شيشة تقليدية"] },
  {
    key: "brands",
    label: "الماركات التجارية - Brands",
    tokens: ["brands", "الماركات"],
    hrefOverride: "/brands",
  },
]

const normalize = (value?: string | null) =>
  (value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()

const flattenCategories = (
  categories: HttpTypes.StoreProductCategory[]
): HttpTypes.StoreProductCategory[] =>
  categories.flatMap((category) => [
    category,
    ...flattenCategories(
      (category.category_children as HttpTypes.StoreProductCategory[] | undefined) || []
    ),
  ])

const categoryMatchesRule = (
  category: HttpTypes.StoreProductCategory,
  rule: MenuRule
) => {
  const haystack = `${normalize(category.name)} ${normalize(category.handle)}`
  return rule.tokens.some((token) => haystack.includes(normalize(token)))
}

const findCategoryByRule = (
  categories: HttpTypes.StoreProductCategory[],
  rule: MenuRule,
  usedIds: Set<string>,
  allowUsed = false
) => {
  return categories.find((category) => {
    if (!allowUsed && usedIds.has(category.id)) {
      return false
    }
    return categoryMatchesRule(category, rule)
  })
}

const toNavCategoryLink = (
  category: HttpTypes.StoreProductCategory,
  localeSegment: string,
  allCategories: HttpTypes.StoreProductCategory[],
  usedIds: Set<string>,
  childRules?: MenuRule[],
  label?: string,
  hrefOverride?: string
): NavCategoryLink => {
  usedIds.add(category.id)
  const directChildren =
    (category.category_children as HttpTypes.StoreProductCategory[] | undefined) || []

  const children = (childRules || [])
    .map((rule) => {
      const child =
        findCategoryByRule(directChildren, rule, usedIds) ||
        findCategoryByRule(allCategories, rule, usedIds, true)

      if (!child) {
        return null
      }

      return toNavCategoryLink(
        child,
        localeSegment,
        allCategories,
        usedIds,
        rule.children,
        rule.label,
        rule.hrefOverride
      )
    })
    .filter((item): item is NavCategoryLink => item !== null)

  return {
    id: category.id,
    name: label || category.name,
    href: hrefOverride || `/categories/${encodeURIComponent(getCategorySlug(category, localeSegment))}`,
    children,
  }
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

  const allCategories = flattenCategories(categories)
  const usedCategoryIds = new Set<string>()

  const menuCategories = menuRules
    .map((rule) => {
      const category = findCategoryByRule(allCategories, rule, usedCategoryIds, !!rule.hrefOverride)
      if (!category) {
        if (rule.hrefOverride) {
          return {
            id: rule.key,
            name: rule.label,
            href: rule.hrefOverride,
            children: [],
          } satisfies NavCategoryLink
        }

        return null
      }

      return toNavCategoryLink(
        category,
        currentLocale,
        allCategories,
        usedCategoryIds,
        rule.children,
        rule.label,
        rule.hrefOverride
      )
    })
    .filter((item): item is NavCategoryLink => item !== null)

  return (
    <div className="sticky inset-x-0 top-0 z-50">
      <header className="relative mx-auto border-b border-slate-700 bg-gradient-to-r from-[#12233d] to-[#1f2f4d] shadow-sm">
        <MobileNavDrawer
          locale={currentLocale}
          logoMain={labels.logoMain}
          logoAccent={labels.logoAccent}
          categories={menuCategories}
        />

        <div className="content-container hidden border-b border-white/10 py-4 lg:block">
          <div className="flex flex-wrap items-center gap-4">
            <LocalizedClientLink
              href="/"
              className="flex items-center text-white"
              data-testid="nav-store-link"
            >
              <StoreLogo />
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

        <div className="content-container hidden border-b border-white/10 py-3 lg:block">
          <nav className="flex items-center gap-2" aria-label="desktop categories menu">
            {menuCategories.map((category) => {
              const hasChildren = category.children.length > 0

              return (
                <div key={category.id} className="group relative">
                  <LocalizedClientLink
                    href={category.href}
                    className="inline-flex items-center rounded px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-white/10"
                  >
                    {category.name}
                  </LocalizedClientLink>

                  {hasChildren ? (
                    <div className="invisible absolute right-0 top-full z-40 mt-1 min-w-[280px] rounded-md border border-slate-200 bg-white p-2 opacity-0 shadow-xl transition-all duration-150 group-hover:visible group-hover:opacity-100">
                      {category.children.map((child) => (
                        <div key={child.id} className="border-b border-slate-100 last:border-b-0">
                          <LocalizedClientLink
                            href={child.href}
                            className="block px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                          >
                            {child.name}
                          </LocalizedClientLink>

                          {child.children.length > 0 ? (
                            <div className="pb-2 pr-2">
                              {child.children.map((grandChild) => (
                                <LocalizedClientLink
                                  key={grandChild.id}
                                  href={grandChild.href}
                                  className="block px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                                >
                                  {grandChild.name}
                                </LocalizedClientLink>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </nav>
        </div>

        <div className="hidden bg-[#1b2f4d] lg:block">
          <div className="content-container flex min-h-[58px] items-center justify-between gap-4 overflow-x-auto py-3 text-sm font-bold text-white">
            {(isArabic ? trustBarItems.ar : trustBarItems.en).map((item, index) => (
              <div
                key={item}
                className="flex shrink-0 items-center gap-3 whitespace-nowrap"
              >
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
