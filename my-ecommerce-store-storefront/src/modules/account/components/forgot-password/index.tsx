"use client"

import { requestPasswordReset } from "@lib/data/customer"
import Input from "@modules/common/components/input"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { useActionState } from "react"

const ForgotPassword = ({ countryCode }: { countryCode: string }) => {
  const [message, formAction] = useActionState(requestPasswordReset, null)
  const isSuccess =
    typeof message === "string" && message.includes("تم إرسال رابط")

  return (
    <div className="max-w-sm w-full flex flex-col items-center" data-testid="forgot-password-page">
      <h1 className="text-large-semi mb-6">استعادة كلمة المرور</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.
      </p>
      <form className="w-full" action={formAction}>
        <input type="hidden" name="country_code" value={countryCode} />
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="البريد الإلكتروني"
            name="email"
            type="email"
            autoComplete="email"
            required
            data-testid="forgot-password-email-input"
          />
        </div>
        {isSuccess ? (
          <div className="pt-2 text-emerald-600 text-small-regular">{message}</div>
        ) : (
          <ErrorMessage error={message} data-testid="forgot-password-error-message" />
        )}
        <SubmitButton data-testid="forgot-password-button" className="w-full mt-6">
          إرسال رابط الاستعادة
        </SubmitButton>
      </form>
    </div>
  )
}

export default ForgotPassword
