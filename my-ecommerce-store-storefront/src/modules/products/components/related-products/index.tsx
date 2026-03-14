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

const shuffleProducts = <T,>(items: T[]) => {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
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

  const queryParams: HttpTypes.StoreProductListParams = {}
  if (region?.id) {
    queryParams.region_id = region.id
  }

  const categoryIds = (product.categories || [])
    .map((category) => category.id)
    .filter((id): id is string => Boolean(id))

  if (!categoryIds.length) {
    return null
  }

  queryParams.category_id = categoryIds
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
    return shuffleProducts(filtered).slice(0, 8)
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
