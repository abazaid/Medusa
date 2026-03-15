import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { buildTestEmail } from "../lib/email/templates"
import { sendStoreEmail, verifyStoreEmailTransport } from "../lib/email/mailer"

export default async function sendTestEmail({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const recipient = process.env.TEST_EMAIL_TO || "tariqworldd@gmail.com"

  await verifyStoreEmailTransport()

  const message = buildTestEmail()

  await sendStoreEmail({
    to: recipient,
    subject: "رسالة اختبار من Vape Hub KSA",
    html: message.html,
    text: message.text,
  })

  logger.info(`Test email sent to ${recipient}`)
}
