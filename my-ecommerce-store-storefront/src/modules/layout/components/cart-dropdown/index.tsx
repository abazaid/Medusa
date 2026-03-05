"use client"

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react"
import { Fragment, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"

import { convertToLocale } from "@lib/util/money"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"

const copy = {
  ar: {
    cart: "السلة",
    quantity: "الكمية",
    remove: "حذف",
    subtotal: "الإجمالي الفرعي",
    exclTaxes: "(بدون الضريبة)",
    goToCart: "اذهب إلى السلة",
    empty: "سلة التسوق فارغة.",
    goToProducts: "اذهب إلى صفحة جميع المنتجات",
    explore: "استكشف المنتجات",
  },
  en: {
    cart: "Cart",
    quantity: "Quantity",
    remove: "Remove",
    subtotal: "Subtotal",
    exclTaxes: "(excl. taxes)",
    goToCart: "Go to cart",
    empty: "Your shopping bag is empty.",
    goToProducts: "Go to all products page",
    explore: "Explore products",
  },
}

const CartDropdown = ({
  cart: cartState,
  locale = "ar",
}: {
  cart?: HttpTypes.StoreCart | null
  locale?: string
}) => {
  const [activeTimer, setActiveTimer] = useState<NodeJS.Timeout | undefined>(
    undefined
  )
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)
  const isArabic = locale.toLowerCase() === "ar"
  const labels = isArabic ? copy.ar : copy.en

  const open = () => setCartDropdownOpen(true)
  const close = () => setCartDropdownOpen(false)

  const totalItems =
    cartState?.items?.reduce((acc, item) => {
      return acc + item.quantity
    }, 0) || 0

  const subtotal = cartState?.subtotal ?? 0
  const itemRef = useRef<number>(totalItems || 0)

  const timedOpen = () => {
    open()

    const timer = setTimeout(close, 5000)
    setActiveTimer(timer)
  }

  const openAndCancel = () => {
    if (activeTimer) {
      clearTimeout(activeTimer)
    }

    open()
  }

  useEffect(() => {
    return () => {
      if (activeTimer) {
        clearTimeout(activeTimer)
      }
    }
  }, [activeTimer])

  const pathname = usePathname()

  useEffect(() => {
    if (itemRef.current !== totalItems && !pathname.includes("/cart")) {
      timedOpen()
    }
  }, [totalItems, pathname])

  return (
    <div className="z-50 h-full" onMouseEnter={openAndCancel} onMouseLeave={close}>
      <Popover className="relative h-full">
        <PopoverButton className="h-full">
          <LocalizedClientLink
            className="text-slate-100 transition-colors hover:text-primary-300"
            href="/cart"
            data-testid="nav-cart-link"
          >{`${labels.cart} (${totalItems})`}</LocalizedClientLink>
        </PopoverButton>
        <Transition
          show={cartDropdownOpen}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <PopoverPanel
            static
            className={`absolute top-[calc(100%+1px)] hidden w-[min(420px,calc(100vw-1rem))] border-x border-b border-gray-200 bg-white text-ui-fg-base small:block ${
              isArabic ? "left-0" : "right-0"
            }`}
            dir={isArabic ? "rtl" : "ltr"}
            data-testid="nav-cart-dropdown"
          >
            <div className="flex items-center justify-center p-4">
              <h3 className="text-large-semi">{labels.cart}</h3>
            </div>
            {cartState && cartState.items?.length ? (
              <>
                <div className="grid max-h-[402px] grid-cols-1 gap-y-8 overflow-y-scroll p-px px-4 no-scrollbar">
                  {cartState.items
                    .sort((a, b) => ((a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1))
                    .map((item) => (
                      <div
                        className="grid grid-cols-[122px_1fr] gap-x-4"
                        key={item.id}
                        data-testid="cart-item"
                      >
                        <LocalizedClientLink href={`/products/${item.product_handle}`} className="w-24">
                          <Thumbnail
                            thumbnail={item.thumbnail}
                            images={item.variant?.product?.images}
                            size="square"
                          />
                        </LocalizedClientLink>
                        <div className="flex flex-1 flex-col justify-between">
                          <div className="flex flex-1 flex-col">
                            <div className="flex items-start justify-between">
                              <div className="mr-4 flex w-[180px] flex-col overflow-ellipsis whitespace-nowrap">
                                <h3 className="text-base-regular overflow-hidden text-ellipsis">
                                  <LocalizedClientLink
                                    href={`/products/${item.product_handle}`}
                                    data-testid="product-link"
                                  >
                                    {item.title}
                                  </LocalizedClientLink>
                                </h3>
                                <LineItemOptions
                                  variant={item.variant}
                                  data-testid="cart-item-variant"
                                  data-value={item.variant}
                                />
                                <span data-testid="cart-item-quantity" data-value={item.quantity}>
                                  {labels.quantity}: {item.quantity}
                                </span>
                              </div>
                              <div className="flex justify-end">
                                <LineItemPrice
                                  item={item}
                                  style="tight"
                                  currencyCode={cartState.currency_code}
                                />
                              </div>
                            </div>
                          </div>
                          <DeleteButton
                            id={item.id}
                            className="mt-1"
                            data-testid="cart-item-remove-button"
                          >
                            {labels.remove}
                          </DeleteButton>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="flex flex-col gap-y-4 p-4 text-small-regular">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ui-fg-base">
                      {labels.subtotal} <span className="font-normal">{labels.exclTaxes}</span>
                    </span>
                    <span className="text-large-semi" data-testid="cart-subtotal" data-value={subtotal}>
                      {convertToLocale({
                        amount: subtotal,
                        currency_code: cartState.currency_code,
                      })}
                    </span>
                  </div>
                  <LocalizedClientLink href="/cart" passHref>
                    <Button className="w-full" size="large" data-testid="go-to-cart-button">
                      {labels.goToCart}
                    </Button>
                  </LocalizedClientLink>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-y-4 py-16">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-small-regular text-white">
                  <span>0</span>
                </div>
                <span>{labels.empty}</span>
                <div>
                  <LocalizedClientLink href="/store">
                    <>
                      <span className="sr-only">{labels.goToProducts}</span>
                      <Button onClick={close}>{labels.explore}</Button>
                    </>
                  </LocalizedClientLink>
                </div>
              </div>
            )}
          </PopoverPanel>
        </Transition>
      </Popover>
    </div>
  )
}

export default CartDropdown
