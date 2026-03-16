"use client"

import { updateLineItem } from "@lib/data/cart"
import { buildProductImageAlt } from "@lib/util/image-alt"
import {
  getVariantMaxPurchasableQuantity,
} from "@lib/util/product-availability"
import { getProductSlug } from "@lib/util/slug"
import { HttpTypes } from "@medusajs/types"
import { Table, Text, clx } from "@medusajs/ui"
import CartItemSelect from "@modules/cart/components/cart-item-select"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { useParams } from "next/navigation"
import { useState } from "react"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
  currencyCode: string
}

const Item = ({ item, type = "full", currencyCode }: ItemProps) => {
  const params = useParams()
  const localeSegment =
    typeof params.countryCode === "string" ? params.countryCode : "ar"
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const maxQuantity = getVariantMaxPurchasableQuantity(item.variant)
  const quantityLimit = maxQuantity === null ? 10 : Math.max(1, maxQuantity)

  const changeQuantity = async (quantity: number) => {
    if (maxQuantity !== null && quantity > maxQuantity) {
      setError(`الكمية المطلوبة غير متوفرة. المتبقي في المخزون: ${maxQuantity}.`)
      return
    }

    setError(null)
    setUpdating(true)

    await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  const productSlug = getProductSlug(
    {
      title: item.product_title || "",
      handle: item.product_handle || "",
      metadata: null,
    },
    localeSegment
  )

  const thumbnailAlt = buildProductImageAlt({
    productTitle: item.product_title || item.title || "",
    context:
      localeSegment.toLowerCase() === "ar"
        ? "صورة المنتج في السلة"
        : "cart product image",
    locale: localeSegment,
  })

  return (
    <Table.Row className="w-full" data-testid="product-row">
      <Table.Cell className="!pl-0 p-4 w-24">
        <LocalizedClientLink
          href={`/products/${encodeURIComponent(productSlug)}`}
          className={clx("flex", {
            "w-16": type === "preview",
            "small:w-24 w-12": type === "full",
          })}
        >
          <Thumbnail
            thumbnail={item.thumbnail}
            images={item.variant?.product?.images}
            alt={thumbnailAlt}
            size="square"
          />
        </LocalizedClientLink>
      </Table.Cell>

      <Table.Cell className="text-left">
        <Text
          className="txt-medium-plus text-ui-fg-base"
          data-testid="product-title"
        >
          {item.product_title}
        </Text>
        <LineItemOptions variant={item.variant} data-testid="product-variant" />
      </Table.Cell>

      {type === "full" && (
        <Table.Cell>
          <div className="flex gap-2 items-center w-28">
            <DeleteButton id={item.id} data-testid="product-delete-button" />
            <CartItemSelect
              value={item.quantity}
              onChange={(value) => changeQuantity(parseInt(value.target.value))}
              className="w-14 h-10 p-4"
              data-testid="product-select-button"
            >
              {Array.from(
                {
                  length: Math.min(quantityLimit, 10),
                },
                (_, i) => (
                  <option value={i + 1} key={i}>
                    {i + 1}
                  </option>
                )
              )}
            </CartItemSelect>
            {updating && <Spinner />}
          </div>
          {maxQuantity !== null && (
            <Text className="mt-2 text-ui-fg-muted text-small-regular">
              المتبقي في المخزون: {maxQuantity}
            </Text>
          )}
          <ErrorMessage error={error} data-testid="product-error-message" />
        </Table.Cell>
      )}

      {type === "full" && (
        <Table.Cell className="hidden small:table-cell">
          <LineItemUnitPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </Table.Cell>
      )}

      <Table.Cell className="!pr-0">
        <span
          className={clx("!pr-0", {
            "flex flex-col items-end h-full justify-center": type === "preview",
          })}
        >
          {type === "preview" && (
            <span className="flex gap-x-1 ">
              <Text className="text-ui-fg-muted">{item.quantity}x </Text>
              <LineItemUnitPrice
                item={item}
                style="tight"
                currencyCode={currencyCode}
              />
            </span>
          )}
          <LineItemPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </span>
      </Table.Cell>
    </Table.Row>
  )
}

export default Item
