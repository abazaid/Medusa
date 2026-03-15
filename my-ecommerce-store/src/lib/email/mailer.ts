import nodemailer from "nodemailer"

type StoreEmailInput = {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

let transporter: nodemailer.Transporter | null = null

const getRequiredEnv = (name: string) => {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required email environment variable: ${name}`)
  }

  return value
}

const getTransporter = () => {
  if (transporter) {
    return transporter
  }

  transporter = nodemailer.createTransport({
    host: getRequiredEnv("SMTP_HOST"),
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: {
      user: getRequiredEnv("SMTP_USER"),
      pass: getRequiredEnv("SMTP_PASS"),
    },
  })

  return transporter
}

export const getStoreFromAddress = () => {
  const fromEmail = getRequiredEnv("SMTP_FROM_EMAIL")
  const fromName = process.env.SMTP_FROM_NAME || "Vape Hub KSA"

  return `${fromName} <${fromEmail}>`
}

export const sendStoreEmail = async ({
  to,
  subject,
  html,
  text,
  from,
}: StoreEmailInput) => {
  const mailer = getTransporter()

  return mailer.sendMail({
    from: from || getStoreFromAddress(),
    to,
    subject,
    html,
    text,
    encoding: "utf-8",
    textEncoding: "base64",
    headers: {
      "X-Entity-Ref-ID": `vapehubksa-${Date.now()}`,
    },
  })
}

export const verifyStoreEmailTransport = async () => {
  const mailer = getTransporter()

  await mailer.verify()
}
