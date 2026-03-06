"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import { useRouter } from "next/navigation"

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
  const countryCode = useParams().countryCode as string
  const isArabic = countryCode?.toLowerCase() === "ar"
  const metadata = (product.metadata as Record<string, unknown> | null) || {}
  const multibuyLabel =
    typeof metadata.multibuy_label === "string" ? metadata.multibuy_label.trim() : ""
  const multibuyUrl =
    typeof metadata.multibuy_url === "string" ? metadata.multibuy_url.trim() : ""

  // If there is only 1 variant, preselect the options
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

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  //check if the selected options produce a valid variant
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
  }, [selectedVariant, isValidVariant])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant])

  const isVariantPurchasable = (variant?: HttpTypes.StoreProductVariant) => {
    if (!variant) return false
    if (!variant.manage_inventory) return true
    if (variant.allow_backorder) return true
    return (variant.inventory_quantity || 0) > 0
  }

  const getOptionLabel = (optionId: string, optionValue: string) => {
    const variants = product.variants || []
    const matchingVariants = variants.filter((variant) => {
      const variantOptions = optionsAsKeymap(variant.options)
      if (variantOptions?.[optionId] !== optionValue) {
        return false
      }

      return Object.entries(options).every(([selectedOptionId, selectedValue]) => {
        if (!selectedValue || selectedOptionId === optionId) {
          return true
        }
        return variantOptions?.[selectedOptionId] === selectedValue
      })
    })

    const hasAvailableVariant = matchingVariants.some((variant) =>
      isVariantPurchasable(variant)
    )

    if (hasAvailableVariant || matchingVariants.length === 0) {
      return optionValue
    }

    return isArabic ? `${optionValue} - نفدت الكمية` : `${optionValue} - Out of stock`
  }

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)

    await addToCart({
      variantId: selectedVariant.id,
      quantity,
      countryCode,
    })

    setIsAdding(false)
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
              className="h-9 w-9 text-lg"
              onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
              disabled={isAdding || !!disabled}
            >
              -
            </button>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => {
                const value = Number(event.target.value)
                if (!Number.isNaN(value) && value > 0) {
                  setQuantity(Math.floor(value))
                }
              }}
              className="h-9 w-16 border-x border-slate-300 text-center outline-none"
            />
            <button
              type="button"
              className="h-9 w-9 text-lg"
              onClick={() => setQuantity((prev) => prev + 1)}
              disabled={isAdding || !!disabled}
            >
              +
            </button>
          </div>
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
            ? isArabic ? "اختر الخيار" : "Select variant"
            : !inStock || !isValidVariant
            ? isArabic ? "نفد المخزون" : "Out of stock"
            : isArabic ? "أضف إلى السلة" : "Add To Basket"}
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
