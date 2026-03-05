"use client"

import { updateLocale } from "@lib/data/locale-actions"
import { usePathname, useRouter } from "next/navigation"
import { useTransition } from "react"

type Props = {
  currentLocale: string
}

const replaceLocaleInPath = (pathname: string, nextLocale: "ar" | "en") => {
  const segments = pathname.split("/").filter(Boolean)
  if (!segments.length) {
    return `/${nextLocale}`
  }

  if (segments[0] === "ar" || segments[0] === "en" || segments[0] === "sa") {
    segments[0] = nextLocale
    return `/${segments.join("/")}`
  }

  return `/${nextLocale}/${segments.join("/")}`
}

export default function LanguageSwitcher({ currentLocale }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const active = currentLocale.toLowerCase() === "en" ? "en" : "ar"

  const switchTo = (nextLocale: "ar" | "en") => {
    if (active === nextLocale) {
      return
    }

    startTransition(async () => {
      await updateLocale(nextLocale)
      router.push(replaceLocaleInPath(pathname, nextLocale))
      router.refresh()
    })
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-white/20 p-1 text-xs font-bold text-white">
      <button
        type="button"
        disabled={isPending || active === "ar"}
        onClick={() => switchTo("ar")}
        className={`rounded px-2 py-1 transition ${
          active === "ar" ? "bg-white text-[#12233d]" : "hover:bg-white/10"
        }`}
      >
        عربي
      </button>
      <button
        type="button"
        disabled={isPending || active === "en"}
        onClick={() => switchTo("en")}
        className={`rounded px-2 py-1 transition ${
          active === "en" ? "bg-white text-[#12233d]" : "hover:bg-white/10"
        }`}
      >
        EN
      </button>
    </div>
  )
}
