import { Container, Heading, Text } from "@medusajs/ui"

import { isStripeLike, paymentInfoMap } from "@lib/constants"
import Divider from "@modules/common/components/divider"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type PaymentDetailsProps = {
  order: HttpTypes.StoreOrder
}

const PaymentDetails = ({ order }: PaymentDetailsProps) => {
  const payment = order.payment_collections?.[0].payments?.[0]
  const paidAt =
    payment?.created_at
      ? new Intl.DateTimeFormat("ar-SA", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date(payment.created_at))
      : null

  return (
    <div>
      <Heading level="h2" className="my-6 flex flex-row text-2xl font-bold md:text-3xl">
        الدفع
      </Heading>
      <div>
        {payment && (
          <div className="flex w-full flex-col gap-6 md:flex-row md:items-start">
            <div className="flex w-full flex-col md:w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                طريقة الدفع
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method"
              >
                {paymentInfoMap[payment.provider_id].title}
              </Text>
            </div>
            <div className="flex w-full flex-col md:w-2/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                تفاصيل الدفع
              </Text>
              <div className="flex gap-2 txt-medium text-ui-fg-subtle items-center">
                <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                  {paymentInfoMap[payment.provider_id].icon}
                </Container>
                <Text data-testid="payment-amount">
                  {isStripeLike(payment.provider_id) && payment.data?.card_last4
                    ? `**** **** **** ${payment.data.card_last4}`
                    : `${convertToLocale({
                        amount: payment.amount,
                        currency_code: order.currency_code,
                      })}${paidAt ? ` - تم الدفع في ${paidAt}` : ""}`}
                </Text>
              </div>
            </div>
          </div>
        )}
      </div>

      <Divider className="mt-8" />
    </div>
  )
}

export default PaymentDetails
