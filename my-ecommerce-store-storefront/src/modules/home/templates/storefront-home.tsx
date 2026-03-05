import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import { buildBrandImageAlt } from "@lib/util/image-alt"
import Image from "next/image"

import { brands } from "@lib/data/brands"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Newsletter from "@modules/home/components/newsletter"
import FeaturedProducts from "@modules/home/components/featured-products"
import ProductPreview from "@modules/products/components/product-preview"

type Locale = "ar" | "en"

type LocalizedText = {
  ar: string
  en: string
}

type LocalizedCard = {
  title: LocalizedText
  text: LocalizedText
}

const serviceTiles: LocalizedText[] = [
  { ar: "توصيل مجاني", en: "Free Delivery" },
  { ar: "شحن في نفس اليوم", en: "Same-Day Dispatch" },
  { ar: "عروض خاصة", en: "Special Offers" },
  { ar: "أجهزة فيب", en: "Vape Kits" },
  { ar: "سوائل إلكترونية", en: "E-Liquids" },
  { ar: "أجهزة بود", en: "Pod Systems" },
  { ar: "كويلات", en: "Coils" },
  { ar: "إكسسوارات", en: "Accessories" },
]

const highlightCards: LocalizedCard[] = [
  {
    title: { ar: "تحقق من العمر", en: "Age Verified" },
    text: {
      ar: "رسائل واضحة لبناء الثقة وتأكيد أن المتجر مخصص للبالغين.",
      en: "Clear trust messaging that confirms this store is intended for adults.",
    },
  },
  {
    title: { ar: "شحن سريع", en: "Fast Dispatch" },
    text: {
      ar: "إبراز سرعة التجهيز والتوصيل بنفس أسلوب صفحات البيع القوية.",
      en: "Prominent dispatch messaging similar to high-converting retail storefronts.",
    },
  },
  {
    title: { ar: "منتجات موثوقة", en: "Trusted Products" },
    text: {
      ar: "أقسام مرتبة لإظهار المنتجات الأكثر طلبًا بشكل أسرع.",
      en: "Organized sections that surface your most popular products first.",
    },
  },
  {
    title: { ar: "مساعدة ونصائح", en: "Help & Advice" },
    text: {
      ar: "مساحة لأسئلة شائعة وأدلة شراء ورسائل دعم واضحة.",
      en: "Space for FAQs, buying guides, and clear support-driven messaging.",
    },
  },
]

const categoryPanels: LocalizedText[] = [
  { ar: "أجهزة بود", en: "Pod Kits" },
  { ar: "نيك سالت", en: "Nic Salts" },
  { ar: "أجهزة استخدام واحد", en: "Disposables" },
  { ar: "شورت فيل", en: "Shortfills" },
  { ar: "مودات وتانكات", en: "Mods & Tanks" },
  { ar: "وصل حديثًا", en: "New Arrivals" },
]

const flavorTiles: LocalizedText[] = [
  { ar: "تبغ", en: "Tobacco" },
  { ar: "نعناع", en: "Mint" },
  { ar: "توت", en: "Berry" },
  { ar: "حمضيات", en: "Citrus" },
  { ar: "حلويات", en: "Dessert" },
  { ar: "نكهات باردة", en: "Ice Blends" },
]

const infoPanels = [
  {
    title: { ar: "لماذا تشتري منا", en: "Why Buy From Us" },
    text: {
      ar: "استخدم هذا القسم لعرض سرعة التوصيل، سياسة العمر، الدعم، وعناصر الثقة.",
      en: "Use this section for delivery promises, age policy, support coverage, and trust signals.",
    },
    bullets: [
      { ar: "شحن سريع", en: "Fast Dispatch" },
      { ar: "منتجات أصلية", en: "Genuine Products" },
      { ar: "أسعار واضحة", en: "Clear Pricing" },
      { ar: "فريق دعم", en: "Support Team" },
    ],
  },
  {
    title: { ar: "أنشئ حسابك", en: "Create Your Account" },
    text: {
      ar: "قسم مخصص للحسابات، تتبع الطلبات، والعروض الخاصة للعملاء الدائمين.",
      en: "A dedicated area for account benefits, order tracking, and repeat-customer offers.",
    },
    bullets: [
      { ar: "تتبع الطلب", en: "Track Orders" },
      { ar: "حفظ العناوين", en: "Save Addresses" },
      { ar: "إعادة الطلب", en: "Quick Reorders" },
      { ar: "عروض خاصة", en: "Special Offers" },
    ],
  },
]

const faqs: LocalizedText[] = [
  {
    ar: "ما أفضل جهاز فيب للمبتدئين؟",
    en: "What is the best vape device for beginners?",
  },
  {
    ar: "ما قوة النيكوتين المناسبة لي؟",
    en: "Which nicotine strength should I choose?",
  },
  {
    ar: "كم تدوم الكويلات عادة؟",
    en: "How long do vape coils usually last?",
  },
  {
    ar: "ما الفرق بين النيك سالت والشورت فيل؟",
    en: "What is the difference between nic salts and shortfills?",
  },
]

const reviewCards: LocalizedText[] = [
  {
    ar: "التوصيل سريع والصفحة الرئيسية أصبحت أسهل بكثير في التصفح.",
    en: "Delivery is fast and the homepage is now much easier to browse.",
  },
  {
    ar: "الهيكل الآن أقرب لمتجر فيب احترافي ويُظهر المنتجات بشكل أفضل.",
    en: "The structure now feels closer to a real vape retailer and showcases products better.",
  },
  {
    ar: "الأقسام الزرقاء الداكنة وصفوف المنتجات أصبحت أقرب للتصميم المطلوب.",
    en: "The dark blue sections and product rows now feel much closer to the intended design.",
  },
]

const guideCards = [
  {
    title: { ar: "أفضل أجهزة البداية", en: "Best Starter Kits" },
    text: {
      ar: "مساحة لأدلة الشراء والمحتوى التعليمي مع زر دعوة واضح.",
      en: "A space for buying guides and educational content with a clear CTA.",
    },
  },
  {
    title: { ar: "اختيار السائل المناسب", en: "Choosing the Right E-Liquid" },
    text: {
      ar: "استخدم هذا القسم لشرح النكهات ونسب VG/PG وقوة النيكوتين.",
      en: "Use this section to explain flavours, VG/PG ratios, and nicotine strength.",
    },
  },
  {
    title: { ar: "أجهزة البود أم الاستخدام الواحد", en: "Pod Kits vs Disposables" },
    text: {
      ar: "قسم مقارنات مشابه لبطاقات المحتوى السفلية في الصورة المرجعية.",
      en: "A comparison section similar to the lower editorial cards in the reference layout.",
    },
  },
]

const pageCopy = {
  ar: {
    promoEyebrow: "منطقة عرض رئيسية للعروض",
    promoTitle: "بانر ترويجي كبير يركز على العرض أولاً",
    promoText: "هذا البانر العلوي يتبع نفس الفكرة: عنوان قوي، وصف مختصر، وزر دعوة واضح.",
    shopNow: "تسوق الآن",
    welcomeTitle: "أهلاً بك في متجرنا",
    welcomeTextOne:
      "هذا القسم يحاكي نفس الترتيب: نص ترحيبي في جهة، ولوحة بصرية في الجهة الأخرى. استخدمه للتعريف بالمتجر، وبناء الثقة، وشرح سبب الشراء منك.",
    welcomeTextTwo:
      "الهدف أن تبدو الصفحة الرئيسية كواجهة بيع احترافية، لا مجرد قالب متجر افتراضي.",
    featurePanel: "لوحة تعريفية",
    featurePanelTitle: "ستايل فيب",
    productsTitle: "الأكثر مبيعًا من أجهزة الفيب",
    productsSubtitle: "مصمم بنفس فكرة أول صف منتجات في الصورة المرجعية.",
    categoriesTitle: "تصفح الأقسام الشائعة",
    categoriesText:
      "هذا القسم يتبع نفس إيقاع منتصف الصفحة: بطاقات متعددة في شبكة متقاربة لعرض الفئات بسرعة.",
    brandsTitle: "أشهر العلامات التجارية",
    liquidsTitle: "الأكثر مبيعًا من السوائل",
    liquidsSubtitle: "صف منتجات ثانٍ ليحاكي تكرار الأقسام التجارية في التصميم.",
    guideTitle: "دليل السوائل الإلكترونية",
    guideText:
      "هذا النص يمثل المساحة المعلوماتية الطويلة بين قسم السوائل وبطاقات النكهات كما يظهر في الصورة.",
    darkBand: "شريط معلومات داكن",
    darkBandTitle: "قسم الدعم والتوصيل والاشتراك",
    darkBandText:
      "التصميم المرجعي يستخدم شريطًا أزرق داكنًا قبل الأسئلة الشائعة والمراجعات، وهذا يمنح نفس الانتقال البصري.",
    quickSignup: "اشتراك سريع",
    subscribe: "اشترك",
    faqTitle: "الأسئلة الشائعة",
    reviewsTitle: "آراء العملاء",
    trustedReviews: "تقييمات موثوقة",
    guidesTitle: "أدلة مميزة",
    guidesText: "بطاقات محتوى مشابهة لقسم المقالات والأدلة في نهاية الصفحة.",
    readMore: "اقرأ المزيد",
    viewAll: "عرض الكل",
  },
  en: {
    promoEyebrow: "Main Promotional Area",
    promoTitle: "A large hero banner built around the offer first",
    promoText:
      "This top banner follows the same merchandising idea: a strong headline, concise copy, and one clear CTA.",
    shopNow: "Shop Now",
    welcomeTitle: "Welcome to Our Store",
    welcomeTextOne:
      "This section follows the same structure: a welcome text block on one side and a visual panel on the other. Use it to introduce the store, build trust, and explain why customers should buy from you.",
    welcomeTextTwo:
      "The goal is for the homepage to feel like a real retail landing page, not a generic storefront template.",
    featurePanel: "Feature Panel",
    featurePanelTitle: "Vape Style",
    productsTitle: "Best-Selling Vape Devices",
    productsSubtitle: "Built around the same idea as the first product row in the reference layout.",
    categoriesTitle: "Browse Popular Categories",
    categoriesText:
      "This section follows the same mid-page rhythm: multiple cards in a tight grid for quick category discovery.",
    brandsTitle: "Popular Brands",
    liquidsTitle: "Best-Selling E-Liquids",
    liquidsSubtitle: "A second product row that matches the repeated merchandising sections.",
    guideTitle: "E-Liquid Guide",
    guideText:
      "This block represents the longer informational area between the liquids section and the flavour tiles.",
    darkBand: "Dark Information Band",
    darkBandTitle: "Support, Delivery, and Signup Section",
    darkBandText:
      "The reference layout uses a dark blue strip before FAQs and reviews, creating the same visual transition here.",
    quickSignup: "Quick Signup",
    subscribe: "Subscribe",
    faqTitle: "Frequently Asked Questions",
    reviewsTitle: "Customer Reviews",
    trustedReviews: "Trusted Reviews",
    guidesTitle: "Featured Guides",
    guidesText: "Content cards similar to the editorial guides section near the end of the page.",
    readMore: "Read More",
    viewAll: "View All",
  },
}

function t(locale: Locale, item: LocalizedText) {
  return item[locale]
}

function ProductRailShell({
  title,
  subtitle,
  buttonText,
  children,
}: {
  title: string
  subtitle: string
  buttonText: string
  children: React.ReactNode
}) {
  return (
    <section className="py-8">
      <div className="content-container">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-700">
              {buttonText}
            </p>
            <Heading level="h2" className="mt-2 text-2xl font-bold text-secondary-900 md:text-3xl">
              {title}
            </Heading>
            <Text className="mt-1 text-sm text-secondary-600">{subtitle}</Text>
          </div>
          <LocalizedClientLink
            href="/store"
            className="text-sm font-semibold text-primary-700 transition-colors hover:text-primary-600"
          >
            {buttonText}
          </LocalizedClientLink>
        </div>
        <div className="rounded-sm border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
          {children}
        </div>
      </div>
    </section>
  )
}

export default function StorefrontHome({
  collections,
  locale,
  products,
  region,
}: {
  collections: HttpTypes.StoreCollection[]
  locale: string
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
}) {
  const activeLocale: Locale = locale.toLowerCase() === "en" ? "en" : "ar"
  const copy = pageCopy[activeLocale]
  const primaryCollections = collections.slice(0, 1)
  const secondaryCollections = collections.slice(1, 2)
  const featuredProducts = products.slice(0, 8)
  const latestProducts = products.slice(8, 12)

  return (
    <div className="bg-[#eef0f3] text-secondary-900">
      <section className="border-b border-slate-300 bg-white">
        <div className="content-container py-4">
          <div className="grid gap-4 border border-slate-300 bg-[#d9dde3] p-5 md:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-secondary-800">
                {copy.promoEyebrow}
              </p>
              <Heading level="h1" className="mt-3 text-3xl font-bold uppercase text-secondary-900 md:text-4xl">
                {copy.promoTitle}
              </Heading>
              <Text className="mt-3 max-w-2xl text-sm leading-7 text-secondary-700">
                {copy.promoText}
              </Text>
              <LocalizedClientLink
                href="/store"
                className="mt-5 inline-flex items-center rounded-sm bg-secondary-800 px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-secondary-700"
              >
                {copy.shopNow}
              </LocalizedClientLink>
            </div>
            <div className="flex min-h-[220px] items-center justify-center bg-gradient-to-br from-white to-slate-100 p-6">
              <div className="grid grid-cols-5 gap-3">
                {["#1f2937", "#ef4444", "#f97316", "#ec4899", "#111827"].map(
                  (color, index) => (
                    <div
                      key={index}
                      className="h-24 w-8 rounded-t-full rounded-b-md shadow-md"
                      style={{ backgroundColor: color }}
                    />
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-6">
        <div className="content-container">
          <div className="grid gap-[2px] bg-slate-300 sm:grid-cols-2 lg:grid-cols-4">
            {serviceTiles.map((tile) => (
              <div
                key={tile.en}
                className="flex min-h-[58px] items-center justify-center bg-[#11385c] px-3 text-center text-sm font-semibold text-white"
              >
                {t(activeLocale, tile)}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-4">
        <div className="content-container">
          <div className="grid gap-4 border border-slate-300 bg-white p-4 lg:grid-cols-[1fr_0.95fr]">
            <div>
              <Heading level="h2" className="text-2xl font-bold text-secondary-900">
                {copy.welcomeTitle}
              </Heading>
              <Text className="mt-3 text-sm leading-7 text-secondary-700">
                {copy.welcomeTextOne}
              </Text>
              <Text className="mt-3 text-sm leading-7 text-secondary-700">
                {copy.welcomeTextTwo}
              </Text>
            </div>
            <div className="min-h-[220px] bg-[linear-gradient(135deg,#1e293b,#0f172a)] p-6 text-white">
              <div className="flex h-full items-end justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-primary-300">
                    {copy.featurePanel}
                  </p>
                  <p className="mt-2 text-4xl font-bold">{copy.featurePanelTitle}</p>
                </div>
                <div className="flex gap-3">
                  <div className="h-28 w-16 rounded-full bg-slate-300/20" />
                  <div className="h-24 w-16 rounded-full bg-slate-300/30" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-[1px] bg-slate-300 md:grid-cols-4">
            {highlightCards.map((card) => (
              <div key={card.title.en} className="bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-700">
                  {t(activeLocale, card.title)}
                </p>
                <p className="mt-2 text-xs leading-6 text-secondary-600">
                  {t(activeLocale, card.text)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProductRailShell
        title={copy.productsTitle}
        subtitle={copy.productsSubtitle}
        buttonText={copy.viewAll}
      >
        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductPreview key={product.id} product={product} region={region} isFeatured />
            ))}
          </div>
        ) : (
          <ul className="flex flex-col gap-6">
            <FeaturedProducts collections={primaryCollections} region={region} />
          </ul>
        )}
      </ProductRailShell>

      <section className="pb-8">
        <div className="content-container">
          <div className="rounded-sm border border-slate-300 bg-white p-4">
            <Heading level="h2" className="text-2xl font-bold text-secondary-900">
              {copy.categoriesTitle}
            </Heading>
            <Text className="mt-2 text-sm leading-7 text-secondary-700">
              {copy.categoriesText}
            </Text>
            <div className="mt-5 grid gap-[2px] bg-slate-300 md:grid-cols-3">
              {categoryPanels.map((item, index) => (
                <LocalizedClientLink
                  key={item.en}
                  href="/store"
                  className="relative min-h-[120px] overflow-hidden bg-[#11385c] p-4 text-white"
                >
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background:
                        index % 2 === 0
                          ? "linear-gradient(135deg, #0f172a, #334155)"
                          : "linear-gradient(135deg, #1d4ed8, #0f172a)",
                    }}
                  />
                  <div className="relative flex h-full items-end">
                    <span className="text-sm font-semibold uppercase tracking-[0.16em]">
                      {t(activeLocale, item)}
                    </span>
                  </div>
                </LocalizedClientLink>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-8">
        <div className="content-container rounded-sm border border-slate-300 bg-white p-5">
          <Heading level="h2" className="text-center text-2xl font-bold text-secondary-900">
            {copy.brandsTitle}
          </Heading>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {brands.map((brand) => (
              <LocalizedClientLink
                key={brand.handle}
                href={`/brands/${brand.handle}`}
                className="flex min-h-[132px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-4 text-center transition-colors hover:border-primary-300 hover:bg-white"
                title={activeLocale === "ar" ? brand.nameAr : brand.nameEn}
              >
                <Image
                  src={brand.logo}
                  alt={buildBrandImageAlt({
                    brandName: activeLocale === "ar" ? brand.nameAr : brand.nameEn,
                    locale: activeLocale,
                  })}
                  width={160}
                  height={48}
                  className="mb-3 max-h-12 max-w-full object-contain"
                />
                <div className="text-sm font-bold tracking-[0.08em] text-secondary-800">
                  {activeLocale === "ar" ? brand.nameAr : brand.nameEn}
                </div>
              </LocalizedClientLink>
            ))}
          </div>
        </div>
      </section>

      <ProductRailShell
        title={copy.liquidsTitle}
        subtitle={copy.liquidsSubtitle}
        buttonText={copy.viewAll}
      >
        {latestProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {latestProducts.map((product) => (
              <ProductPreview key={product.id} product={product} region={region} />
            ))}
          </div>
        ) : (
          <ul className="flex flex-col gap-6">
            <FeaturedProducts collections={secondaryCollections} region={region} />
          </ul>
        )}
      </ProductRailShell>

      <section className="pb-8">
        <div className="content-container rounded-sm border border-slate-300 bg-white p-4">
          <Heading level="h2" className="text-2xl font-bold text-secondary-900">
            {copy.guideTitle}
          </Heading>
          <Text className="mt-3 text-sm leading-7 text-secondary-700">
            {copy.guideText}
          </Text>
          <div className="mt-5 grid gap-[2px] bg-slate-300 sm:grid-cols-2 lg:grid-cols-3">
            {flavorTiles.map((item, index) => (
              <div
                key={item.en}
                className="relative min-h-[86px] overflow-hidden p-4 text-white"
                style={{
                  background:
                    index % 3 === 0
                      ? "linear-gradient(135deg, #3f1d0f, #7c2d12)"
                      : index % 3 === 1
                        ? "linear-gradient(135deg, #14532d, #1f2937)"
                        : "linear-gradient(135deg, #1e3a8a, #0f172a)",
                }}
              >
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative flex h-full items-end">
                  <span className="text-sm font-semibold uppercase tracking-[0.16em]">
                    {t(activeLocale, item)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-8">
        <div className="content-container grid gap-4 lg:grid-cols-2">
          {infoPanels.map((panel, index) => (
            <div
              key={panel.title.en}
              className={
                index === 1
                  ? "bg-[#223752] p-6 text-white"
                  : "border border-slate-300 bg-white p-6"
              }
            >
              <Heading
                level="h2"
                className={`text-2xl font-bold ${index === 1 ? "text-white" : "text-secondary-900"}`}
              >
                {t(activeLocale, panel.title)}
              </Heading>
              <Text
                className={`mt-3 text-sm leading-7 ${index === 1 ? "text-slate-200" : "text-secondary-700"}`}
              >
                {t(activeLocale, panel.text)}
              </Text>
              <div className="mt-5 grid grid-cols-2 gap-2">
                {panel.bullets.map((bullet) => (
                  <div
                    key={bullet.en}
                    className={
                      index === 1
                        ? "border border-white/15 bg-white/5 px-3 py-3 text-sm"
                        : "border border-slate-200 bg-slate-50 px-3 py-3 text-sm"
                    }
                  >
                    {t(activeLocale, bullet)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#0f3a5c] py-8 text-white">
        <div className="content-container grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary-300">
              {copy.darkBand}
            </p>
            <Heading level="h2" className="mt-3 text-3xl font-bold">
              {copy.darkBandTitle}
            </Heading>
            <Text className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
              {copy.darkBandText}
            </Text>
          </div>
          <div className="rounded-sm bg-white/10 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.16em]">
              {copy.quickSignup}
            </p>
            <div className="mt-4 flex gap-2">
              <div className="h-11 flex-1 bg-white/90" />
              <div className="flex h-11 items-center bg-secondary-900 px-6 text-sm font-semibold uppercase">
                {copy.subscribe}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="content-container rounded-sm border border-slate-300 bg-white p-4">
          <Heading level="h2" className="text-2xl font-bold text-secondary-900">
            {copy.faqTitle}
          </Heading>
          <div className="mt-4 divide-y divide-slate-200 border border-slate-200">
            {faqs.map((faq) => (
              <div key={faq.en} className="flex items-center justify-between px-4 py-4 text-sm">
                <span>{t(activeLocale, faq)}</span>
                <span className="text-primary-700">+</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-8">
        <div className="content-container rounded-sm border border-slate-300 bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <Heading level="h2" className="text-2xl font-bold text-secondary-900">
              {copy.reviewsTitle}
            </Heading>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-green-700">
              {copy.trustedReviews}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {reviewCards.map((review) => (
              <div key={review.en} className="border border-slate-200 bg-slate-50 p-4">
                <div className="text-green-600">*****</div>
                <p className="mt-3 text-sm leading-7 text-secondary-700">
                  {t(activeLocale, review)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-10">
        <div className="content-container rounded-sm border border-slate-300 bg-white p-4">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <Heading level="h2" className="text-2xl font-bold text-secondary-900">
                {copy.guidesTitle}
              </Heading>
              <Text className="mt-1 text-sm text-secondary-600">{copy.guidesText}</Text>
            </div>
            <LocalizedClientLink
              href="/store"
              className="text-sm font-semibold text-primary-700 transition-colors hover:text-primary-600"
            >
              {copy.readMore}
            </LocalizedClientLink>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {guideCards.map((card, index) => (
              <div key={card.title.en} className="border border-slate-200 bg-white">
                <div
                  className="min-h-[150px]"
                  style={{
                    background:
                      index === 0
                        ? "linear-gradient(135deg, #c7d2fe, #93c5fd)"
                        : index === 1
                          ? "linear-gradient(135deg, #fde68a, #f9a8d4)"
                          : "linear-gradient(135deg, #bbf7d0, #93c5fd)",
                  }}
                />
                <div className="p-4">
                  <p className="text-lg font-bold text-secondary-900">
                    {t(activeLocale, card.title)}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-secondary-700">
                    {t(activeLocale, card.text)}
                  </p>
                  <LocalizedClientLink
                    href="/store"
                    className="mt-4 inline-flex items-center rounded-sm bg-secondary-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-secondary-700"
                  >
                    {copy.readMore}
                  </LocalizedClientLink>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Newsletter locale={activeLocale} />
    </div>
  )
}
