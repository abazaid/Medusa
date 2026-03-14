import { listProductsWithSort } from "@lib/data/products"
import type { ProductFilters } from "@lib/data/products"
import { sortByAvailability } from "@lib/util/product-availability"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const PRODUCT_LIMIT = 12

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
  q?: string
}

export default async function PaginatedProducts({
  sortBy,
  page,
  searchQuery,
  collectionId,
  categoryId,
  productsIds,
  cardVariant,
  showQuickAdd,
  filters,
  countryCode,
}: {
  sortBy?: SortOptions
  page: number
  searchQuery?: string
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  cardVariant?: "default" | "category"
  showQuickAdd?: boolean
  filters?: ProductFilters
  countryCode: string
}) {
  const queryParams: PaginatedProductsParams = {
    limit: 12,
  }

  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  }

  if (categoryId) {
    queryParams["category_id"] = [categoryId]
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  if (sortBy === "created_at") {
    queryParams["order"] = "created_at"
  }

  if (searchQuery) {
    queryParams["q"] = searchQuery
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  let {
    response: { products, count },
  } = await listProductsWithSort({
    page,
    queryParams,
    sortBy,
    filters,
    countryCode,
  })
  products = sortByAvailability(products)

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)

  return (
    <>
      {!products.length && searchQuery ? (
        <div className="mb-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-sm text-slate-600">
          Ù„Ø§ ØªÙˆØ¬Ø¯ Ù†ØªØ§Ø¦Ø¬ Ù…Ø·Ø§Ø¨Ù‚Ø© Ù„Ø¹Ø¨Ø§Ø±Ø© Ø§Ù„Ø¨Ø­Ø«: <strong>{searchQuery}</strong>
        </div>
      ) : null}
      <ul
        className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-4 gap-y-5"
        data-testid="products-list"
      >
        {products.map((p) => {
          return (
            <li key={p.id}>
              <ProductPreview
                product={p}
                region={region}
                cardVariant={cardVariant}
                showQuickAdd={showQuickAdd}
              />
            </li>
          )
        })}
      </ul>
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
