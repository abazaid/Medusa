import { Metadata } from "next"

import InteractiveLink from "@modules/common/components/interactive-link"

export const metadata: Metadata = {
  title: "الصفحة غير موجودة",
  description: "تعذر العثور على الصفحة المطلوبة.",
  robots: {
    index: false,
    follow: true,
  },
}

export default function NotFound() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)] px-6 text-center">
      <h1 className="text-2xl-semi text-ui-fg-base">الصفحة غير موجودة</h1>
      <p className="text-small-regular text-ui-fg-base max-w-xl">
        يبدو أن هذا الرابط قديم أو غير صحيح. إذا كان المنتج أو القسم ما زال
        موجودًا فسنحوّلك تلقائيًا للرابط الصحيح، وإلا يمكنك العودة للمتجر.
      </p>
      <InteractiveLink href="/ar">الذهاب إلى الرئيسية</InteractiveLink>
    </div>
  )
}
