import { HttpTypes } from "@medusajs/types"

export const getVariantInventory = (
  variant: HttpTypes.StoreProductVariant | undefined
) => {
  const qty = variant?.inventory_quantity
  return typeof qty === "number" ? qty : 0
}

export const isVariantPurchasable = (
  variant: HttpTypes.StoreProductVariant
) => {
  if (!variant.manage_inventory) {
    return true
  }

  if (variant.allow_backorder) {
    return true
  }

  return getVariantInventory(variant) > 0
}

export const getVariantMaxPurchasableQuantity = (
  variant: HttpTypes.StoreProductVariant | undefined
) => {
  if (!variant) {
    return 0
  }

  if (!variant.manage_inventory || variant.allow_backorder) {
    return null
  }

  return Math.max(0, getVariantInventory(variant))
}

export const isProductInStock = (product: HttpTypes.StoreProduct) => {
  const variants = product.variants || []
  if (!variants.length) {
    return false
  }

  return variants.some((variant) => isVariantPurchasable(variant))
}

export const splitByAvailability = <T extends HttpTypes.StoreProduct>(
  products: T[]
) => {
  const inStock: T[] = []
  const outOfStock: T[] = []

  for (const product of products) {
    if (isProductInStock(product)) {
      inStock.push(product)
    } else {
      outOfStock.push(product)
    }
  }

  return { inStock, outOfStock }
}

export const sortByAvailability = <T extends HttpTypes.StoreProduct>(
  products: T[]
) => {
  const { inStock, outOfStock } = splitByAvailability(products)
  return [...inStock, ...outOfStock]
}
