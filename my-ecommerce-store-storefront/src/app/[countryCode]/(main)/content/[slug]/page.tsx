import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ContentPageProps = {
  params: Promise<{
    countryCode: string
    slug: string
  }>
}

type ContentEntry = {
  title: string
  description: string
  sections: Array<{
    heading: string
    paragraphs: string[]
  }>
}

const contentPages: Record<string, ContentEntry> = {
  "privacy-policy": {
    title: "سياسة الخصوصية",
    description:
      "نوضح في هذه الصفحة كيف نتعامل مع بياناتك الشخصية عند استخدام متجر Vape Hub KSA وإنشاء الطلبات والحسابات.",
    sections: [
      {
        heading: "جمع البيانات",
        paragraphs: [
          "نقوم بجمع البيانات الأساسية اللازمة لإتمام الطلبات وخدمة الحساب مثل الاسم، رقم الجوال، البريد الإلكتروني، عنوان الشحن ومعلومات الطلب.",
          "قد نستخدم هذه البيانات للتواصل معك بشأن حالة الطلب أو الدعم الفني أو استعادة الوصول إلى حسابك.",
        ],
      },
      {
        heading: "استخدام البيانات",
        paragraphs: [
          "تُستخدم بياناتك لتحسين تجربة الشراء، معالجة الطلبات، وإرسال الإشعارات المتعلقة بالطلبات أو الخدمات المرتبطة بالمتجر.",
          "لا يتم استخدام بياناتك بطريقة تخالف الغرض الأساسي من تقديم الخدمة داخل المتجر.",
        ],
      },
      {
        heading: "حماية المعلومات",
        paragraphs: [
          "نعمل على حماية بياناتك عبر مزودي خدمة موثوقين وإجراءات تقنية مناسبة لتقليل احتمالات الوصول غير المصرح به.",
          "رغم ذلك، لا توجد وسيلة نقل أو تخزين إلكتروني تضمن أمانًا مطلقًا بنسبة 100%.",
        ],
      },
      {
        heading: "التواصل والاستفسارات",
        paragraphs: [
          "إذا كان لديك أي استفسار بخصوص الخصوصية أو البيانات المرتبطة بحسابك أو طلباتك، يمكنك التواصل معنا عبر صفحة خدمة العملاء.",
        ],
      },
    ],
  },
  "terms-of-use": {
    title: "شروط الاستخدام",
    description:
      "هذه الصفحة توضح شروط استخدام متجر Vape Hub KSA وإتمام الطلبات واستخدام الحساب والخدمات المرتبطة بالمتجر.",
    sections: [
      {
        heading: "استخدام المتجر",
        paragraphs: [
          "باستخدامك لهذا المتجر فأنت توافق على التعامل معه بطريقة مشروعة وعدم إساءة استخدام الموقع أو محاولة الإضرار بالخدمة أو الوصول غير المصرح به للأنظمة.",
          "يتحمل العميل مسؤولية صحة البيانات التي يضيفها أثناء التسجيل أو أثناء تنفيذ الطلب.",
        ],
      },
      {
        heading: "الطلبات والأسعار",
        paragraphs: [
          "نعمل على عرض المنتجات والأسعار والمعلومات بأعلى دقة ممكنة، ومع ذلك قد يحدث تحديث في الأسعار أو التوفر أو بعض التفاصيل الفنية قبل تأكيد الطلب.",
          "إتمام الطلب يخضع لتوفر المنتج، والتحقق من الدفع أو طريقة السداد، وإمكانية الشحن إلى العنوان المحدد.",
        ],
      },
      {
        heading: "الحساب والمسؤولية",
        paragraphs: [
          "أنت مسؤول عن الحفاظ على سرية بيانات الدخول إلى حسابك وعن أي نشاط يتم من خلاله.",
          "في حال ملاحظة أي استخدام غير مصرح به لحسابك، يجب التواصل معنا فورًا لاتخاذ الإجراء المناسب.",
        ],
      },
      {
        heading: "تعديلات الخدمة",
        paragraphs: [
          "قد نقوم بتحديث هذه الشروط أو تعديل أجزاء من الخدمة أو المحتوى عند الحاجة لتحسين المتجر أو الامتثال للمتطلبات التشغيلية والتنظيمية.",
          "استمرارك في استخدام المتجر بعد التحديث يعني موافقتك على النسخة الأحدث من الشروط.",
        ],
      },
    ],
  },
}

export async function generateMetadata({
  params,
}: ContentPageProps): Promise<Metadata> {
  const { slug } = await params
  const content = contentPages[slug]

  if (!content) {
    return {
      title: "صفحة غير موجودة",
      robots: {
        index: false,
        follow: true,
      },
    }
  }

  return {
    title: `${content.title} | Vape Hub KSA`,
    description: content.description,
  }
}

export default async function ContentPage({ params }: ContentPageProps) {
  const { slug } = await params
  const content = contentPages[slug]

  if (!content) {
    return (
      <div className="content-container py-16">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-[#1f2b44]">الصفحة غير موجودة</h1>
          <p className="mt-4 text-base leading-8 text-slate-600">
            الرابط الذي تحاول الوصول إليه غير متوفر حاليًا.
          </p>
          <div className="mt-6">
            <LocalizedClientLink
              href="/"
              className="inline-flex rounded-lg bg-[#1f2b44] px-5 py-3 text-sm font-bold text-white"
            >
              العودة إلى الرئيسية
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="content-container py-16">
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 md:p-10">
        <div className="mb-8 border-b border-slate-200 pb-6">
          <span className="text-sm font-bold text-sky-600">معلومات المتجر</span>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-[#1f2b44]">
            {content.title}
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-600">
            {content.description}
          </p>
        </div>

        <div className="space-y-8">
          {content.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-bold text-[#1f2b44]">{section.heading}</h2>
              <div className="mt-3 space-y-4 text-base leading-8 text-slate-700">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-600">
          <LocalizedClientLink
            href="/customer-service"
            className="font-bold text-[#1f2b44] underline"
          >
            الانتقال إلى خدمة العملاء
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}
