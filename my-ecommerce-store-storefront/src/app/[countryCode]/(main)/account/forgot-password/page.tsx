import { Metadata } from "next"
import ForgotPassword from "@modules/account/components/forgot-password"

export const metadata: Metadata = {
  title: "استعادة كلمة المرور",
  description: "أرسل رابط استعادة كلمة المرور إلى بريدك الإلكتروني.",
}

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params

  return <ForgotPassword countryCode={countryCode} />
}
