import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getLocale } from "@lib/data/locale-actions"
import CartTemplate from "@modules/cart/templates"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Cart",
  description: "View your cart",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function Cart() {
  const [cart, customer, locale] = await Promise.all([
    retrieveCart().catch((error) => {
      console.error(error)
      return notFound()
    }),
    retrieveCustomer(),
    getLocale(),
  ])

  return <CartTemplate cart={cart} customer={customer} locale={locale} />
}
