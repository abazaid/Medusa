import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { buildResetPasswordEmail } from "../lib/email/templates"
import { sendStoreEmail } from "../lib/email/mailer"

type PasswordResetEvent = {
  entity_id: string
  actor_type: string
  token: string
  metadata?: {
    reset_url?: string
  }
}

export default async function authPasswordResetHandler({
  event: { data },
  container,
}: SubscriberArgs<PasswordResetEvent>) {
  if (data.actor_type !== "customer" || !data.entity_id || !data.token) {
    return
  }

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const baseResetUrl =
    data.metadata?.reset_url ||
    `${process.env.STOREFRONT_URL || "https://vapehubksa.com"}/ar/account/reset-password`

  const resetUrl = new URL(baseResetUrl)
  resetUrl.searchParams.set("token", data.token)

  const email = buildResetPasswordEmail({
    email: data.entity_id,
    resetUrl: resetUrl.toString(),
  })

  await sendStoreEmail({
    to: data.entity_id,
    subject: "إعادة تعيين كلمة المرور - Vape Hub KSA",
    html: email.html,
    text: email.text,
  })

  logger.info(`Sent password reset email to ${data.entity_id}`)
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}
