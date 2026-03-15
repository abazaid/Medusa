import { ArrowUpRightMini } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import { Metadata } from "next"
import Link from "next/link"

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
        الرابط الذي فتحته غير متوفر حاليًا أو تم تغييره. يمكنك العودة إلى
        الرئيسية أو متابعة التصفح من الأقسام الأساسية.
      </p>
      <Link
        className="flex gap-x-1 items-center group"
        href="/ar"
      >
        <Text className="text-ui-fg-interactive">العودة إلى الرئيسية</Text>
        <ArrowUpRightMini
          className="group-hover:rotate-45 ease-in-out duration-150"
          color="var(--fg-interactive)"
        />
      </Link>
    </div>
  )
}
