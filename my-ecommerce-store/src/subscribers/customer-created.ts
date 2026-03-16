import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sendStoreEmail } from "../lib/email/mailer"
import { buildWelcomeEmail } from "../lib/email/templates"

type CustomerCreatedEvent = {
  id: string
}

export default async function customerCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<CustomerCreatedEvent>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "first_name", "last_name"],
    filters: {
      id: data.id,
    },
  })

  const customer = customers?.[0]

  if (!customer?.email) {
    return
  }

  try {
    const email = buildWelcomeEmail({
      email: customer.email,
      firstName: customer.first_name,
    })

    await sendStoreEmail({
      to: customer.email,
      subject: "مرحبًا بك في Vape Hub KSA",
      html: email.html,
      text: email.text,
    })

    logger.info(`Sent welcome email to ${customer.email}`)
  } catch (error: any) {
    logger.error(
      `Failed to send welcome email to ${customer.email}: ${error?.message || error}`
    )
    throw error
  }
}

export const config: SubscriberConfig = {
  event: "customer.created",
}
