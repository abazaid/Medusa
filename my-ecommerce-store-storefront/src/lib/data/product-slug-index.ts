import { HttpTypes } from "@medusajs/types"

import { getProductSlug, normalizeComparableSlug, stripSkuSuffix } from "@lib/util/slug"

import { listProducts } from "./products"

type SlugIndexEntry = {
  map: Map<string, string>
  expiresAt: number
  inFlight?: Promise<Map<string, string>>
}

declare global {
  var __product_slug_index__: Record<string, SlugIndexEntry> | undefined
}

const TTL_MS = 60 * 60 * 1000

const getGlobalIndex = () => {
  if (!globalThis.__product_slug_index__) {
    globalThis.__product_slug_index__ = {}
  }
  return globalThis.__product_slug_index__
}

const buildIndexForCountry = async (countryCode: string) => {
  const map = new Map<string, string>()
  let page = 1

  while (page <= 60) {
    const { response, nextPage } = await listProducts({
      countryCode,
      pageParam: page,
      queryParams: {
        limit: 100,
        fields: "id,handle,title,metadata",
      },
    })

    for (const product of response.products || []) {
      if (!product.id) {
        continue
      }

      const candidates = [
        normalizeComparableSlug(getProductSlug(product, "ar")),
        normalizeComparableSlug(getProductSlug(product, "en")),
        normalizeComparableSlug(product.handle || ""),
        normalizeComparableSlug(stripSkuSuffix(product.handle || "")),
      ].filter(Boolean)

      for (const candidate of candidates) {
        if (!map.has(candidate)) {
          map.set(candidate, product.id)
        }
      }
    }

    if (!nextPage) {
      break
    }

    page = nextPage
  }

  return map
}

const getCountryIndex = async (countryCode: string) => {
  const key = (countryCode || "ar").toLowerCase()
  const all = getGlobalIndex()
  const now = Date.now()
  const current = all[key]

  if (current?.map && current.expiresAt > now) {
    return current.map
  }

  if (current?.inFlight) {
    return current.inFlight
  }

  const inFlight = buildIndexForCountry(key)
    .then((map) => {
      all[key] = {
        map,
        expiresAt: Date.now() + TTL_MS,
      }
      return map
    })
    .finally(() => {
      const latest = all[key]
      if (latest?.inFlight) {
        delete latest.inFlight
      }
    })

  all[key] = {
    map: current?.map || new Map<string, string>(),
    expiresAt: current?.expiresAt || 0,
    inFlight,
  }

  return inFlight
}

export const resolveProductIdFromSlugIndex = async ({
  countryCode,
  rawSlug,
}: {
  countryCode: string
  rawSlug: string
}) => {
  const normalized = normalizeComparableSlug(rawSlug)
  if (!normalized) {
    return undefined
  }

  const index = await getCountryIndex(countryCode)
  return index.get(normalized)
}

