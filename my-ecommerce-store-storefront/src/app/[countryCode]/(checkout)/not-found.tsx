import InteractiveLink from "@modules/common/components/interactive-link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "الصفحة غير موجودة",
  description: "تعذر العثور على الصفحة المطلوبة.",
  robots: {
    index: false,
    follow: true,
  },
}

export default async function NotFound() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)] px-6 text-center">
      <h1 className="text-2xl-semi text-ui-fg-base">الصفحة غير موجودة</h1>
      <p className="text-small-regular text-ui-fg-base max-w-xl">
        تعذر العثور على صفحة الشراء المطلوبة. يمكنك العودة للمتجر ومتابعة
        التسوق من الروابط الصحيحة.
      </p>
      <InteractiveLink href="/ar">العودة إلى الرئيسية</InteractiveLink>
    </div>
  )
}
