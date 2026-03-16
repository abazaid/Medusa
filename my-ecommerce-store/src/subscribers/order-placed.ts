import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sendStoreEmail } from "../lib/email/mailer"
import { buildOrderPlacedEmail } from "../lib/email/templates"

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

  try {
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
  } catch (error: any) {
    logger.error(
      `Failed to send order confirmation email to ${order.email}: ${error?.message || error}`
    )
    throw error
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
