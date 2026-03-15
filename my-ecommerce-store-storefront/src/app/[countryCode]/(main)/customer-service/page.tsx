import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "خدمة العملاء | Vape Hub KSA",
  description:
    "مساعدة العملاء في Vape Hub KSA، بما يشمل الأسئلة الشائعة وروابط الحساب وسياسة الخصوصية وشروط الاستخدام.",
}

const quickLinks = [
  {
    title: "سياسة الخصوصية",
    href: "/content/privacy-policy",
    description: "راجع كيفية التعامل مع بياناتك الشخصية أثناء استخدام المتجر.",
  },
  {
    title: "شروط الاستخدام",
    href: "/content/terms-of-use",
    description: "تعرف على شروط الطلب والحساب واستخدام خدمات المتجر.",
  },
  {
    title: "الحساب والطلبات",
    href: "/account",
    description: "الوصول إلى حسابك ومتابعة الطلبات والعناوين المحفوظة.",
  },
  {
    title: "الصفحة الرئيسية",
    href: "/",
    description: "العودة إلى المتجر وتصفح الأقسام والمنتجات الرئيسية.",
  },
]

export default function CustomerServicePage() {
  return (
    <div className="content-container py-16">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 md:p-10">
          <span className="text-sm font-bold text-sky-600">الدعم والمساعدة</span>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-[#1f2b44]">
            خدمة العملاء
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
            إذا كنت تحتاج مساعدة بخصوص الحساب أو الطلب أو معلومات الاستخدام، ستجد هنا
            أهم الصفحات التي تساعدك بسرعة على الوصول إلى الإجابة المناسبة.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {quickLinks.map((item) => (
            <LocalizedClientLink
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-sky-300 hover:shadow-sm"
            >
              <h2 className="text-lg font-bold text-[#1f2b44]">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {item.description}
              </p>
            </LocalizedClientLink>
          ))}
        </div>
      </div>
    </div>
  )
}
