import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { isProductInStock } from "@lib/util/product-availability"
import { HttpTypes } from "@medusajs/types"
import Product from "../product-preview"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
  title?: string
  subtitle?: string
}

const parseArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed)
        ? parsed.map((item) => String(item).trim()).filter(Boolean)
        : []
    } catch {
      return []
    }
  }

  return []
}

export default async function RelatedProducts({
  product,
  countryCode,
  title = "Related products",
  subtitle = "You might also want to check out these products.",
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const metadata = (product.metadata as Record<string, unknown> | null) || {}
  const compatibleProductIds = parseArray(metadata.compatible_product_ids)

  if (!compatibleProductIds.length) {
    return null
  }

  const queryParams: HttpTypes.StoreProductListParams = {}
  if (region?.id) {
    queryParams.region_id = region.id
  }
  queryParams.id = compatibleProductIds
  queryParams.limit = 24
  queryParams.is_giftcard = false

  const products = await listProducts({
    queryParams,
    countryCode,
  }).then(({ response }) => {
    const filtered = response.products.filter(
      (responseProduct) =>
        responseProduct.id !== product.id && isProductInStock(responseProduct)
    )
    const order = new Map(
      compatibleProductIds.map((id, index) => [id, index])
    )

    return filtered
      .sort((left, right) => {
        const leftOrder = order.get(left.id) ?? Number.MAX_SAFE_INTEGER
        const rightOrder = order.get(right.id) ?? Number.MAX_SAFE_INTEGER
        return leftOrder - rightOrder
      })
      .slice(0, 8)
  })

  if (!products.length) {
    return null
  }

  return (
    <div className="product-page-constraint">
      <div className="flex flex-col items-center text-center mb-16">
        <span className="text-base-regular text-gray-600 mb-6">
          {title}
        </span>
        <p className="text-2xl-regular text-ui-fg-base max-w-lg">
          {subtitle}
        </p>
      </div>

      <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8">
        {products.map((product) => (
          <li key={product.id}>
            <Product
              region={region}
              product={product}
              cardVariant="category"
              showQuickAdd
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
