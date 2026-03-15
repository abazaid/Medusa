"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheOptions } from "./cookies"

export type StoreProductReview = {
  id: string
  product_id: string | null
  name?: string | null
  rating: number
  content?: string | null
  created_at?: string | null
  status?: "pending" | "approved" | "flagged" | null
  response?: {
    id: string
    content: string
    created_at?: string | null
    updated_at?: string | null
  } | null
  images?: { id: string; url: string }[]
}

export type ProductReviewStat = {
  id: string
  product_id: string
  average_rating: number | null
  review_count: number
  rating_count_1: number
  rating_count_2: number
  rating_count_3: number
  rating_count_4: number
  rating_count_5: number
}

type ProductReviewsResponse = {
  product_reviews: StoreProductReview[]
  count: number
}

type ProductReviewStatsResponse = {
  product_review_stats: ProductReviewStat[]
  count: number
}

export const listProductReviewStats = async ({
  productIds,
  disableCache = false,
}: {
  productIds: string[]
  disableCache?: boolean
}) => {
  const uniqueProductIds = Array.from(new Set(productIds.filter(Boolean)))

  if (!uniqueProductIds.length) {
    return []
  }

  try {
    const headers = {
      ...(await getAuthHeaders()),
    }

    const next = disableCache
      ? undefined
      : {
          ...(await getCacheOptions("products")),
        }

    const { product_review_stats } =
      await sdk.client.fetch<ProductReviewStatsResponse>(
        "/store/product-review-stats",
        {
          method: "GET",
          query: {
            product_id: uniqueProductIds,
            limit: uniqueProductIds.length,
          },
          headers,
          next,
          cache: disableCache ? "no-store" : "force-cache",
        }
      )

    return product_review_stats || []
  } catch {
    return []
  }
}

export const listProductReviews = async ({
  productId,
  limit = 10,
  disableCache = false,
}: {
  productId: string
  limit?: number
  disableCache?: boolean
}) => {
  if (!productId) {
    return {
      reviews: [] as StoreProductReview[],
      count: 0,
    }
  }

  try {
    const headers = {
      ...(await getAuthHeaders()),
    }

    const next = disableCache
      ? undefined
      : {
          ...(await getCacheOptions("products")),
        }

    const { product_reviews, count } =
      await sdk.client.fetch<ProductReviewsResponse>("/store/product-reviews", {
        method: "GET",
        query: {
          product_id: productId,
          status: "approved",
          limit,
          order: "-created_at",
        },
        headers,
        next,
        cache: disableCache ? "no-store" : "force-cache",
      })

    return {
      reviews: product_reviews || [],
      count: count || 0,
    }
  } catch {
    return {
      reviews: [] as StoreProductReview[],
      count: 0,
    }
  }
}
