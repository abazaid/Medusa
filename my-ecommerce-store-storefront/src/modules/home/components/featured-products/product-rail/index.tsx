import { listProducts } from "@lib/data/products"
import { sortByAvailability } from "@lib/util/product-availability"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

import InteractiveLink from "@modules/common/components/interactive-link"
import ProductPreview from "@modules/products/components/product-preview"

export default async function ProductRail({
  collection,
  region,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
}) {
  const {
    response: { products: pricedProducts },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      collection_id: collection.id,
      fields: "*variants.calculated_price",
      limit: 8,
    },
  })

  const sortedProducts = sortByAvailability(pricedProducts || [])

  if (!sortedProducts.length) {
    return null
  }

  return (
    <div className="py-16 bg-secondary-0">
      <div className="container mx-auto px-4 md:px-8 lg:px-16 xl:px-20">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <div className="inline-block px-4 py-2 bg-primary-500 text-white text-sm font-semibold rounded-full mb-4">
              منتجات مميزة
            </div>
            <Text className="text-2xl md:text-3xl font-bold text-secondary-900 mb-2">
              {collection.title}
            </Text>
            <Text className="text-secondary-600">
              أفضل المنتجات من {collection.title}
            </Text>
          </div>
          <div className="mt-4 md:mt-0">
            <InteractiveLink 
              href={`/collections/${collection.handle}`}
            >
              عرض الكل →
            </InteractiveLink>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sortedProducts.slice(0, 8).map((product) => (
            <div key={product.id} className="group">
              <ProductPreview 
                product={product} 
                region={region} 
                isFeatured 
              />
            </div>
          ))}
        </div>
        
        {sortedProducts.length > 8 && (
          <div className="text-center mt-8">
            <InteractiveLink 
              href={`/collections/${collection.handle}`}
            >
              عرض المزيد من المنتجات
            </InteractiveLink>
          </div>
        )}
      </div>
    </div>
  )
}
