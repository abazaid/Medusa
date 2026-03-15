import { Heading } from "@medusajs/ui"
import { cookies as nextCookies } from "next/headers"

import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import { HttpTypes } from "@medusajs/types"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const cookies = await nextCookies()

  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"

  return (
    <div className="min-h-[calc(100vh-64px)] bg-white py-6 md:py-10">
      <div className="content-container flex w-full max-w-5xl flex-col items-center justify-center gap-y-8">
        {isOnboarding && <OnboardingCta orderId={order.id} />}
        <div
          className="flex w-full flex-col gap-4 rounded-lg border border-slate-200 bg-white px-4 py-6 shadow-sm md:px-8 md:py-10"
          data-testid="order-complete-container"
        >
          <Heading
            level="h1"
            className="mb-4 flex flex-col gap-y-3 text-2xl text-ui-fg-base md:text-3xl"
          >
            <span>شكرًا لك</span>
            <span>تم تأكيد طلبك بنجاح.</span>
          </Heading>
          <OrderDetails order={order} />
          <Heading level="h2" className="flex flex-row text-2xl font-bold md:text-3xl">
            ملخص الطلب
          </Heading>
          <Items order={order} />
          <CartTotals totals={order} />
          <ShippingDetails order={order} />
          <PaymentDetails order={order} />
          <Help />
        </div>
      </div>
    </div>
  )
}
