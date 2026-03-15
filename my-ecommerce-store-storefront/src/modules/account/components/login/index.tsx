import { login } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useActionState } from "react"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(login, null)

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="login-page"
    >
      <h1 className="text-large-semi mb-6">مرحبًا بعودتك</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        سجّل دخولك للوصول إلى تجربة تسوق أسرع وأسهل.
      </p>
      <form className="w-full" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="البريد الإلكتروني"
            name="email"
            type="email"
            title="أدخل بريدًا إلكترونيًا صحيحًا."
            autoComplete="email"
            required
            data-testid="email-input"
          />
          <Input
            label="كلمة المرور"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
          />
        </div>
        <ErrorMessage error={message} data-testid="login-error-message" />
        <SubmitButton data-testid="sign-in-button" className="w-full mt-6">
          تسجيل الدخول
        </SubmitButton>
      </form>
      <LocalizedClientLink
        href="/account/forgot-password"
        className="mt-4 text-sm text-ui-fg-interactive hover:text-ui-fg-interactive-hover underline"
      >
        نسيت كلمة المرور؟
      </LocalizedClientLink>
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        ليس لديك حساب؟{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="underline"
          data-testid="register-button"
        >
          أنشئ حسابًا
        </button>
        .
      </span>
    </div>
  )
}

export default Login
