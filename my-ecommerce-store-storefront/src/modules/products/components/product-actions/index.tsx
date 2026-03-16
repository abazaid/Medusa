"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import {
  getVariantInventory,
  getVariantMaxPurchasableQuantity,
} from "@lib/util/product-availability"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductActions({
  product,
  disabled,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const countryCode = useParams().countryCode as string
  const isArabic = countryCode?.toLowerCase() === "ar"
  const metadata = (product.metadata as Record<string, unknown> | null) || {}
  const multibuyLabel =
    typeof metadata.multibuy_label === "string"
      ? metadata.multibuy_label.trim()
      : ""
  const multibuyUrl =
    typeof metadata.multibuy_url === "string"
      ? metadata.multibuy_url.trim()
      : ""

  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString(), { scroll: false })
  }, [isValidVariant, pathname, router, searchParams, selectedVariant])

  const inStock = useMemo(() => {
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    if (selectedVariant?.allow_backorder) {
      return true
    }

    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    return false
  }, [selectedVariant])

  const isVariantPurchasable = (variant?: HttpTypes.StoreProductVariant) => {
    if (!variant) return false
    if (!variant.manage_inventory) return true
    if (variant.allow_backorder) return true
    return (variant.inventory_quantity || 0) > 0
  }

  const maxPurchasableQuantity = useMemo(
    () => getVariantMaxPurchasableQuantity(selectedVariant),
    [selectedVariant]
  )

  const inventoryMessage = useMemo(() => {
    if (!selectedVariant) {
      return null
    }

    if (!selectedVariant.manage_inventory) {
      return isArabic ? "متوفر" : "Available"
    }

    if (selectedVariant.allow_backorder) {
      return isArabic ? "متاح للطلب" : "Available to order"
    }

    const inventory = getVariantInventory(selectedVariant)

    if (inventory <= 0) {
      return isArabic ? "نفد المخزون" : "Out of stock"
    }

    return isArabic
      ? `المتبقي في المخزون: ${inventory}`
      : `${inventory} left in stock`
  }, [isArabic, selectedVariant])

  useEffect(() => {
    setError(null)

    if (maxPurchasableQuantity !== null && maxPurchasableQuantity > 0) {
      setQuantity((prev) => Math.min(prev, maxPurchasableQuantity))
      return
    }

    setQuantity(1)
  }, [maxPurchasableQuantity, selectedVariant?.id])

  const getOptionLabel = (optionId: string, optionValue: string) => {
    const variants = product.variants || []
    const matchingVariants = variants.filter((variant) => {
      const variantOptions = optionsAsKeymap(variant.options)
      if (variantOptions?.[optionId] !== optionValue) {
        return false
      }

      return Object.entries(options).every(
        ([selectedOptionId, selectedValue]) => {
          if (!selectedValue || selectedOptionId === optionId) {
            return true
          }

          return variantOptions?.[selectedOptionId] === selectedValue
        }
      )
    })

    const hasAvailableVariant = matchingVariants.some((variant) =>
      isVariantPurchasable(variant)
    )

    if (hasAvailableVariant || matchingVariants.length === 0) {
      return optionValue
    }

    return isArabic
      ? `${optionValue} - نفدت الكمية`
      : `${optionValue} - Out of stock`
  }

  const actionsRef = useRef<HTMLDivElement>(null)
  const inView = useIntersection(actionsRef, "0px")

  const setExceededStockError = () => {
    setError(
      isArabic
        ? `الكمية المطلوبة غير متوفرة. المتبقي في المخزون: ${maxPurchasableQuantity}.`
        : `Requested quantity is unavailable. Only ${maxPurchasableQuantity} left in stock.`
    )
  }

  const handleAddToCart = async () => {
    if (!selectedVariant?.id) {
      return null
    }

    if (maxPurchasableQuantity !== null && quantity > maxPurchasableQuantity) {
      setExceededStockError()
      return null
    }

    setIsAdding(true)
    setError(null)

    await addToCart({
      variantId: selectedVariant.id,
      quantity,
      countryCode,
    })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setIsAdding(false)
      })
  }

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={actionsRef}>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <ProductPrice product={product} variant={selectedVariant} />
          {multibuyLabel && multibuyUrl ? (
            <a
              href={multibuyUrl}
              className="mt-2 inline-flex text-sm font-semibold text-sky-700 hover:text-sky-600"
            >
              {isArabic ? "عروض الكميات" : "Or Mix & Match"}: {multibuyLabel}
            </a>
          ) : null}
        </div>

        <div>
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-4">
              {(product.options || []).map((option) => {
                return (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.id]}
                      updateOption={setOptionValue}
                      title={option.title ?? ""}
                      placeholder={isArabic ? "اختر" : "Select"}
                      getOptionLabel={(value) => getOptionLabel(option.id, value)}
                      data-testid="product-options"
                      disabled={!!disabled || isAdding}
                    />
                  </div>
                )
              })}
              <Divider />
            </div>
          )}
        </div>

        <div className="mt-2 rounded-md border border-slate-200 p-3">
          <div className="mb-2 text-sm font-semibold text-slate-700">
            {isArabic ? "الكمية" : "Quantity"}
          </div>
          <div className="flex w-fit items-center rounded-md border border-slate-300">
            <button
              type="button"
              className="h-11 w-11 text-lg"
              aria-label={isArabic ? "تقليل الكمية" : "Decrease quantity"}
              onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
              disabled={isAdding || !!disabled || quantity <= 1}
            >
              -
            </button>
            <label htmlFor="product-quantity-input" className="sr-only">
              {isArabic ? "الكمية" : "Quantity"}
            </label>
            <input
              id="product-quantity-input"
              type="number"
              min={1}
              value={quantity}
              aria-label={isArabic ? "الكمية" : "Quantity"}
              onChange={(event) => {
                const value = Number(event.target.value)
                if (!Number.isNaN(value) && value > 0) {
                  const nextQuantity = Math.floor(value)

                  if (
                    maxPurchasableQuantity !== null &&
                    nextQuantity > maxPurchasableQuantity
                  ) {
                    setQuantity(maxPurchasableQuantity)
                    setExceededStockError()
                    return
                  }

                  setError(null)
                  setQuantity(nextQuantity)
                }
              }}
              className="h-11 w-16 border-x border-slate-300 text-center outline-none"
            />
            <button
              type="button"
              className="h-11 w-11 text-lg"
              aria-label={isArabic ? "زيادة الكمية" : "Increase quantity"}
              onClick={() => {
                if (
                  maxPurchasableQuantity !== null &&
                  quantity >= maxPurchasableQuantity
                ) {
                  setExceededStockError()
                  return
                }

                setError(null)
                setQuantity((prev) => prev + 1)
              }}
              disabled={isAdding || !!disabled}
            >
              +
            </button>
          </div>
          {inventoryMessage && (
            <div className="mt-2 text-sm text-slate-600">{inventoryMessage}</div>
          )}
          <ErrorMessage
            error={error}
            data-testid="product-quantity-error-message"
          />
        </div>

        <Button
          onClick={handleAddToCart}
          disabled={
            !inStock ||
            !selectedVariant ||
            !!disabled ||
            isAdding ||
            !isValidVariant
          }
          variant="primary"
          className="w-full h-10"
          isLoading={isAdding}
          data-testid="add-product-button"
        >
          {!selectedVariant && !options
            ? isArabic
              ? "اختر الخيار"
              : "Select variant"
            : !inStock || !isValidVariant
              ? isArabic
                ? "نفد المخزون"
                : "Out of stock"
              : isArabic
                ? "أضف إلى السلة"
                : "Add To Basket"}
        </Button>
        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  )
}
