const formatCurrency = (amount?: number | null, currencyCode?: string | null) => {
  if (typeof amount !== "number") {
    return null
  }

  try {
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency: (currencyCode || "SAR").toUpperCase(),
    }).format(amount / 100)
  } catch {
    return `${(amount / 100).toFixed(2)} ${String(currencyCode || "SAR").toUpperCase()}`
  }
}

const stripHtml = (value: string) =>
  value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

const renderEmailLayout = ({
  title,
  intro,
  body,
  ctaLabel,
  ctaUrl,
}: {
  title: string
  intro: string
  body: string
  ctaLabel?: string
  ctaUrl?: string
}) => {
  const ctaHtml =
    ctaLabel && ctaUrl
      ? `<p style="margin:24px 0;text-align:center;"><a href="${ctaUrl}" style="display:inline-block;background:#152b4d;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:700;">${ctaLabel}</a></p>`
      : ""

  return {
    html: `
<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charSet="UTF-8" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;background:#f5f7fb;padding:32px 16px;font-family:Tahoma,Arial,sans-serif;color:#152033;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e5e7eb;">
      <div style="margin-bottom:24px;">
        <div style="font-size:14px;color:#64748b;margin-bottom:8px;">Vape Hub KSA</div>
        <h1 style="margin:0;font-size:28px;line-height:1.4;color:#152b4d;">${title}</h1>
      </div>
      <p style="font-size:16px;line-height:1.9;margin:0 0 16px;">${intro}</p>
      <div style="font-size:15px;line-height:1.9;color:#334155;">${body}</div>
      ${ctaHtml}
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:13px;line-height:1.8;color:#64748b;">
        هذه رسالة آلية من البريد الرسمي للمتجر. إذا احتجت أي مساعدة يمكنك الرد على هذا البريد أو التواصل معنا عبر الموقع.
      </div>
    </div>
  </body>
</html>
    `.trim(),
    text: `${title}\n\n${intro}\n\n${stripHtml(body)}${
      ctaLabel && ctaUrl ? `\n\n${ctaLabel}: ${ctaUrl}` : ""
    }`,
  }
}

export const buildWelcomeEmail = ({
  email,
  firstName,
}: {
  email: string
  firstName?: string | null
}) => {
  const name = firstName || "عميلنا العزيز"

  return renderEmailLayout({
    title: "مرحبًا بك في Vape Hub KSA",
    intro: `أهلًا ${name}، تم إنشاء حسابك بنجاح في متجر Vape Hub KSA.`,
    body: `يمكنك الآن متابعة طلباتك وإدارة عناوينك والشراء بشكل أسرع من خلال حسابك المسجل بالبريد: <strong>${email}</strong>.`,
    ctaLabel: "الدخول إلى حسابي",
    ctaUrl: `${process.env.STOREFRONT_URL || "https://vapehubksa.com"}/ar/account`,
  })
}

export const buildResetPasswordEmail = ({
  email,
  resetUrl,
}: {
  email: string
  resetUrl: string
}) => {
  return renderEmailLayout({
    title: "إعادة تعيين كلمة المرور",
    intro: `تلقينا طلبًا لإعادة تعيين كلمة المرور للحساب المرتبط بالبريد ${email}.`,
    body: "إذا كنت أنت من طلب ذلك، اضغط على الزر التالي لتعيين كلمة مرور جديدة. صلاحية الرابط قصيرة لحماية حسابك. وإذا لم تطلب إعادة التعيين، يمكنك تجاهل هذه الرسالة.",
    ctaLabel: "إعادة تعيين كلمة المرور",
    ctaUrl: resetUrl,
  })
}

export const buildOrderPlacedEmail = ({
  email,
  orderId,
  total,
  currencyCode,
}: {
  email: string
  orderId: string
  total?: number | null
  currencyCode?: string | null
}) => {
  const formattedTotal = formatCurrency(total, currencyCode)

  return renderEmailLayout({
    title: "تم استلام طلبك بنجاح",
    intro: `شكرًا لتسوقك من Vape Hub KSA. تم استلام طلبك رقم ${orderId}.`,
    body: `${
      formattedTotal
        ? `إجمالي الطلب الحالي: <strong>${formattedTotal}</strong>.<br />`
        : ""
    }سنراجع الطلب ونبدأ المعالجة في أسرع وقت، وسيصلك أي تحديث لاحقًا على هذا البريد: <strong>${email}</strong>.`,
    ctaLabel: "متابعة الطلب",
    ctaUrl: `${process.env.STOREFRONT_URL || "https://vapehubksa.com"}/ar/account/orders`,
  })
}

export const buildTestEmail = () => {
  return renderEmailLayout({
    title: "رسالة اختبار من البريد الرسمي",
    intro: "تم ربط البريد الرسمي للمتجر بنجاح.",
    body: "هذه رسالة تجريبية للتأكد من أن إعدادات البريد تعمل بشكل صحيح وأن الرسائل ستصل من البريد الرسمي للمتجر بترميز عربي سليم.",
  })
}
