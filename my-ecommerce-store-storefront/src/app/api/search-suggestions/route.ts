import { NextRequest, NextResponse } from "next/server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"

type Suggestion = {
  id: string
  title: string
  handle: string
  thumbnail?: string | null
}

const normalizeText = (value?: string | null) =>
  (value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()

const scoreSuggestion = (title: string, query: string) => {
  const normalizedTitle = normalizeText(title)
  const normalizedQuery = normalizeText(query)

  if (!normalizedQuery || !normalizedTitle) {
    return 0
  }

  if (normalizedTitle === normalizedQuery) {
    return 1000
  }

  if (normalizedTitle.startsWith(normalizedQuery)) {
    return 700
  }

  if (normalizedTitle.includes(normalizedQuery)) {
    return 500
  }

  const queryTokens = normalizedQuery.split(" ").filter(Boolean)
  const titleTokens = new Set(normalizedTitle.split(" ").filter(Boolean))
  const overlap = queryTokens.reduce(
    (score, token) => score + (titleTokens.has(token) ? 1 : 0),
    0
  )

  return overlap * 100
}

const pickRegionId = async (countryCode: string) => {
  const { regions } = await sdk.client.fetch<{ regions: HttpTypes.StoreRegion[] }>(
    "/store/regions",
    {
      method: "GET",
      cache: "no-store",
    }
  )

  const normalizedCode = (countryCode || "sa").toLowerCase()
  const matchedRegion = (regions || []).find((region) =>
    region.countries?.some((country) => country.iso_2?.toLowerCase() === normalizedCode)
  )

  if (matchedRegion?.id) {
    return matchedRegion.id
  }

  return (regions || []).find((region) =>
    region.countries?.some((country) => country.iso_2?.toLowerCase() === "sa")
  )?.id
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get("q") || "").trim()
  const countryCode = (searchParams.get("countryCode") || "sa").toLowerCase()

  if (q.length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  try {
    const regionId = await pickRegionId(countryCode)

    if (!regionId) {
      return NextResponse.json({ suggestions: [] })
    }

    const fields = "id,title,handle,thumbnail"
    const productsResponse = await sdk.client.fetch<{
      products: HttpTypes.StoreProduct[]
    }>("/store/products", {
      method: "GET",
      cache: "no-store",
      query: {
        q,
        limit: 20,
        region_id: regionId,
        fields,
      },
    })

    let candidates = (productsResponse.products || []).map((product) => ({
      id: product.id || "",
      title: product.title || "",
      handle: product.handle || "",
      thumbnail: product.thumbnail || null,
    }))

    if (candidates.length < 3) {
      const fallbackResponse = await sdk.client.fetch<{
        products: HttpTypes.StoreProduct[]
      }>("/store/products", {
        method: "GET",
        cache: "no-store",
        query: {
          limit: 100,
          region_id: regionId,
          fields,
        },
      })

      const merged = [...candidates]
      const seen = new Set(candidates.map((item) => item.id))

      for (const product of fallbackResponse.products || []) {
        const fallbackCandidate = {
          id: product.id || "",
          title: product.title || "",
          handle: product.handle || "",
          thumbnail: product.thumbnail || null,
        }

        if (!fallbackCandidate.id || seen.has(fallbackCandidate.id)) {
          continue
        }

        if (scoreSuggestion(fallbackCandidate.title, q) <= 0) {
          continue
        }

        merged.push(fallbackCandidate)
        seen.add(fallbackCandidate.id)
      }

      candidates = merged
    }

    const ranked = candidates
      .map((item) => ({
        ...item,
        score: scoreSuggestion(item.title, q),
      }))
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score)

    const suggestions: Suggestion[] = ranked.slice(0, 5).map((item) => ({
      id: item.id,
      title: item.title,
      handle: item.handle,
      thumbnail: item.thumbnail,
    }))

    return NextResponse.json({ suggestions })
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}
