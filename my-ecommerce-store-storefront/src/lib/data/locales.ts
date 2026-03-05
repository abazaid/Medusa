"use server"

import { sdk } from "@lib/config"
import { getCacheOptions } from "./cookies"

export type Locale = {
  code: string
  name: string
}

const DEFAULT_LOCALES: Locale[] = [
  { code: "ar", name: "Arabic" },
  { code: "en", name: "English" },
]

const normalizeLocales = (locales: Locale[] | null | undefined): Locale[] => {
  const localeMap = new Map<string, Locale>()

  for (const locale of locales || []) {
    const code = locale.code.toLowerCase()

    if (code !== "ar" && code !== "en") {
      continue
    }

    if (!localeMap.has(code)) {
      localeMap.set(code, {
        code,
        name: code === "ar" ? "Arabic" : "English",
      })
    }
  }

  for (const locale of DEFAULT_LOCALES) {
    if (!localeMap.has(locale.code)) {
      localeMap.set(locale.code, locale)
    }
  }

  return ["ar", "en"]
    .map((code) => localeMap.get(code))
    .filter((locale): locale is Locale => Boolean(locale))
}

/**
 * Fetches available locales from the backend.
 * Returns default locales if the endpoint returns 404 (locales not configured).
 */
export const listLocales = async (): Promise<Locale[] | null> => {
  const next = {
    ...(await getCacheOptions("locales")),
  }

  return sdk.client
    .fetch<{ locales: Locale[] }>(`/store/locales`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ locales }) => normalizeLocales(locales))
    .catch(() => normalizeLocales(DEFAULT_LOCALES))
}
