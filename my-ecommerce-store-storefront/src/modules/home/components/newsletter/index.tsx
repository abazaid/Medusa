"use client"

import { useState } from "react"
import { Heading, Input, Button } from "@medusajs/ui"

type NewsletterProps = {
  locale?: string
}

const newsletterCopy = {
  ar: {
    badge: "عروض حصرية",
    title: "احصل على خصم 15% على أول طلب",
    description:
      "اشترك في نشرتنا الإخبارية واحصل على أحدث العروض والمنتجات الجديدة مباشرة إلى بريدك الإلكتروني.",
    successTitle: "تم الاشتراك بنجاح!",
    successBody: "تحقق من بريدك الإلكتروني للحصول على كود الخصم.",
    placeholder: "أدخل بريدك الإلكتروني",
    cta: "احصل على الخصم",
    benefitOne: "عروض حصرية",
    benefitTwo: "منتجات جديدة",
    benefitThree: "مراجعات المنتجات",
    privacy:
      "نحن نحترم خصوصيتك. لن نشارك بريدك مع أي طرف ثالث.",
  },
  en: {
    badge: "Exclusive Offers",
    title: "Get 15% off your first order",
    description:
      "Join our newsletter and receive the latest offers and new products directly in your inbox.",
    successTitle: "Subscription successful!",
    successBody: "Check your email to receive your discount code.",
    placeholder: "Enter your email address",
    cta: "Get the discount",
    benefitOne: "Exclusive offers",
    benefitTwo: "New products",
    benefitThree: "Product reviews",
    privacy: "We respect your privacy. We will never share your email with third parties.",
  },
}

const Newsletter = ({ locale = "ar" }: NewsletterProps) => {
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)
  const isArabic = locale.toLowerCase() === "ar"
  const copy = isArabic ? newsletterCopy.ar : newsletterCopy.en

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (email) {
      setSubscribed(true)
      setEmail("")
    }
  }

  return (
    <section className="bg-gradient-to-br from-secondary-900 to-secondary-800 py-20 text-white">
      <div className="container mx-auto px-4 md:px-8 lg:px-16 xl:px-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6">
            <span className="inline-block rounded-full bg-primary-500 px-6 py-2 text-sm font-semibold text-white">
              {copy.badge}
            </span>
          </div>

          <Heading level="h2" className="mb-4 text-3xl font-bold md:text-4xl">
            {copy.title}
          </Heading>

          <p className="mx-auto mb-8 max-w-xl text-lg text-secondary-300">
            {copy.description}
          </p>

          {subscribed ? (
            <div className="rounded-lg border border-success-400/30 bg-success-500/20 p-6 text-success-200">
              <div className="mb-2 text-2xl">OK</div>
              <div className="mb-2 text-lg font-semibold">{copy.successTitle}</div>
              <p className="text-sm">{copy.successBody}</p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mx-auto flex max-w-md flex-col gap-4 md:flex-row"
            >
              <div className="relative flex-1">
                <Input
                  type="email"
                  placeholder={copy.placeholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-full border border-secondary-600 bg-white/10 px-6 py-3 text-base text-white placeholder:text-secondary-400 focus:border-primary-400 focus:ring-primary-400"
                />
                <div className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
              </div>
              <Button
                type="submit"
                variant="primary"
                className="rounded-full bg-primary-500 px-8 py-3 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-primary-600"
              >
                {copy.cta}
              </Button>
            </form>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-secondary-400">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success-400"></span>
              <span>{copy.benefitOne}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary-400"></span>
              <span>{copy.benefitTwo}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent-400"></span>
              <span>{copy.benefitThree}</span>
            </div>
          </div>

          <p className="mt-6 text-xs text-secondary-500">{copy.privacy}</p>
        </div>
      </div>
    </section>
  )
}

export default Newsletter
