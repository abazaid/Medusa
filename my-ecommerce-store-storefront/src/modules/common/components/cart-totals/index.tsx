"use client"

import { convertToLocale } from "@lib/util/money"
import React from "react"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_subtotal?: number | null
    shipping_subtotal?: number | null
    discount_subtotal?: number | null
  }
  locale?: string
}

const SAUDI_VAT_RATE = 0.15

const roundMoney = (amount: number) => Math.round(amount * 100) / 100

const CartTotals: React.FC<CartTotalsProps> = ({ totals, locale = "ar" }) => {
  const isArabic = locale.toLowerCase() === "ar"
  const {
    currency_code,
    total,
    subtotal,
    tax_total,
    item_subtotal,
    shipping_subtotal,
    discount_subtotal,
  } = totals

  const inclusiveItemsSubtotal = item_subtotal ?? subtotal ?? 0
  const resolvedTaxTotal =
    (tax_total ?? 0) > 0
      ? tax_total ?? 0
      : roundMoney(
          inclusiveItemsSubtotal - inclusiveItemsSubtotal / (1 + SAUDI_VAT_RATE)
        )
  const productsSubtotalBeforeTax = roundMoney(
    Math.max(0, inclusiveItemsSubtotal - resolvedTaxTotal)
  )

  return (
    <div>
      <div className="flex flex-col gap-y-2 txt-medium text-ui-fg-subtle ">
        <div className="flex items-center justify-between">
          <span>
            {isArabic
              ? "قيمة المنتجات قبل الضريبة"
              : "Products subtotal (excl. tax)"}
          </span>
          <span
            data-testid="cart-subtotal"
            data-value={productsSubtotalBeforeTax}
          >
            {convertToLocale({
              amount: productsSubtotalBeforeTax,
              currency_code,
            })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>{isArabic ? "الشحن" : "Shipping"}</span>
          <span
            data-testid="cart-shipping"
            data-value={shipping_subtotal || 0}
          >
            {convertToLocale({ amount: shipping_subtotal ?? 0, currency_code })}
          </span>
        </div>
        {!!discount_subtotal && (
          <div className="flex items-center justify-between">
            <span>{isArabic ? "الخصم" : "Discount"}</span>
            <span
              className="text-ui-fg-interactive"
              data-testid="cart-discount"
              data-value={discount_subtotal || 0}
            >
              -{" "}
              {convertToLocale({
                amount: discount_subtotal ?? 0,
                currency_code,
              })}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="flex gap-x-1 items-center ">
            {isArabic ? "الضريبة" : "Taxes"}
          </span>
          <span data-testid="cart-taxes" data-value={resolvedTaxTotal || 0}>
            {convertToLocale({
              amount: resolvedTaxTotal ?? 0,
              currency_code,
            })}
          </span>
        </div>
      </div>
      <div className="h-px w-full border-b border-gray-200 my-4" />
      <div className="flex items-center justify-between text-ui-fg-base mb-2 txt-medium ">
        <span>{isArabic ? "الإجمالي" : "Total"}</span>
        <span
          className="txt-xlarge-plus"
          data-testid="cart-total"
          data-value={total || 0}
        >
          {convertToLocale({ amount: total ?? 0, currency_code })}
        </span>
      </div>
      <div className="h-px w-full border-b border-gray-200 mt-4" />
    </div>
  )
}

export default CartTotals
