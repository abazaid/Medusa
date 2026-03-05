import { Text } from "@medusajs/ui"
import { listProducts } from "@lib/data/products"
import { getLocale } from "@lib/data/locale-actions"
import { getProductPrice } from "@lib/util/get-product-price"
import { isProductInStock } from "@lib/util/product-availability"
import { getProductSlug } from "@lib/util/slug"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

export default async function ProductPreview({
  product,
  isFeatured,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  // const pricedProduct = await listProducts({
  //   regionId: region.id,
  //   queryParams: { id: [product.id!] },
  // }).then(({ response }) => response.products[0])

  // if (!pricedProduct) {
  //   return null
  // }

  const { cheapestPrice } = getProductPrice({
    product,
  })
  const locale = await getLocale()
  const productSlug = getProductSlug(product, locale)
  const inStock = isProductInStock(product)
  const outOfStockLabel = locale.toLowerCase() === "ar" ? "نفد المخزون" : "Out of stock"

  return (
    <LocalizedClientLink href={`/products/${encodeURIComponent(productSlug)}`} className="group">
      <div data-testid="product-wrapper">
        <div className="relative">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="full"
            isFeatured={isFeatured}
          />
          {!inStock ? (
            <div className="absolute inset-x-0 top-0 z-10 bg-red-600/95 px-3 py-2 text-center text-xs font-bold uppercase tracking-[0.16em] text-white">
              {outOfStockLabel}
            </div>
          ) : null}
        </div>
        <div className="flex txt-compact-medium mt-4 justify-between">
          <Text className="text-ui-fg-subtle" data-testid="product-title">
            {product.title}
          </Text>
          <div className="flex items-center gap-x-2">
            {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
