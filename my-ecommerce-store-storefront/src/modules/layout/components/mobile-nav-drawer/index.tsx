"use client"

import { useState } from "react"
import { XMark } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import StoreLogo from "@modules/layout/components/store-logo"

type MobileCategory = {
  id: string
  name: string
  href: string
  children?: MobileCategory[]
}

type MobileNavDrawerProps = {
  locale: string
  logoMain: string
  logoAccent: string
  categories: MobileCategory[]
}

const labels = {
  ar: {
    menu: "القائمة",
    search: "بحث",
    cart: "السلة",
  },
  en: {
    menu: "Menu",
    search: "Search",
    cart: "Cart",
  },
}

export default function MobileNavDrawer({
  locale,
  logoMain,
  logoAccent,
  categories,
}: MobileNavDrawerProps) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const isArabic = locale.toLowerCase() === "ar"
  const t = isArabic ? labels.ar : labels.en

  const toggle = (id: string) =>
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))

  return (
    <div className="lg:hidden">
      <div className="border-b border-slate-700 bg-gradient-to-r from-[#12233d] to-[#1f2f4d] px-4 py-3 text-white">
        <div className="flex items-center justify-between gap-3">
          <LocalizedClientLink href="/" className="flex items-center text-white">
            <StoreLogo priority="mobile" />
          </LocalizedClientLink>

          <div className="flex items-center gap-2 text-sm font-bold">
            <LocalizedClientLink
              href="/store"
              className="rounded border border-white/20 px-2 py-1"
              aria-label={t.search}
              title={t.search}
            >
              {t.search}
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/cart"
              className="rounded border border-white/20 px-2 py-1"
              aria-label={t.cart}
              title={t.cart}
            >
              {t.cart}
            </LocalizedClientLink>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded border border-white/20 px-2 py-1"
              aria-label={t.menu}
            >
              {t.menu}
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="close menu backdrop"
            onClick={() => setOpen(false)}
          />

          <aside
            dir={isArabic ? "rtl" : "ltr"}
            className="absolute right-0 top-0 h-full w-[86%] max-w-[360px] overflow-y-auto border-l border-slate-700 bg-[#0f1f37] text-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#12233d] px-4 py-4">
              <div className="flex items-center text-white">
                <StoreLogo priority="mobile" />
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="close menu"
                className="rounded p-1 text-white/90 hover:bg-white/10"
              >
                <XMark />
              </button>
            </div>

            <nav className="bg-white text-slate-900">
              {categories.map((category) => {
                const hasChildren = (category.children?.length || 0) > 0
                const isOpen = !!expanded[category.id]

                return (
                  <div key={category.id} className="border-b border-slate-200">
                    <div className="flex items-center justify-between px-4 py-4">
                      <LocalizedClientLink
                        href={category.href}
                        className="text-base font-extrabold uppercase tracking-wide"
                        onClick={() => setOpen(false)}
                      >
                        {category.name}
                      </LocalizedClientLink>

                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => toggle(category.id)}
                          className="rounded px-2 py-1 text-sm font-bold text-slate-600"
                          aria-label={`toggle ${category.name}`}
                        >
                          {isOpen ? "-" : "+"}
                        </button>
                      ) : null}
                    </div>

                    {hasChildren && isOpen ? (
                      <div className="bg-slate-50">
                        {category.children!.map((child) => (
                          <LocalizedClientLink
                            key={child.id}
                            href={child.href}
                            className="block border-t border-slate-200 px-8 py-3 text-sm font-semibold text-slate-700"
                            onClick={() => setOpen(false)}
                          >
                            {child.name}
                          </LocalizedClientLink>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </nav>
          </aside>
        </div>
      ) : null}
    </div>
  )
}
