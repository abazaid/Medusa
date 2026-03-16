const translateError = (error: string) => {
  const normalized = error.toLowerCase()

  if (normalized.includes("invalid email or password")) {
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة."
  }

  if (normalized.includes("already exists")) {
    return "هذا البريد الإلكتروني مستخدم بالفعل."
  }

  if (normalized.includes("unauthorized")) {
    return "غير مصرح لك بتنفيذ هذا الإجراء."
  }

  if (normalized.includes("no response received from server")) {
    return "تعذر الاتصال بالخادم حاليًا. حاول مرة أخرى بعد قليل."
  }

  if (normalized.includes("bad gateway")) {
    return "الخادم غير متاح حاليًا أو حدث خلل مؤقت في الاتصال. حاول مرة أخرى بعد قليل."
  }

  if (
    normalized.includes("not enough inventory") ||
    normalized.includes("insufficient inventory") ||
    normalized.includes("not enough items in stock")
  ) {
    const match = error.match(/(\d+)/)

    if (match) {
      return `الكمية المطلوبة غير متوفرة. المتبقي في المخزون: ${match[1]}.`
    }

    return "الكمية المطلوبة غير متوفرة في المخزون."
  }

  if (normalized.startsWith("error:")) {
    return error.replace(/^error:\s*/i, "حدث خطأ: ")
  }

  return error
}

const ErrorMessage = ({
  error,
  "data-testid": dataTestid,
}: {
  error?: string | null
  "data-testid"?: string
}) => {
  if (!error) {
    return null
  }

  return (
    <div
      className="pt-2 text-rose-500 text-small-regular"
      data-testid={dataTestid}
    >
      <span>{translateError(error)}</span>
    </div>
  )
}

export default ErrorMessage
