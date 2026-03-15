import { Metadata } from "next"
import ResetPassword from "@modules/account/components/reset-password"

export const metadata: Metadata = {
  title: "تعيين كلمة مرور جديدة",
  description: "قم بتعيين كلمة مرور جديدة لحسابك.",
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { countryCode } = await params
  const { token } = await searchParams

  return <ResetPassword token={token || ""} countryCode={countryCode} />
}
