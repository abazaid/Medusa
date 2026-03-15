import { getLocale } from "@lib/data/locale-actions"
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { Text } from "@medusajs/ui"
import { getCategorySlug } from "@lib/util/slug"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import StoreLogo from "@modules/layout/components/store-logo"

export default async function Footer() {
  const [locale, { collections }, productCategories] = await Promise.all([
    getLocale(),
    listCollections({
      fields: "id,handle,title",
    }),
    listCategories(),
  ])

  const isArabic = locale.toLowerCase() === "ar"

  const copy = isArabic
    ? {
        brand: "مركز الفيب السعودي",
        description:
          "Vape Hub KSA - مركزك لكل ما يخص الفيب داخل السعودية. أجهزة أصلية، سوائل مميزة، وملحقات موثوقة مع تجربة شراء سريعة.",
        categories: "الأقسام",
        collections: "المجموعات",
        support: "الدعم",
        delivery: "معلومات التوصيل",
        returns: "سياسة الإرجاع",
        contact: "اتصل بنا",
        faq: "الأسئلة الشائعة",
        rights: "جميع الحقوق محفوظة.",
        privacy: "سياسة الخصوصية",
        terms: "الشروط والأحكام",
      }
    : {
        brand: "Vape Hub KSA",
        description:
          "Your Vaping Hub in Saudi Arabia. Premium devices, e-liquids, and accessories with fast delivery and trusted service.",
        categories: "Categories",
        collections: "Collections",
        support: "Support",
        delivery: "Delivery Information",
        returns: "Returns Policy",
        contact: "Contact Us",
        faq: "FAQs",
        rights: "All rights reserved.",
        privacy: "Privacy Policy",
        terms: "Terms of Service",
      }

  const topCategories = productCategories
    ?.filter((category) => !category.parent_category)
    .slice(0, 6)

  return (
    <footer className="w-full bg-[#1c2940] text-slate-200">
      <div className="content-container py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <LocalizedClientLink
              href="/"
              className="block text-white transition-colors hover:text-primary-300"
            >
              <StoreLogo className="max-w-[220px]" />
            </LocalizedClientLink>
            <p className="mt-4 text-sm leading-7 text-slate-300">{copy.description}</p>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-white">
              {copy.categories}
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              {topCategories?.map((category) => (
                <li key={category.id}>
                  <LocalizedClientLink
                    href={`/categories/${encodeURIComponent(
                      getCategorySlug(category, locale)
                    )}`}
                    className="transition-colors hover:text-primary-300"
                  >
                    {category.name}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-white">
              {copy.collections}
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              {collections?.slice(0, 6).map((collection) => (
                <li key={collection.id}>
                  <LocalizedClientLink
                    href={`/collections/${collection.handle}`}
                    className="transition-colors hover:text-primary-300"
                  >
                    {collection.title}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-white">
              {copy.support}
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a href="#" className="transition-colors hover:text-primary-300">
                  {copy.delivery}
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-primary-300">
                  {copy.returns}
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-primary-300">
                  {copy.contact}
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-primary-300">
                  {copy.faq}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          <div className="flex flex-col gap-3 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
            <Text>
              &copy; {new Date().getFullYear()} {copy.brand}. {copy.rights}
            </Text>
            <div className="flex gap-4">
              <a href="#" className="transition-colors hover:text-primary-300">
                {copy.privacy}
              </a>
              <a href="#" className="transition-colors hover:text-primary-300">
                {copy.terms}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
