import { getLocale } from "@lib/data/locale-actions"
import { retrieveCart } from "@lib/data/cart"
import CartDropdown from "../cart-dropdown"

export default async function CartButton() {
  const [cart, locale] = await Promise.all([
    retrieveCart().catch(() => null),
    getLocale(),
  ])

  return <CartDropdown cart={cart} locale={locale} />
}
