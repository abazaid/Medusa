import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"

const CartTemplate = ({
  cart,
  customer,
  locale = "ar",
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  locale?: string
}) => {
  const isArabic = locale.toLowerCase() === "ar"

  return (
    <div className="py-10" dir={isArabic ? "rtl" : "ltr"}>
      <div className="content-container" data-testid="cart-container">
        {cart?.items?.length ? (
          <div className="grid grid-cols-1 gap-6 small:grid-cols-[1fr_360px]">
            <div className="flex flex-col gap-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              {!customer && (
                <>
                  <SignInPrompt />
                  <Divider />
                </>
              )}
              <ItemsTemplate cart={cart} locale={locale} />
            </div>
            <div className="relative">
              <div className="flex flex-col gap-y-8 sticky top-12">
                {cart && cart.region && (
                  <>
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <Summary cart={cart as any} locale={locale} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <EmptyCartMessage />
          </div>
        )}
      </div>
    </div>
  )
}

export default CartTemplate
