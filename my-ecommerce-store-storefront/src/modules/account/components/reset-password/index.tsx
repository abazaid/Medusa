"use client"

import { resetCustomerPassword } from "@lib/data/customer"
import Input from "@modules/common/components/input"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { useActionState } from "react"

const ResetPassword = ({
  token,
  countryCode,
}: {
  token: string
  countryCode: string
}) => {
  const [message, formAction] = useActionState(resetCustomerPassword, null)

  return (
    <div className="max-w-sm w-full flex flex-col items-center" data-testid="reset-password-page">
      <h1 className="text-large-semi mb-6">تعيين كلمة مرور جديدة</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        اختر كلمة مرور جديدة لحسابك ثم سجّل الدخول من جديد.
      </p>
      <form className="w-full" action={formAction}>
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="country_code" value={countryCode} />
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="كلمة المرور الجديدة"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            data-testid="reset-password-input"
          />
        </div>
        <ErrorMessage error={message} data-testid="reset-password-error-message" />
        <SubmitButton data-testid="reset-password-button" className="w-full mt-6">
          حفظ كلمة المرور
        </SubmitButton>
      </form>
    </div>
  )
}

export default ResetPassword
