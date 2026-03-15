import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { buildOrderPlacedEmail } from "../lib/email/templates"
import { sendStoreEmail } from "../lib/email/mailer"

type OrderPlacedEvent = {
  id: string
}

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<OrderPlacedEvent>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "email", "total", "currency_code"],
    filters: {
      id: data.id,
    },
  })

  const order = orders?.[0]

  if (!order?.email) {
    return
  }

  const email = buildOrderPlacedEmail({
    email: order.email,
    orderId: String(order.display_id || order.id),
    total: order.total,
    currencyCode: order.currency_code,
  })

  await sendStoreEmail({
    to: order.email,
    subject: `تأكيد استلام الطلب #${String(order.display_id || order.id)}`,
    html: email.html,
    text: email.text,
  })

  logger.info(`Sent order confirmation email to ${order.email}`)
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
