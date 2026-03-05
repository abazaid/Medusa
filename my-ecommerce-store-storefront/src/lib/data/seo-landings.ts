export type SeoLanding = {
  id: string
  slugEn: string
  slugAr: string
  titleEn: string
  titleAr: string
  descriptionEn: string
  descriptionAr: string
  keywordEn: string
  keywordAr: string
}

export const seoLandings: SeoLanding[] = [
  {
    id: "best-vape-devices",
    slugEn: "best-vape-devices",
    slugAr: "افضل-اجهزة-الفيب",
    titleEn: "Best Vape Devices in Saudi Arabia",
    titleAr: "أفضل أجهزة الفيب في السعودية",
    descriptionEn:
      "Compare top vape devices, discover key differences, and shop the strongest options for daily use in Saudi Arabia.",
    descriptionAr:
      "قارن أفضل أجهزة الفيب المتوفرة، وتعرّف على الفروقات الأساسية، واختر الأنسب للاستخدام اليومي داخل السعودية.",
    keywordEn: "vape device",
    keywordAr: "جهاز فيب",
  },
  {
    id: "best-nic-salt-e-liquid",
    slugEn: "best-nic-salt-e-liquid",
    slugAr: "افضل-نكهات-النكوتين-سولت",
    titleEn: "Best Nic Salt E-Liquid",
    titleAr: "أفضل نكهات النيكوتين سولت",
    descriptionEn:
      "Browse high-demand nic salt e-liquids and find the best flavour profile and nicotine level for your device.",
    descriptionAr:
      "تصفح نكهات النيكوتين سولت الأعلى طلبًا واختر الطعم ونسبة النيكوتين المناسبة لجهازك.",
    keywordEn: "nic salt",
    keywordAr: "نيكوتين سولت",
  },
  {
    id: "best-pod-systems",
    slugEn: "best-pod-systems",
    slugAr: "افضل-بود-سيستم",
    titleEn: "Best Pod Systems",
    titleAr: "أفضل أجهزة البود سيستم",
    descriptionEn:
      "Find easy-to-use pod systems with strong battery life and smooth draw performance for all-day vaping.",
    descriptionAr:
      "اكتشف أجهزة بود سيستم سهلة الاستخدام ببطارية قوية وسحبة ناعمة تناسب الاستخدام اليومي.",
    keywordEn: "pod system",
    keywordAr: "بود سيستم",
  },
  {
    id: "best-vape-coils",
    slugEn: "best-vape-coils",
    slugAr: "افضل-كويلات-الفيب",
    titleEn: "Best Vape Coils",
    titleAr: "أفضل كويلات الفيب",
    descriptionEn:
      "Shop replacement coils for popular devices and choose the right resistance for flavor or cloud output.",
    descriptionAr:
      "تسوّق كويلات بديلة للأجهزة الشائعة واختر المقاومة المناسبة للطعم أو كثافة السحبة.",
    keywordEn: "vape coil",
    keywordAr: "كويل فيب",
  },
  {
    id: "best-vape-accessories",
    slugEn: "best-vape-accessories",
    slugAr: "افضل-اكسسوارات-الفيب",
    titleEn: "Best Vape Accessories",
    titleAr: "أفضل إكسسوارات الفيب",
    descriptionEn:
      "Upgrade your setup with practical vape accessories, chargers, pods, and add-ons used by frequent users.",
    descriptionAr:
      "طوّر تجربتك عبر إكسسوارات الفيب العملية مثل الشواحن والبودات والملحقات الأكثر استخدامًا.",
    keywordEn: "vape accessories",
    keywordAr: "اكسسوارات فيب",
  },
]

export const getSeoLandingSlug = (landing: SeoLanding, locale: "ar" | "en") =>
  locale === "ar" ? landing.slugAr : landing.slugEn

export const getSeoLandingBySlug = (slug: string, locale: "ar" | "en") => {
  const normalized = decodeURIComponent(slug).trim().toLowerCase()

  return seoLandings.find((landing) => {
    const localeSlug = getSeoLandingSlug(landing, locale)
    const otherLocaleSlug = getSeoLandingSlug(landing, locale === "ar" ? "en" : "ar")
    return (
      decodeURIComponent(localeSlug).trim().toLowerCase() === normalized ||
      decodeURIComponent(otherLocaleSlug).trim().toLowerCase() === normalized
    )
  })
}
