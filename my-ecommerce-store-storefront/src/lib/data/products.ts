"use server"

import { sdk } from "@lib/config"
import { getProductBrand } from "@lib/data/brands"
import { isProductInStock, sortByAvailability } from "@lib/util/product-availability"
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

const getVariantInventoryQuantities = async (
  variantIds: string[]
): Promise<Map<string, number>> => {
  const uniqueVariantIds = Array.from(new Set(variantIds.filter(Boolean)))

  if (!uniqueVariantIds.length) {
    return new Map()
  }

  try {
    const db = getPool()
    const { rows } = await db.query<{
      variant_id: string
      available_quantity: string
    }>(
      `
      SELECT
        pvii.variant_id,
        GREATEST(
          0,
          COALESCE(SUM(il.stocked_quantity - COALESCE(il.reserved_quantity, 0)), 0)
        )::text AS available_quantity
      FROM product_variant_inventory_item pvii
      LEFT JOIN inventory_level il
        ON il.inventory_item_id = pvii.inventory_item_id
       AND il.deleted_at IS NULL
      WHERE pvii.variant_id = ANY($1::text[])
      GROUP BY pvii.variant_id
      `,
      [uniqueVariantIds]
    )

    return new Map(
      rows.map((row) => [row.variant_id, Number(row.available_quantity) || 0])
    )
  } catch {
    return new Map()
  }
}

const withResolvedInventory = async (
  products: HttpTypes.StoreProduct[]
): Promise<HttpTypes.StoreProduct[]> => {
  const variantIds = products.flatMap((product) =>
    (product.variants || []).map((variant) => variant.id).filter(Boolean)
  )
  const inventoryByVariantId = await getVariantInventoryQuantities(variantIds)

  if (!inventoryByVariantId.size) {
    return products
  }

  return products.map((product) => ({
    ...product,
    variants: (product.variants || []).map((variant) => {
      const resolvedInventory = inventoryByVariantId.get(variant.id)

      if (resolvedInventory === undefined) {
        return variant
      }

      return {
        ...variant,
        inventory_quantity: resolvedInventory,
      }
    }),
  }))
}

export type ProductFilters = {
  brand?: string[]
  nicotine?: string[]
  resistance?: string[]
  flavor?: string[]
  stock?: string[]
  price?: string[]
}

export type FacetOption = {
  value: string
  count: number
}

export type ProductFacets = {
  brands: FacetOption[]
  nicotine: FacetOption[]
  resistance: FacetOption[]
  flavor: FacetOption[]
  stock: FacetOption[]
  price: FacetOption[]
}

const splitCsv = (value?: string | null) =>
  (value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)

const normalize = (value: string) => value.trim().toLowerCase()

const normalizeOhm = (value: string) =>
  value
    .replace(/ohm/gi, "Ω")
    .replace(/\s+/g, "")
    .replace(/(\d)(Ω)/, "$1Ω")

const getVariantText = (product: HttpTypes.StoreProduct) => {
  const chunks: string[] = []

  for (const variant of product.variants || []) {
    if (variant.title) {
      chunks.push(variant.title)
    }

    for (const option of variant.options || []) {
      if (option.value) {
        chunks.push(option.value)
      }
    }
  }

  return chunks.join(" | ")
}

const extractNicotineValues = (product: HttpTypes.StoreProduct) => {
  const text = getVariantText(product)
  const matches = text.match(/\d+(?:\.\d+)?\s*mg/gi) || []
  return Array.from(new Set(matches.map((value) => value.replace(/\s+/g, ""))))
}

const extractResistanceValues = (product: HttpTypes.StoreProduct) => {
  const text = getVariantText(product)
  const matches = text.match(/\d+(?:\.\d+)?\s*(?:ohm|Ω)/gi) || []
  return Array.from(new Set(matches.map(normalizeOhm)))
}

const extractFlavorValues = (product: HttpTypes.StoreProduct) => {
  const metadata = (product.metadata as Record<string, unknown> | null) || {}
  const flavors = splitCsv(
    typeof metadata.flavor_profile === "string"
      ? metadata.flavor_profile
      : typeof metadata.flavors === "string"
      ? metadata.flavors
      : ""
  )

  return Array.from(new Set(flavors))
}

const getProductBrandName = (product: HttpTypes.StoreProduct) => {
  const metadata = (product.metadata as Record<string, unknown> | null) || {}
  const resolved = getProductBrand(product)

  return (
    (resolved && resolved.nameEn) ||
    (typeof metadata.brand_name_en === "string" ? metadata.brand_name_en : "") ||
    (typeof metadata.brand_handle === "string" ? metadata.brand_handle : "") ||
    ""
  )
}

const getProductMinPrice = (product: HttpTypes.StoreProduct) => {
  const prices = (product.variants || [])
    .map((variant) => Number(variant.calculated_price?.calculated_amount))
    .filter((value) => Number.isFinite(value))

  if (!prices.length) {
    return Number.NaN
  }

  return Math.min(...prices)
}

const getPriceBucket = (price: number) => {
  if (!Number.isFinite(price)) return ""
  if (price < 50) return "lt50"
  if (price < 100) return "50_100"
  if (price < 200) return "100_200"
  return "200_plus"
}

const productMatchesFilters = (product: HttpTypes.StoreProduct, filters?: ProductFilters) => {
  if (!filters) {
    return true
  }

  const selectedBrands = (filters.brand || []).map(normalize)
  const selectedNicotine = (filters.nicotine || []).map(normalize)
  const selectedResistance = (filters.resistance || []).map(normalize)
  const selectedFlavor = (filters.flavor || []).map(normalize)
  const selectedStock = (filters.stock || []).map(normalize)
  const selectedPrice = (filters.price || []).map(normalize)

  const brand = normalize(getProductBrandName(product))
  const nicotineValues = extractNicotineValues(product).map(normalize)
  const resistanceValues = extractResistanceValues(product).map(normalize)
  const flavorValues = extractFlavorValues(product).map(normalize)
  const inStock = isProductInStock(product)
  const minPrice = getProductMinPrice(product)
  const priceBucket = normalize(getPriceBucket(minPrice))

  if (selectedBrands.length && !selectedBrands.includes(brand)) return false
  if (selectedNicotine.length && !nicotineValues.some((value) => selectedNicotine.includes(value))) return false
  if (selectedResistance.length && !resistanceValues.some((value) => selectedResistance.includes(value))) return false
  if (selectedFlavor.length && !flavorValues.some((value) => selectedFlavor.includes(value))) return false

  if (selectedStock.length) {
    const mapped = inStock ? "in" : "out"
    if (!selectedStock.includes(mapped)) return false
  }

  if (selectedPrice.length && !selectedPrice.includes(priceBucket)) return false

  return true
}

const listAllProducts = async ({
  countryCode,
  queryParams,
}: {
  countryCode: string
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}) => {
  const all = new Map<string, HttpTypes.StoreProduct>()
  let pageParam = 1

  while (true) {
    const { response, nextPage } = await listProducts({
      pageParam,
      countryCode,
      queryParams: {
        ...queryParams,
        limit: 100,
      },
    })

    for (const product of response.products || []) {
      if (product.id) {
        all.set(product.id, product)
      }
    }

    if (!nextPage) {
      break
    }

    pageParam = nextPage

    if (pageParam > 250) {
      break
    }
  }

  return Array.from(all.values())
}

const countValues = (values: string[]) => {
  const bucket = new Map<string, number>()
  for (const value of values.filter(Boolean)) {
    bucket.set(value, (bucket.get(value) || 0) + 1)
  }
  return Array.from(bucket.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
}

export const getProductFacets = async ({
  countryCode,
  queryParams,
}: {
  countryCode: string
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}): Promise<ProductFacets> => {
  const products = await listAllProducts({ countryCode, queryParams })

  const brandValues = products.map((product) => getProductBrandName(product)).filter(Boolean)
  const nicotineValues = products.flatMap((product) => extractNicotineValues(product))
  const resistanceValues = products.flatMap((product) => extractResistanceValues(product))
  const flavorValues = products.flatMap((product) => extractFlavorValues(product))
  const stockValues = products.map((product) => (isProductInStock(product) ? "in" : "out"))
  const priceValues = products.map((product) => getPriceBucket(getProductMinPrice(product))).filter(Boolean)

  return {
    brands: countValues(brandValues),
    nicotine: countValues(nicotineValues),
    resistance: countValues(resistanceValues),
    flavor: countValues(flavorValues),
    stock: countValues(stockValues),
    price: countValues(priceValues),
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
            "*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,*variants.images,*categories,+metadata,+tags,",
          ...queryParams,
        },
        headers,
        next,
        cache: disableCache ? "no-store" : "force-cache",
      }
    )
    .then(async ({ products, count }) => {
      const inventoryResolvedProducts = await withResolvedInventory(products || [])
      const nextPage = count > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products: inventoryResolvedProducts,
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
  filters,
  countryCode,
}: {
  page?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  sortBy?: SortOptions
  filters?: ProductFilters
  countryCode: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> => {
  const limit = queryParams?.limit || 12
  const products = await listAllProducts({ countryCode, queryParams })
  const filteredProducts = products.filter((product) => productMatchesFilters(product, filters))
  const count = filteredProducts.length
  const sortedProducts = sortProducts(filteredProducts, sortBy)

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

  const availabilitySortedProducts = sortByAvailability(sortedProducts)
  const pageParam = (page - 1) * limit

  const nextPage = count > pageParam + limit ? page + 1 : null

  const paginatedProducts = availabilitySortedProducts.slice(pageParam, pageParam + limit)

  return {
    response: {
      products: paginatedProducts,
      count,
    },
    nextPage,
    queryParams,
  }
}
