"use server"

import { sdk } from "@lib/config"
import { sortProducts } from "@lib/util/sort-products"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { Pool } from "pg"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { getRegion, retrieveRegion } from "./regions"

let pool: Pool | null = null

const getDatabaseUrl = () =>
  process.env.DATABASE_URL || "postgres://postgres@localhost/medusa-store"

const getPool = () => {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
    })
  }

  return pool
}

const getBestSellingQuantities = async (): Promise<Map<string, number>> => {
  try {
    const db = getPool()
    const { rows } = await db.query<{
      product_id: string
      sold_qty: string
    }>(
      `
      SELECT oli.product_id, SUM(oi.quantity)::numeric::text AS sold_qty
      FROM order_item oi
      JOIN order_line_item oli ON oli.id = oi.item_id
      WHERE oi.deleted_at IS NULL
        AND oli.deleted_at IS NULL
        AND oli.product_id IS NOT NULL
      GROUP BY oli.product_id
      `
    )

    return new Map(
      rows
        .filter((row) => !!row.product_id)
        .map((row) => [row.product_id, Number(row.sold_qty) || 0])
    )
  } catch {
    return new Map()
  }
}

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
  disableCache = false,
}: {
  pageParam?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
  countryCode?: string
  regionId?: string
  disableCache?: boolean
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
}> => {
  if (!countryCode && !regionId) {
    throw new Error("Country code or region ID is required")
  }

  const limit = queryParams?.limit || 12
  const _pageParam = Math.max(pageParam, 1)
  const offset = _pageParam === 1 ? 0 : (_pageParam - 1) * limit

  let region: HttpTypes.StoreRegion | undefined | null

  if (countryCode) {
    region = await getRegion(countryCode)
  } else {
    region = await retrieveRegion(regionId!)
  }

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = disableCache
    ? undefined
    : {
        ...(await getCacheOptions("products")),
      }

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
      `/store/products`,
      {
        method: "GET",
        query: {
          limit,
          offset,
          region_id: region?.id,
          fields:
            "*variants.calculated_price,+variants.inventory_quantity,*variants.images,+metadata,+tags,",
          ...queryParams,
        },
        headers,
        next,
        cache: disableCache ? "no-store" : "force-cache",
      }
    )
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products,
          count,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
}

/**
 * This will fetch 100 products to the Next.js cache and sort them based on the sortBy parameter.
 * It will then return the paginated products based on the page and limit parameters.
 */
export const listProductsWithSort = async ({
  page = 0,
  queryParams,
  sortBy = "created_at",
  countryCode,
}: {
  page?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  sortBy?: SortOptions
  countryCode: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> => {
  const limit = queryParams?.limit || 12

  const {
    response: { products, count },
  } = await listProducts({
    pageParam: 0,
    queryParams: {
      ...queryParams,
      limit: 100,
    },
    countryCode,
  })

  const sortedProducts = sortProducts(products, sortBy)

  if (sortBy === "best_selling") {
    const soldByProductId = await getBestSellingQuantities()
    sortedProducts.sort((a, b) => {
      const aSold = soldByProductId.get(a.id) || 0
      const bSold = soldByProductId.get(b.id) || 0

      if (aSold !== bSold) {
        return bSold - aSold
      }

      return (
        new Date(b.created_at || "").getTime() -
        new Date(a.created_at || "").getTime()
      )
    })
  }

  const pageParam = (page - 1) * limit

  const nextPage = count > pageParam + limit ? pageParam + limit : null

  const paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit)

  return {
    response: {
      products: paginatedProducts,
      count,
    },
    nextPage,
    queryParams,
  }
}
