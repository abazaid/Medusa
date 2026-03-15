import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import * as Accordion from "@radix-ui/react-accordion"
import { listBlogPosts } from "@lib/data/blog"
import { getProductBrand } from "@lib/data/brands"
import { listCategories } from "@lib/data/categories"
import { brands } from "@lib/data/brands"
import { isProductInStock, sortByAvailability } from "@lib/util/product-availability"
import { getCategorySlug } from "@lib/util/slug"
import Image from "next/image"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import HeroCarousel from "@modules/home/components/hero-carousel"
import ProductPreview from "@modules/products/components/product-preview"

type Locale = "ar" | "en"

type StorefrontHomeProps = {
  collections: { id: string; handle: string; title: string }[]
  locale: string
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
}

type CategoryCard = {
  key: string
  title: string
  href: string
  icon: IconName
  accent?: "blue" | "orange"
  image?: string
}

type HeroSlide = {
  id: string
  eyebrow: string
  title: string
  text: string
  buttonLabel: string
  href: string
  image?: string
}

type BlogCard = {
  id: string
  title: string
  excerpt: string
  href: string
  image?: string
}

type ReviewCard = {
  name: string
  city: string
  title: string
  text: string
}

type FaqItem = {
  question: string
  answer: string
}

type IconName =
  | "tag"
  | "battery"
  | "multi"
  | "device"
  | "flame"
  | "drop"
  | "pod"
  | "coil"
  | "gift"
  | "brand"
  | "truck"
  | "clock"
  | "shield"
  | "star"
  | "stars"
  | "support"
  | "mail"
  | "users"

const flattenCategories = (
  categories: HttpTypes.StoreProductCategory[]
): HttpTypes.StoreProductCategory[] =>
  categories.flatMap((category) => [
    category,
    ...flattenCategories(
      (category.category_children as HttpTypes.StoreProductCategory[] | undefined) || []
    ),
  ])

const normalize = (value?: string | null) =>
  (value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, " ")

const includesAny = (value: string, tokens: string[]) =>
  tokens.some((token) => value.includes(normalize(token)))

const scoreCategoryMatch = (
  category: HttpTypes.StoreProductCategory,
  tokens: string[]
) => {
  const haystack = normalize(
    `${category.name || ""} ${category.handle || ""} ${category.description || ""}`
  )

  return tokens.reduce((score, token) => {
    const normalizedToken = normalize(token)
    if (!normalizedToken) {
      return score
    }

    if (haystack === normalizedToken) {
      return score + 6
    }

    if (haystack.includes(normalizedToken)) {
      return score + 3
    }

    return score
  }, 0)
}

const uniqueProducts = (items: HttpTypes.StoreProduct[]) => {
  const seen = new Set<string>()

  return items.filter((item) => {
    if (!item.id || seen.has(item.id)) {
      return false
    }

    seen.add(item.id)
    return true
  })
}

const getProductCategoryIds = (product: HttpTypes.StoreProduct) =>
  new Set((product.categories || []).map((category) => category.id).filter(Boolean))

const productMatchesCategory = (
  product: HttpTypes.StoreProduct,
  category?: HttpTypes.StoreProductCategory
) => {
  if (!category?.id) {
    return false
  }

  return getProductCategoryIds(product).has(category.id)
}

const selectSectionProducts = ({
  products,
  limit: _limit,
  category,
  includeTokens,
  excludeTokens = [],
}: {
  products: HttpTypes.StoreProduct[]
  limit: number
  category?: HttpTypes.StoreProductCategory
  includeTokens: string[]
  excludeTokens?: string[]
}) => {
  const directMatches = category
    ? products.filter((product) => productMatchesCategory(product, category))
    : []

  const tokenMatches = products.filter((product) => {
    const haystack = getProductText(product)

    if (!includesAny(haystack, includeTokens)) {
      return false
    }

    if (excludeTokens.length > 0 && includesAny(haystack, excludeTokens)) {
      return false
    }

    return true
  })

  // Keep all matches here, then let the display layer pick the first in-stock items.
  // Slicing too early can blank a section when the first few matches are out of stock.
  return uniqueProducts([...directMatches, ...tokenMatches])
}

const filterAvailableProducts = (
  products: HttpTypes.StoreProduct[],
  limit: number
) => uniqueProducts(products.filter((product) => isProductInStock(product))).slice(0, limit)

const getProductText = (product: HttpTypes.StoreProduct) => {
  const categories = (product.categories || [])
    .map((category) => `${category.name || ""} ${category.handle || ""}`)
    .join(" ")

  const metadata = (product.metadata as Record<string, unknown> | null) || {}
  const metadataText = Object.values(metadata)
    .filter((value) => typeof value === "string")
    .join(" ")

  return normalize(`${product.title || ""} ${product.handle || ""} ${categories} ${metadataText}`)
}

const getProductImage = (product?: HttpTypes.StoreProduct | null) =>
  product?.thumbnail || product?.images?.[0]?.url || ""

const classifyProducts = (products: HttpTypes.StoreProduct[]) => {
  const kits: HttpTypes.StoreProduct[] = []
  const liquids: HttpTypes.StoreProduct[] = []
  const disposables: HttpTypes.StoreProduct[] = []
  const accessories: HttpTypes.StoreProduct[] = []

  for (const product of products) {
    const haystack = getProductText(product)

    const isDisposableProduct = includesAny(haystack, [
      "disposable",
      "جاهزة",
      "سحبة",
      "سحبات",
      "single use",
      "one use",
    ])

    const isLiquidProduct = includesAny(haystack, [
      "salt",
      "nic salt",
      "liquid",
      "juice",
      "نكهة",
      "نكهات",
      "سائل",
      "سوائل",
      "سولت",
      "freebase",
    ])

    const isKitProduct = includesAny(haystack, [
      "kit",
      "device",
      "pod",
      "mod",
      "starter",
      "جهاز",
      "اجهزة",
      "بود",
      "بودات",
      "مود",
      "سيستم",
    ])

    const isAccessoryProduct = includesAny(haystack, [
      "coil",
      "coils",
      "tank",
      "battery",
      "charger",
      "accessories",
      "كويل",
      "كويلات",
      "تانك",
      "بطارية",
      "اكسسوار",
      "اكسسوارات",
    ])

    if (isDisposableProduct) {
      disposables.push(product)
      continue
    }

    if (isLiquidProduct) {
      liquids.push(product)
      continue
    }

    if (isKitProduct) {
      kits.push(product)
      continue
    }

    if (isAccessoryProduct) {
      accessories.push(product)
    }
  }

  return {
    kits: sortByAvailability(uniqueProducts(kits)),
    liquids: sortByAvailability(uniqueProducts(liquids)),
    disposables: sortByAvailability(uniqueProducts(disposables)),
    accessories: sortByAvailability(uniqueProducts(accessories)),
  }
}

const getCategoryHref = (
  category: HttpTypes.StoreProductCategory | undefined,
  locale: Locale
) => {
  if (!category) {
    return "/store"
  }

  return `/categories/${encodeURIComponent(getCategorySlug(category, locale))}`
}

const getCategoryHrefOverride = (
  category: HttpTypes.StoreProductCategory | undefined,
  locale: Locale,
  hrefOverride?: string
) => {
  if (hrefOverride) {
    return hrefOverride
  }

  return getCategoryHref(category, locale)
}

const sectionIntro = {
  ar: {
    featured: "تسوق الأقسام الرئيسية بسرعة عبر بطاقات واضحة تساعد العميل على الوصول مباشرة إلى النوع المناسب من المنتجات.",
    bestSellers: "مجموعة مختارة من المنتجات الأعلى طلبًا داخل المتجر، مرتبة لتظهر الخيارات المتوفرة بالمخزون أولًا وتدعم قرار الشراء بشكل أسرع.",
    kits: "اختر من أجهزة الفيب والبود سيستم المناسبة للمبتدئين والمحترفين، مع تركيز على الموديلات العملية والمطلوبة في السوق السعودي.",
    liquids: "استكشف نكهات نيكوتين سولت وسوائل إلكترونية مختارة بعناية لتناسب الاستخدام اليومي والنكهات الأكثر طلبًا.",
    disposables: "قسم السحبات الجاهزة يركز على المنتجات السريعة والسهلة في الاستخدام، مع إبراز الخيارات المتوفرة والمطلوبة.",
    deals: "عروض مرتبة بصياغة تجارية مباشرة لزيادة متوسط السلة وتسهيل الوصول إلى أفضل فرص التوفير داخل المتجر.",
    brands: "ماركات عالمية موثوقة في عالم الفيب، مع روابط مباشرة لصفحات البراند لتسهيل التصفح والمقارنة.",
    why: "رسائل ثقة وتجربة شراء احترافية تبين سرعة الشحن، أصالة المنتجات، ودعم ما بعد البيع داخل المملكة.",
    seo: "محتوى واضح يساعد العميل على التعرف على الأقسام والمنتجات المناسبة بسهولة وثقة.",
    blog: "مقالات وأدلة تساعد العميل على اختيار الجهاز أو النكهة المناسبة، مع نصائح واضحة وتجربة شراء أكثر ثقة.",
    reviews: "تقييمات بصياغة واقعية وأسماء محلية تعزز الثقة وتدعم قرار الشراء من الصفحة الرئيسية.",
    newsletter: "اشترك لتصلك العروض الجديدة، التنبيهات المهمة، وأحدث المقالات والمنتجات المضافة للمتجر.",
  },
  en: {
    featured: "Explore the main store categories through clear cards that help shoppers reach the right product type quickly.",
    bestSellers: "A curated row of high-demand products with in-stock items surfaced first for faster decisions.",
    kits: "Browse vape kits and pod systems selected for both beginners and experienced users.",
    liquids: "Discover nicotine salts and e-liquid options selected for everyday use and popular flavour profiles.",
    disposables: "This section highlights convenient disposable options with a focus on fast-moving in-stock products.",
    deals: "Merchandising-led offer blocks built to increase basket size and surface the strongest value plays.",
    brands: "Trusted global vape brands with direct links to brand landing pages for easier comparison.",
    why: "Trust-led messaging focused on fast delivery, genuine products, and responsive support within Saudi Arabia.",
    seo: "Helpful content that makes it easier for shoppers to discover the right products and categories.",
    blog: "Editorial content and guides that help shoppers choose the right device or flavor with more confidence.",
    reviews: "Social proof blocks with realistic customer language to strengthen trust from the homepage.",
    newsletter: "Stay updated with new deals, product launches, and fresh educational content from the store.",
  },
}

const copy = {
  ar: {
    heroButton: "تسوق الآن",
    featuredTitle: "أقسام المتجر الأساسية",
    bestSellersTitle: "الأكثر مبيعًا في متجر الفيب السعودي",
    kitsTitle: "أفضل أجهزة الفيب والبود سيستم",
    liquidsTitle: "نكهات نيكوتين سولت وسوائل إلكترونية",
    disposablesTitle: "سحبات جاهزة واستخدام يومي سريع",
    dealsTitle: "عروض وتوفير مميز",
    brandsTitle: "تسوق حسب الماركة",
    whyTitle: "لماذا يختار العملاء متجرنا؟",
    seoTitle: "متجر فيب سعودي يقدم أجهزة أصلية ونكهات مختارة وخيارات شراء واضحة",
    blogTitle: "مدونة وأدلة تساعدك على الاختيار",
    reviewsTitle: "آراء عملاء من السوق السعودي",
    newsletterTitle: "اشترك في النشرة البريدية",
    newsletterButton: "اشترك الآن",
    newsletterPlaceholder: "أدخل بريدك الإلكتروني",
    showAll: "عرض الكل",
    readGuide: "اقرأ الدليل",
    dealsButton: "استعرض العروض",
    sectionButton: "تصفح القسم",
    brandsButton: "كل الماركات",
    bestValue: "أفضل قيمة",
    trustedLabel: "تقييمات موثقة",
  },
  en: {
    heroButton: "Shop now",
    featuredTitle: "Core Store Categories",
    bestSellersTitle: "Best Sellers",
    kitsTitle: "Best Vape Kits",
    liquidsTitle: "Popular E-Liquids",
    disposablesTitle: "Disposable Vapes",
    dealsTitle: "Deals & Offers",
    brandsTitle: "Shop by Brand",
    whyTitle: "Why Choose Us",
    seoTitle: "A Saudi vape store built around genuine products, trusted brands, and a clearer shopping experience",
    blogTitle: "Guides & Editorial Picks",
    reviewsTitle: "Customer Reviews",
    newsletterTitle: "Subscribe to our newsletter",
    newsletterButton: "Subscribe",
    newsletterPlaceholder: "Enter your email",
    showAll: "View all",
    readGuide: "Read guide",
    dealsButton: "Browse offers",
    sectionButton: "Browse section",
    brandsButton: "All brands",
    bestValue: "Best value",
    trustedLabel: "Verified reviews",
  },
}

const reviewCards: Record<Locale, ReviewCard[]> = {
  ar: [
    {
      name: "عبدالله العتيبي",
      city: "الرياض",
      title: "تجربة شراء منظمة وسريعة",
      text: "الصفحة الرئيسية صارت أوضح بكثير، وقدرت أوصل بسرعة إلى الأجهزة والنكهات المناسبة بدون لف طويل. الشحن كان سريع والمنتجات وصلت بحالة ممتازة.",
    },
    {
      name: "سارة القحطاني",
      city: "جدة",
      title: "تنسيق احترافي وثقة أعلى",
      text: "أكثر شيء أعجبني هو وضوح الأقسام والعروض والماركات. صار من السهل مقارنة الخيارات واختيار المنتج المناسب حسب النوع والنكهة والسعر.",
    },
    {
      name: "محمد الدوسري",
      city: "الدمام",
      title: "منتجات أصلية وخدمة واضحة",
      text: "واجهت واجهة أقرب لمتاجر الفيب الكبيرة: أقسام واضحة، مراجعات، محتوى مفيد، وروابط مباشرة إلى البراندات والمنتجات المرتبطة. هذا يختصر وقت الشراء كثيرًا.",
    },
  ],
  en: [
    {
      name: "Abdullah",
      city: "Riyadh",
      title: "Faster path to the right products",
      text: "The homepage makes it much easier to reach the right product type and compare options quickly.",
    },
    {
      name: "Sarah",
      city: "Jeddah",
      title: "A more professional shopping flow",
      text: "The structure feels closer to a premium retail store with stronger trust cues and clearer sections.",
    },
    {
      name: "Mohammed",
      city: "Dammam",
      title: "Clearer offers and product discovery",
      text: "Brand access, product sections, and offer blocks now help reduce friction during shopping.",
    },
  ],
}

const serviceCards = {
  ar: [
    {
      key: "delivery",
      title: "توصيل سريع داخل المملكة",
      text: "على الطلبات المؤهلة وفي المدن الرئيسية",
      icon: "truck" as IconName,
    },
    {
      key: "dispatch",
      title: "تجهيز سريع حتى 9 مساءً",
      text: "نجهز الطلبات يوميًا مع متابعة واضحة",
      icon: "clock" as IconName,
    },
    {
      key: "reviews",
      title: "خدمة استثنائية",
      text: "تجربة شراء منظمة وثقة أعلى في كل قسم",
      icon: "stars" as IconName,
    },
    {
      key: "support",
      title: "دعم العملاء",
      text: "فريق جاهز للمساعدة عبر القنوات المتاحة",
      icon: "users" as IconName,
    },
  ],
  en: [],
}

const faqItems: Record<Locale, FaqItem[]> = {
  ar: [
    {
      question: "من هو Vape Hub KSA؟",
      answer:
        "Vape Hub KSA هو متجر فيب إلكتروني يستهدف السوق السعودي ويعمل على توفير أجهزة الفيب، السحبات الجاهزة، النيكوتين سولت، السوائل الإلكترونية، والبودات والكويلات من ماركات معروفة. هدفنا هو تقديم تجربة شراء واضحة وسريعة تساعد العميل على الوصول إلى المنتج المناسب بدون تعقيد، مع تنظيم الأقسام والعروض والمحتوى الإرشادي بطريقة تخدم قرار الشراء.",
    },
    {
      question: "لماذا يختار العملاء متجرنا في السعودية؟",
      answer:
        "لأننا نركز على ما يهم العميل فعليًا: عرض منظم، منتجات أصلية، وصول مباشر إلى الماركات والأقسام، وإبراز الخيارات المتوفرة بالمخزون أولًا. كما نضيف محتوى إرشادي وروابط داخلية واضحة تساعد المستخدم على المقارنة بين الأجهزة والنكهات والملحقات بسرعة أكبر.",
    },
    {
      question: "ماذا يبيع متجر Vape Hub KSA؟",
      answer:
        "نبيع أجهزة الفيب، أجهزة البود سيستم، السحبات الجاهزة، نكهات نيكوتين سولت، السوائل الإلكترونية، البودات، الكويلات، وبعض الملحقات المرتبطة بالاستخدام اليومي. كما نتيح الوصول السريع إلى صفحات البراندات والأقسام المتخصصة حتى يتمكن العميل من تصفية خياراته حسب النوع الذي يريده.",
    },
    {
      question: "هل يتوفر لديكم برنامج عروض أو توفير؟",
      answer:
        "نعم، نعرض داخل المتجر أقسامًا واضحة للعروض مثل عروض الخصومات، عروض التصفية، بكجات التوفير، وبعض الأقسام التجارية التي تساعد العميل على الوصول إلى أفضل قيمة شرائية. هذه البنية تسهل الاستفادة من العروض بدون الحاجة إلى البحث اليدوي الطويل داخل المتجر.",
    },
    {
      question: "هل لديكم متجر فعلي أم أن البيع أونلاين فقط؟",
      answer:
        "التركيز الحالي في الواجهة هو على تجربة شراء إلكترونية منظمة تخدم العميل داخل السعودية بسرعة ووضوح. إذا كانت هناك قنوات تواصل أو معلومات تشغيلية إضافية، فيمكن عرضها داخل صفحات الدعم أو صفحة التواصل، لكن تصميم الصفحة الحالية مبني على رحلة شراء رقمية مباشرة.",
    },
    {
      question: "متى يمكنني الطلب من المتجر؟",
      answer:
        "يمكنك تصفح المتجر وطلب المنتجات في أي وقت، وقد تم تنظيم الصفحة الرئيسية والأقسام الداخلية لتسهيل الوصول السريع إلى المنتجات المطلوبة سواء كنت تبحث عن أجهزة، نكهات، سحبات جاهزة، أو مستلزمات مرتبطة بها.",
    },
    {
      question: "كيف أتواصل مع Vape Hub KSA؟",
      answer:
        "يمكن التواصل عبر القنوات التي يعتمدها المتجر مثل صفحة الحساب، السلة، أو صفحة التواصل والدعم عند توفرها. كما أن تنظيم الصفحة الرئيسية والأقسام الداخلية يهدف إلى تقليل الحاجة إلى الاستفسارات المتكررة عبر توفير إجابات واضحة وروابط مباشرة إلى الأقسام والمنتجات المهمة.",
    },
  ],
  en: [
    {
      question: "What is the best beginner vape device?",
      answer:
        "A strong beginner option is usually a pod-based device with easy refills, stable performance, and widely available replacement pods or coils.",
    },
    {
      question: "What is the difference between nicotine salts and regular e-liquids?",
      answer:
        "Nicotine salts are commonly used with lower-powered pod devices and offer a smoother inhale, while regular e-liquids often suit higher-powered devices and larger vapor output.",
    },
    {
      question: "How do I choose the right nicotine strength?",
      answer:
        "The right strength depends on your previous habits, preferred throat hit, and how often you vape during the day. Many shoppers start with a balanced option and adjust based on real usage.",
    },
  ],
}

function Icon({ name, className = "h-6 w-6" }: { name: IconName; className?: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
    className,
  }

  switch (name) {
    case "tag":
      return (
        <svg {...common}>
          <path d="M20 10.2 13 17.2a2.2 2.2 0 0 1-3.1 0l-5-5a2.2 2.2 0 0 1 0-3.1l7-7.1H18a2 2 0 0 1 2 2z" />
          <circle cx="15.2" cy="6.8" r="1.1" />
        </svg>
      )
    case "battery":
      return (
        <svg {...common}>
          <rect x="7" y="4.5" width="10" height="15" rx="2.2" />
          <path d="M10 2.8h4" />
          <path d="M11 8.5h2M11 11.5h2M11 14.5h2" />
        </svg>
      )
    case "multi":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="14" rx="3" />
          <path d="M8 12h4M10 10v4M14.5 11.2h2.8" />
          <path d="M14.5 8.3h3.2v2.2" />
        </svg>
      )
    case "device":
      return (
        <svg {...common}>
          <rect x="8" y="2.5" width="8" height="19" rx="2.5" />
          <circle cx="12" cy="17" r="1.2" />
          <path d="M10 6h4" />
        </svg>
      )
    case "flame":
      return (
        <svg {...common}>
          <path d="M12 3c1.2 3.2 4.8 4.2 4.8 8.3A4.8 4.8 0 1 1 7.2 11c0-1.7.7-3.2 2-4.6.7 1.9 1.7 2.7 2.8 3.4C12.7 7.4 12.8 5.4 12 3Z" />
        </svg>
      )
    case "drop":
      return (
        <svg {...common}>
          <path d="M12 3c3.4 4.1 5.5 6.6 5.5 10A5.5 5.5 0 1 1 6.5 13C6.5 9.6 8.6 7.1 12 3Z" />
        </svg>
      )
    case "pod":
      return (
        <svg {...common}>
          <path d="M8.5 4.5h7a2 2 0 0 1 2 2V17a3.5 3.5 0 0 1-7 0V9h-2V6.5a2 2 0 0 1 2-2Z" />
          <path d="M10.5 12h4" />
        </svg>
      )
    case "coil":
      return (
        <svg {...common}>
          <path d="M7 9.5a2.5 2.5 0 0 1 5 0v5a2.5 2.5 0 0 1-5 0v-5Z" />
          <path d="M12 9.5a2.5 2.5 0 0 1 5 0v5a2.5 2.5 0 0 1-5 0" />
          <path d="M4 12h3M17 12h3" />
        </svg>
      )
    case "gift":
      return (
        <svg {...common}>
          <path d="M4 10h16v10H4z" />
          <path d="M12 10v10M4 14h16" />
          <path d="M7.5 10C6 10 5 9.1 5 7.7 5 6.3 6.1 5.5 7.3 5.5c1.5 0 2.6 1.3 4.7 4.5-2.2 0-3.5 0-4.5 0Z" />
          <path d="M16.5 10c1.5 0 2.5-.9 2.5-2.3 0-1.4-1.1-2.2-2.3-2.2-1.5 0-2.6 1.3-4.7 4.5 2.2 0 3.5 0 4.5 0Z" />
        </svg>
      )
    case "brand":
      return (
        <svg {...common}>
          <path d="M5 7.5 12 4l7 3.5V16L12 20l-7-4Z" />
          <path d="M12 4v16M5 7.5l7 3.5 7-3.5" />
        </svg>
      )
    case "truck":
      return (
        <svg {...common}>
          <path d="M3 7h11v8H3zM14 10h3l3 3v2h-2" />
          <circle cx="7" cy="17" r="1.5" />
          <circle cx="17" cy="17" r="1.5" />
        </svg>
      )
    case "clock":
      return (
        <svg {...common}>
          <path d="M12 5v7l4 2" />
          <path d="M5 4.5 3.5 6M19 4.5 20.5 6" />
          <circle cx="12" cy="12" r="8.5" />
        </svg>
      )
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3l7 3v5c0 4.3-2.7 7.5-7 10-4.3-2.5-7-5.7-7-10V6l7-3Z" />
          <path d="m9.2 12.2 1.8 1.8 3.8-4.3" />
        </svg>
      )
    case "star":
      return (
        <svg {...common}>
          <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1L3.2 9.4l6.1-.9Z" />
        </svg>
      )
    case "stars":
      return (
        <svg {...common}>
          <path d="m12 6 1.2 2.4 2.7.4-2 1.9.5 2.8-2.4-1.2-2.4 1.2.5-2.8-2-1.9 2.7-.4Z" />
          <path d="m6.2 9.2.7 1.4 1.5.2-1.1 1 .2 1.5-1.3-.7-1.3.7.2-1.5-1.1-1 1.5-.2Z" />
          <path d="m17.8 9.2.7 1.4 1.5.2-1.1 1 .2 1.5-1.3-.7-1.3.7.2-1.5-1.1-1 1.5-.2Z" />
        </svg>
      )
    case "support":
      return (
        <svg {...common}>
          <path d="M4.5 12a7.5 7.5 0 0 1 15 0" />
          <rect x="3" y="11.5" width="3.2" height="6" rx="1.2" />
          <rect x="17.8" y="11.5" width="3.2" height="6" rx="1.2" />
          <path d="M18 17.5a3 3 0 0 1-3 3h-3" />
        </svg>
      )
    case "users":
      return (
        <svg {...common}>
          <circle cx="8" cy="9" r="2.5" />
          <circle cx="16" cy="9" r="2.5" />
          <path d="M3.5 18c.6-2.4 2.6-4 4.5-4s3.9 1.6 4.5 4" />
          <path d="M11.5 18c.6-2.4 2.6-4 4.5-4s3.9 1.6 4.5 4" />
        </svg>
      )
    case "mail":
      return (
        <svg {...common}>
          <path d="M3.5 6.5h17v11h-17z" />
          <path d="m4.5 8 7.5 5 7.5-5" />
        </svg>
      )
  }
}

function SectionHeader({
  title,
  text,
  actionLabel,
  actionHref,
}: {
  title: string
  text: string
  actionLabel?: string
  actionHref?: string
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <Heading level="h2" className="text-[1.9rem] font-black tracking-tight text-[#11233e] md:text-[2.25rem]">
          {title}
        </Heading>
        <Text className="mt-2 text-sm leading-7 text-slate-600 md:text-[15px]">{text}</Text>
      </div>
      {actionLabel && actionHref ? (
        <LocalizedClientLink
          href={actionHref}
          className="inline-flex items-center rounded-sm border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-[#11233e] transition hover:border-[#18a7ff] hover:text-[#18a7ff]"
        >
          {actionLabel}
        </LocalizedClientLink>
      ) : null}
    </div>
  )
}

function FeaturedCategoryTile({ card }: { card: CategoryCard }) {
  return (
    <LocalizedClientLink
      href={card.href}
      className={`group flex min-h-[140px] flex-col items-center justify-center rounded-sm border p-5 text-center shadow-[0_12px_30px_rgba(15,23,42,0.10)] transition ${
        card.accent === "orange"
          ? "border-[#ff7a18] bg-gradient-to-r from-[#1f2d44] to-[#0e4c72] text-white"
          : "border-[#1b4f73] bg-gradient-to-r from-[#1f2d44] to-[#0e4c72] text-white"
      }`}
    >
      <div className={`flex h-12 w-12 items-center justify-center ${card.accent === "orange" ? "text-[#ff6b4a]" : "text-[#00a8ff]"}`}>
        <Icon name={card.icon} className="h-8 w-8" />
      </div>
      <div className="mt-5">
        <p className="text-[1.05rem] font-black tracking-tight md:text-[1.15rem]">{card.title}</p>
      </div>
      <div className="absolute inset-0 rounded-sm ring-0 transition group-hover:ring-2 group-hover:ring-white/20" />
      <div className="hidden">
        {card.href}
      </div>
    </LocalizedClientLink>
  )
}

function EditorialStrip({
  title,
  cards,
}: {
  title: string
  cards: CategoryCard[]
}) {
  if (!cards.length) {
    return null
  }

  return (
    <div className="mb-6">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-[#18a7ff]">{title}</p>
      <div className="grid gap-[2px] overflow-hidden rounded-sm border border-slate-300 bg-slate-300 md:grid-cols-3">
        {cards.map((card) => (
          <LocalizedClientLink key={card.key} href={card.href} className="group relative min-h-[150px] overflow-hidden bg-[#11233e] p-4 text-white">
            {card.image ? (
              <Image
                src={card.image}
                alt={card.title}
                fill
                className="object-cover opacity-55 transition duration-300 group-hover:scale-105 group-hover:opacity-65"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-[#081423] via-[#0c2035]/80 to-[#0c2035]/25" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="inline-flex w-fit rounded-sm bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#11233e]">
                {card.title}
              </div>
              <div>
                <p className="text-lg font-black">{card.title}</p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-200">{card.description}</p>
              </div>
            </div>
          </LocalizedClientLink>
        ))}
      </div>
    </div>
  )
}

function ImageCategoryMosaic({
  cards,
  viewAllLabel,
  viewAllHref,
}: {
  cards: Array<{ key: string; title: string; href: string; image?: string }>
  viewAllLabel: string
  viewAllHref: string
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {cards.slice(0, 5).map((card) => (
        <LocalizedClientLink
          key={card.key}
          href={card.href}
          className="group relative min-h-[170px] overflow-hidden rounded-sm border border-[#1e3a5a] bg-[#123457] shadow-[0_14px_30px_rgba(15,23,42,0.12)]"
        >
          {card.image ? (
            <Image
              src={card.image}
              alt={card.title}
              fill
              className="object-cover transition duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-r from-[#11233e]/92 via-[#0d4d76]/72 to-[#0d4d76]/25" />
          <div className="absolute start-4 top-4 bg-white px-4 py-2 text-lg font-black tracking-tight text-[#20344e] shadow-sm">
            {card.title}
          </div>
        </LocalizedClientLink>
      ))}

      <LocalizedClientLink
        href={viewAllHref}
        className="flex min-h-[170px] items-center justify-center rounded-sm border border-[#1e3a5a] bg-gradient-to-r from-[#123457] to-[#0e6b9b] px-6 text-center text-3xl font-black tracking-tight text-white shadow-[0_14px_30px_rgba(15,23,42,0.12)]"
      >
        {viewAllLabel}
      </LocalizedClientLink>
    </div>
  )
}

export default async function StorefrontHome({
  collections: _collections,
  locale,
  products,
  region,
}: StorefrontHomeProps) {
  const activeLocale: Locale = locale.toLowerCase() === "ar" ? "ar" : "en"
  const labels = copy[activeLocale]
  const intros = sectionIntro[activeLocale]
  const categories = flattenCategories(await listCategories({ limit: 1000 }))
  const blogPosts = (await listBlogPosts({ locale: activeLocale, limit: 6 }))
    .sort(
      (a, b) =>
        new Date(b.published_at || b.created_at || 0).getTime() -
        new Date(a.published_at || a.created_at || 0).getTime()
    )
    .slice(0, 3)

  const availabilitySortedProducts = sortByAvailability(products || [])
  const inStockProducts = availabilitySortedProducts.filter((product) => isProductInStock(product))
  const { kits, liquids, disposables, accessories } = classifyProducts(availabilitySortedProducts)

  const findCategory = (tokens: string[], excludeTokens: string[] = []) =>
    categories
      .map((category) => {
        const score = scoreCategoryMatch(category, tokens)
        const excludeScore =
          excludeTokens.length > 0 ? scoreCategoryMatch(category, excludeTokens) : 0

        return {
          category,
          score: excludeScore > 0 ? 0 : score,
        }
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .at(0)?.category

  const electronicShishaCategory =
    categories.find(
      (category) =>
        normalize(category.name) === normalize("أجهزة شيشة الكترونية") ||
        normalize(category.name) === normalize("أجهزة الشيشة الإلكترونية") ||
        category.handle === "category-jcs4dcv6"
    ) ||
    findCategory(["أجهزة شيشة الكترونية", "أجهزة الشيشة الإلكترونية", "vape mod"])

  const vapePenCategory =
    categories.find(
      (category) =>
        normalize(category.name) === normalize("سحبة سيجارة vape pen") ||
        category.handle === "vape-pen"
    ) || findCategory(["سحبة سيجارة vape pen", "vape pen"])

  const saltCategory =
    categories.find(
      (category) =>
        normalize(category.name) === normalize("نكهات سحبة سولت نيكوتين e juice") ||
        category.handle === "e-juice"
    ) || findCategory(["e-juice", "salt nic", "نكهات سولت", "سوائل إلكترونية"])

  const disposableReadyCategory =
    categories.find(
      (category) =>
        normalize(category.name) === normalize("سحبات جاهزة لمرة واحدة") ||
        category.handle === "category-6f0drnd6"
    ) ||
    findCategory(["سحبات جاهزة لمرة واحدة", "disposable vape", "سحبة جاهزة"])

  const bundlesCategory =
    categories.find(
      (category) =>
        normalize(category.name) === normalize("بكجات توفير") ||
        category.handle === "category-2ybk6r0q"
    ) || findCategory(["بكجات توفير"])

  const coilCategory = findCategory(["coils", "كويلات", "coil"])
  const accessoryCategory = findCategory(["smoking accessories", "مستلزمات التبغ", "accessories"])
  const podCategory =
    categories.find(
      (category) =>
        normalize(category.name) === normalize("بودات - pods") || category.handle === "pods"
    ) || findCategory(["pods", "بودات", "pod system", "بود سيستم"])

  const kitCategory =
    electronicShishaCategory ||
    findCategory(
      [
        "vape mod",
        "vape kit",
        "pod system",
        "system devices",
        "اجهزة الفيب",
        "أجهزة الفيب",
        "أجهزة الشيشة الإلكترونية",
        "أجهزة سحبة سيجارة",
        "vape pen",
        "جهاز فيب",
      ],
      ["pods", "بودات", "replacement pods", "prefilled pods", "بودات معبأة جاهزة"]
    )
  const liquidCategory = saltCategory
  const disposableCategory = disposableReadyCategory
  const bestSellers = filterAvailableProducts(availabilitySortedProducts, 8)
  const deviceProducts = selectSectionProducts({
    products: availabilitySortedProducts,
    limit: 8,
    category: electronicShishaCategory || kitCategory,
    includeTokens: [
      "vape mod",
      "vape kit",
      "device",
      "mod",
      "kit",
      "أجهزة شيشة الكترونية",
      "أجهزة الشيشة الإلكترونية",
      "أجهزة الفيب",
      "جهاز فيب",
    ],
    excludeTokens: [
      "pod",
      "pods",
      "بود",
      "بودات",
      "replacement pods",
      "salt",
      "سولت",
      "liquid",
      "juice",
      "disposable",
      "سحبات جاهزة",
      "coil",
      "coils",
      "كويل",
      "كويلات",
    ],
  })
  const vapePenProducts = selectSectionProducts({
    products: availabilitySortedProducts,
    limit: 8,
    category: vapePenCategory,
    includeTokens: ["vape pen", "سحبة سيجارة", "pen", "pod system"],
    excludeTokens: ["salt", "سولت", "liquid", "juice", "coil", "coils", "كويل", "كويلات"],
  })
  const kitsProducts = selectSectionProducts({
    products: availabilitySortedProducts,
    limit: 8,
    category: electronicShishaCategory || kitCategory,
    includeTokens: [
      "vape mod",
      "vape kit",
      "pod system",
      "system devices",
      "أجهزة الفيب",
      "أجهزة الشيشة الإلكترونية",
      "أجهزة سحبة سيجارة",
      "vape pen",
      "جهاز فيب",
    ],
    excludeTokens: [
      "replacement pods",
      "prefilled pods",
      "بودات معبأة جاهزة",
      "coils",
      "كويلات",
      "salt",
      "سولت",
      "liquid",
      "juice",
      "disposable",
      "سحبات جاهزة",
    ],
  })
  const liquidsProducts = selectSectionProducts({
    products: availabilitySortedProducts,
    limit: 8,
    category: liquidCategory,
    includeTokens: [
      "salt",
      "nic salt",
      "liquid",
      "juice",
      "نكهة",
      "نكهات",
      "سائل",
      "سوائل",
      "سولت",
      "freebase",
      "e-juice",
      "e juice",
      "e-liquid",
      "e liquid",
    ],
    excludeTokens: [
      "coil",
      "coils",
      "كويل",
      "كويلات",
      "pod",
      "pods",
      "بود",
      "بودات",
      "kit",
      "device",
      "mod",
      "tank",
      "battery",
      "disposable",
      "سحبات جاهزة",
    ],
  })
  const disposableProducts = selectSectionProducts({
    products: availabilitySortedProducts,
    limit: 8,
    category: disposableCategory,
    includeTokens: [
      "disposable vape",
      "disposable",
      "single use",
      "one use",
      "سحبات جاهزة",
      "سحبة جاهزة",
    ],
    excludeTokens: [
      "salt",
      "سولت",
      "liquid",
      "juice",
      "coil",
      "coils",
      "كويل",
      "كويلات",
      "pod system",
      "pod",
      "pods",
      "بود",
      "بودات",
    ],
  })
  const coilProducts = selectSectionProducts({
    products: availabilitySortedProducts,
    limit: 8,
    category: coilCategory || accessoryCategory,
    includeTokens: ["coil", "coils", "كويل", "كويلات"],
  })
  const podProducts = selectSectionProducts({
    products: availabilitySortedProducts,
    limit: 8,
    category: podCategory,
    includeTokens: ["pod", "pods", "بود", "بودات"],
    excludeTokens: ["pod system", "vape kit", "device", "جهاز", "أجهزة"],
  })
  const deviceDisplayProducts = filterAvailableProducts(deviceProducts, 8)
  const kitsDisplayProducts = filterAvailableProducts(kitsProducts, 8)
  const vapePenDisplayProducts = filterAvailableProducts(vapePenProducts, 8)
  const podDisplayProducts = filterAvailableProducts(podProducts, 8)
  const coilDisplayProducts = filterAvailableProducts(coilProducts, 8)
  const liquidsDisplayProducts = filterAvailableProducts(liquidsProducts, 8)
  const disposableDisplayProducts = filterAvailableProducts(disposableProducts, 8)

  const featuredCategories: CategoryCard[] = [
    {
      key: "new",
      title: activeLocale === "ar" ? "جديد" : "New",
      href: "/store?sortBy=created_at",
      icon: "tag",
      image: getProductImage(inStockProducts[0]),
    },
    {
      key: "trending",
      title: activeLocale === "ar" ? "الأكثر رواجًا" : "Trending",
      href: "/store",
      icon: "flame",
      accent: "orange",
      image: getProductImage(inStockProducts[1]),
    },
    {
      key: "disposable-alt",
      title: activeLocale === "ar" ? "بدائل السحبات الجاهزة" : "Disposable Alternatives",
      href: getCategoryHrefOverride(
        electronicShishaCategory,
        activeLocale,
        activeLocale === "ar" ? "/categories/أجهزة-شيشة-الكترونية" : undefined
      ),
      icon: "battery",
      image: getProductImage(deviceDisplayProducts[0] || kitsDisplayProducts[0] || inStockProducts[2]),
    },
    {
      key: "kits",
      title: activeLocale === "ar" ? "أجهزة الشيشة الإلكترونية" : "Vape Kits",
      href: getCategoryHrefOverride(
        electronicShishaCategory,
        activeLocale,
        activeLocale === "ar" ? "/categories/أجهزة-شيشة-الكترونية" : undefined
      ),
      icon: "device",
      image: getProductImage(deviceDisplayProducts[0] || kitsDisplayProducts[0] || inStockProducts[3]),
    },
    {
      key: "liquids",
      title: activeLocale === "ar" ? "السوائل الإلكترونية" : "E-Liquids",
      href: getCategoryHref(saltCategory, activeLocale),
      icon: "drop",
      image: getProductImage(liquidsDisplayProducts[0] || inStockProducts[4]),
    },
    {
      key: "multibuys",
      title: activeLocale === "ar" ? "بكجات التوفير" : "Multibuys",
      href: getCategoryHref(bundlesCategory, activeLocale),
      icon: "multi",
      image: getProductImage(inStockProducts[5]),
    },
    {
      key: "coils",
      title: activeLocale === "ar" ? "الكويلات" : "Coils",
      href: getCategoryHref(coilCategory || accessoryCategory, activeLocale),
      icon: "coil",
      image: getProductImage(coilDisplayProducts[0] || accessories[0] || inStockProducts[6]),
    },
    {
      key: "pods",
      title: activeLocale === "ar" ? "البودات" : "Pods",
      href: getCategoryHref(podCategory, activeLocale),
      icon: "pod",
      image: getProductImage(podDisplayProducts[0] || accessories[1] || inStockProducts[7]),
    },
  ]

  const topBrands = Array.from(
    availabilitySortedProducts.reduce((acc, product) => {
      const brand = getProductBrand(product)

      if (!brand) {
        return acc
      }

      const current = acc.get(brand.handle)

      if (current) {
        current.count += 1
        return acc
      }

      acc.set(brand.handle, { brand, count: 1 })
      return acc
    }, new Map<string, { brand: (typeof brands)[number]; count: number }>())
  )
    .map(([, entry]) => entry)
    .sort((a, b) => b.count - a.count || a.brand.nameEn.localeCompare(b.brand.nameEn))
    .slice(0, 8)

  const heroSlides: HeroSlide[] = [
    {
      id: "hero-kits",
      eyebrow: activeLocale === "ar" ? "أحدث أجهزة الفيب" : "Latest Vape Kits",
      title:
        activeLocale === "ar"
          ? "أجهزة أصلية بتصميم عملي وأداء مناسب للمستخدم السعودي"
          : "Premium devices with practical design and stronger daily performance",
      text:
        activeLocale === "ar"
          ? "تصفح موديلات مختارة من أجهزة الفيب والبود سيستم مع خيارات واضحة وروابط مباشرة إلى الأقسام الأكثر طلبًا."
          : "Browse selected devices, pod systems, and easier paths into the most demanded sections.",
      buttonLabel: labels.heroButton,
      href: getCategoryHrefOverride(
        electronicShishaCategory,
        activeLocale,
        activeLocale === "ar" ? "/categories/أجهزة-شيشة-الكترونية" : undefined
      ),
      image: getProductImage(deviceDisplayProducts[0] || kitsDisplayProducts[0] || bestSellers[0]),
    },
    {
      id: "hero-liquids",
      eyebrow: activeLocale === "ar" ? "نكهات يومية مختارة" : "Curated Daily Flavours",
      title:
        activeLocale === "ar"
          ? "نكهات نيكوتين سولت وسوائل إلكترونية بأكثر الخيارات طلبًا"
          : "Top nicotine salts and e-liquid flavour profiles",
      text:
        activeLocale === "ar"
          ? "الفواكه، التبغ، النعناع، والخلطات الباردة في قسم واضح يساعد العميل على الوصول السريع إلى النكهة المناسبة."
          : "Fruit, tobacco, mint, and icy blends organized into a cleaner buying path.",
      buttonLabel: labels.heroButton,
      href: getCategoryHref(saltCategory, activeLocale),
      image: getProductImage(liquidsDisplayProducts[0] || bestSellers[1]),
    },
    {
      id: "hero-disposables",
      eyebrow: activeLocale === "ar" ? "سحبات جاهزة وعروض" : "Disposables & Deals",
      title:
        activeLocale === "ar"
          ? "سحبات جاهزة مناسبة للاستخدام السريع مع عروض تجارية واضحة"
          : "Convenient disposable vapes backed by clearer promotional offers",
      text:
        activeLocale === "ar"
          ? "قسم مخصص للسحبات الجاهزة والخيارات السريعة مع إبراز المنتجات المتوفرة بالمخزون أولًا."
          : "A focused section for disposable products with available stock surfaced first.",
      buttonLabel: labels.heroButton,
      href: getCategoryHref(disposableReadyCategory, activeLocale),
      image: getProductImage(disposableDisplayProducts[0] || bestSellers[2]),
    },
  ]

  const deals = [
    {
      key: "deal-salts",
      title: activeLocale === "ar" ? "عروض نيكوتين سولت" : "Nic Salt Deals",
      text:
        activeLocale === "ar"
          ? "وفر عند شراء أكثر من نكهة من قسم النيكوتين سولت مع خيارات عملية للاستخدام اليومي."
          : "Save more when shopping across the nic salt range.",
      href: getCategoryHref(saltCategory, activeLocale),
      icon: "gift" as IconName,
    },
    {
      key: "deal-disposable",
      title: activeLocale === "ar" ? "عروض السحبات الجاهزة" : "Disposable Offers",
      text:
        activeLocale === "ar"
          ? "خيارات سريعة للشراء مع تركيز على المنتجات المطلوبة والمخزون المتوفر."
          : "Fast-moving disposable products with clearer value-led merchandising.",
      href: getCategoryHref(disposableReadyCategory, activeLocale),
      icon: "flame" as IconName,
    },
    {
      key: "deal-accessories",
      title: activeLocale === "ar" ? "مستلزمات وأكسسوارات" : "Accessories Offers",
      text:
        activeLocale === "ar"
          ? "كوّن طلبًا متكاملًا يجمع الكويلات والبودات والملحقات الأساسية من مكان واحد."
          : "Build a more complete basket with coils, pods, and essential accessories.",
      href: getCategoryHref(coilCategory || accessoryCategory, activeLocale),
      icon: "coil" as IconName,
    },
  ]

  const whyChooseUs = [
    {
      key: "why-fast",
      title: activeLocale === "ar" ? "شحن سريع داخل المملكة" : "Fast Saudi Delivery",
      text:
        activeLocale === "ar"
          ? "رسائل واضحة حول تجهيز الطلبات وسرعة الوصول إلى الرياض وجدة والدمام وبقية المدن."
          : "Clear shipping messaging for Riyadh, Jeddah, Dammam, and wider Saudi coverage.",
      icon: "truck" as IconName,
    },
    {
      key: "why-genuine",
      title: activeLocale === "ar" ? "منتجات أصلية" : "Genuine Products",
      text:
        activeLocale === "ar"
          ? "عرض البراندات والمنتجات بطريقة احترافية يرفع الثقة ويسهل مقارنة الخيارات الصحيحة."
          : "Professional merchandising that reinforces trust and makes product comparison easier.",
      icon: "shield" as IconName,
    },
    {
      key: "why-range",
      title: activeLocale === "ar" ? "تشكيلة واسعة" : "Broader Selection",
      text:
        activeLocale === "ar"
          ? "أجهزة، سحبات، سوائل، بودات، كويلات، وملحقات ضمن مسارات تصفح سريعة وواضحة."
          : "Devices, disposables, liquids, pods, coils, and accessories in cleaner browse paths.",
      icon: "brand" as IconName,
    },
    {
      key: "why-help",
      title: activeLocale === "ar" ? "محتوى يساعد على الاختيار" : "Buying Guidance",
      text:
        activeLocale === "ar"
          ? "قسم المدونة والأدلة يقدّم محتوى مفيدًا يساعد العميل على المقارنة والاختيار بثقة قبل الشراء."
          : "Guides and editorial content help shoppers compare options and buy with confidence.",
      icon: "support" as IconName,
    },
  ]

  const blogCards: BlogCard[] = blogPosts.map((post) => ({
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    href: `/blog/${post.handle}`,
    image: post.cover_image,
  }))

  const fallbackBlogCards: BlogCard[] = [
          {
            id: "fallback-1",
            title:
              activeLocale === "ar"
                ? "دليل اختيار جهاز الفيب المناسب للمبتدئين"
                : "How to choose the right beginner vape device",
            excerpt:
              activeLocale === "ar"
                ? "مقال توعوي يشرح الفرق بين الأجهزة والبودات والسحبات الجاهزة وكيف تختار الأنسب لأسلوب استخدامك."
                : "A practical guide to choosing between devices, pods, and disposables.",
            href: "/blog",
          },
          {
            id: "fallback-2",
            title:
              activeLocale === "ar"
                ? "كيف تختار قوة النيكوتين المناسبة؟"
                : "How to choose the right nicotine strength",
            excerpt:
              activeLocale === "ar"
                ? "خطوات مختصرة تساعد العميل على فهم الفرق بين 3mg و20mg وبقية التركيزات الشائعة."
                : "A concise explainer around the most common nicotine strengths.",
            href: "/blog",
          },
          {
            id: "fallback-3",
            title:
              activeLocale === "ar"
                ? "أفضل طريقة للحفاظ على جودة النكهة والكويل"
                : "How to preserve flavour and extend coil life",
            excerpt:
              activeLocale === "ar"
                ? "مقال يخدم المستخدم بعد الشراء ويقلل الحيرة حول الاستبدال والتنظيف والصيانة."
                : "Post-purchase guidance around maintenance, cleaning, and replacements.",
            href: "/blog",
          },
        ]

  const seoLinks = {
    brands: "/brands",
    blog: "/blog",
    kits: getCategoryHrefOverride(
      electronicShishaCategory,
      activeLocale,
      activeLocale === "ar" ? "/categories/أجهزة-شيشة-الكترونية" : undefined
    ),
    liquids: getCategoryHref(saltCategory, activeLocale),
    disposables: getCategoryHref(disposableReadyCategory, activeLocale),
    accessories: getCategoryHref(accessoryCategory || coilCategory, activeLocale),
  }

  return (
    <div className="bg-[#eef1f4] pb-16">
      <Heading level="h1" className="sr-only">
        {activeLocale === "ar" ? "مركز الفيب السعودي" : "Vape Hub KSA"}
      </Heading>
      <section className="border-b border-slate-200 bg-white/70">
        <div className="content-container py-6 md:py-8">
          <HeroCarousel slides={heroSlides} locale={activeLocale} />
        </div>
      </section>

      <section className="py-6 md:py-8">
        <div className="content-container grid gap-4 xl:grid-cols-4">
          {serviceCards.ar.map((item) => (
            <div
              key={item.key}
              className="rounded-sm border border-slate-300 bg-[#f7f7f8] px-6 py-7 text-center shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center text-[#00a8ff]">
                <Icon name={item.icon} className="h-9 w-9" />
              </div>
              <p className="mt-4 text-[1.05rem] font-black uppercase tracking-tight text-[#2a3346]">
                {item.title}
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-500">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-8 md:py-10">
        <div className="content-container">
          <SectionHeader
            title={activeLocale === "ar" ? "تصفح أقسامنا الأكثر طلبًا" : "Browse our popular ranges"}
            text={intros.featured}
          />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {featuredCategories.map((card) => (
              <FeaturedCategoryTile key={card.key} card={card} />
            ))}
          </div>
        </div>
      </section>

      <section className="pb-8 md:pb-10">
        <div className="content-container">
          <SectionHeader
            title={labels.bestSellersTitle}
            text={intros.bestSellers}
            actionLabel={labels.showAll}
            actionHref="/store"
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {bestSellers.map((product) => (
              <ProductPreview key={product.id} product={product} region={region} />
            ))}
          </div>
        </div>
      </section>

      <section className="pb-8 md:pb-10">
        <div className="content-container">
          <SectionHeader
            title={labels.kitsTitle}
            text={intros.kits}
            actionLabel={labels.sectionButton}
            actionHref={seoLinks.kits}
          />
          <div className="mb-6 rounded-sm border border-slate-300 bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.05)] md:p-8">
            <Heading level="h3" className="text-[2rem] font-black tracking-tight text-[#20344e] md:text-[2.2rem]">
              {activeLocale === "ar" ? "تصفح أجهزة الفيب" : "Browse Vape Kits"}
            </Heading>
            <div className="mt-5 space-y-4 text-[15px] leading-8 text-slate-600">
              {activeLocale === "ar" ? (
                <>
                  <p>
                    سواء كنت في بداية تجربتك مع الفيب أو تبحث عن ترقية إلى جهاز أقوى وأكثر ثباتًا،
                    ستجد في هذا القسم أجهزة فيب مختارة بعناية تناسب الاستخدام اليومي داخل السوق
                    السعودي. ركزنا هنا على الخيارات العملية التي تجمع بين سهولة الاستخدام، وضوح
                    النكهة، وتوفر الملحقات المرتبطة بها مثل البودات والكويلات.
                  </p>
                  <p>
                    نعرض أجهزة البود سيستم، البدائل المناسبة للسحبات الجاهزة، باقات التوفير،
                    والموديلات المطلوبة للمبتدئين أو لمن يريد تجربة أكثر احترافية. ولتسهيل
                    التصفح، قسمنا الخيارات إلى مجموعات واضحة تساعدك على الوصول بسرعة إلى الجهاز
                    الأنسب حسب أسلوب السحب، حجم الجهاز، وتكلفة التشغيل.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Whether you are starting out or upgrading to a stronger setup, this section
                    is built to surface the most practical vape kits for everyday use.
                  </p>
                  <p>
                    We group pod systems, starter devices, bundle-led options, and alternatives to
                    disposables into clearer visual paths for faster browsing.
                  </p>
                </>
              )}
            </div>
          </div>
          <ImageCategoryMosaic
            cards={[
              {
                key: "kits-alt",
                title: activeLocale === "ar" ? "سحبة سيجارة Vape pen" : "Vape Pen",
                href: getCategoryHref(vapePenCategory, activeLocale),
                image: getProductImage(vapePenDisplayProducts[0] || kitsDisplayProducts[0]),
              },
              {
                key: "kits-pod",
                title: activeLocale === "ar" ? "بودات وقطع غيار" : "Pods & Refills",
                href: getCategoryHref(podCategory, activeLocale),
                image: getProductImage(podDisplayProducts[0] || kitsDisplayProducts[0]),
              },
              {
                key: "kits-starter",
                title: activeLocale === "ar" ? "أجهزة بداية" : "Starter Vape Kits",
                href: getCategoryHrefOverride(
                  electronicShishaCategory,
                  activeLocale,
                  activeLocale === "ar" ? "/categories/أجهزة-شيشة-الكترونية" : undefined
                ),
                image: getProductImage(deviceDisplayProducts[1] || deviceDisplayProducts[0] || kitsDisplayProducts[0]),
              },
              {
                key: "kits-power",
                title: activeLocale === "ar" ? "أجهزة متقدمة" : "Sub-Ohm Vape Kits",
                href: getCategoryHrefOverride(
                  electronicShishaCategory,
                  activeLocale,
                  activeLocale === "ar" ? "/categories/أجهزة-شيشة-الكترونية" : undefined
                ),
                image: getProductImage(deviceDisplayProducts[2] || deviceDisplayProducts[0] || kitsDisplayProducts[0]),
              },
              {
                key: "kits-bundles",
                title: activeLocale === "ar" ? "بكجات أجهزة الفيب" : "Bundle Vape Kits",
                href: getCategoryHref(bundlesCategory, activeLocale),
                image: getProductImage(deviceDisplayProducts[3] || kitsDisplayProducts[0]),
              },
            ]}
            viewAllLabel={activeLocale === "ar" ? "عرض جميع أجهزة الفيب" : "View All Vape Kits"}
            viewAllHref={seoLinks.kits}
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {kitsDisplayProducts.map((product) => (
              <ProductPreview key={product.id} product={product} region={region} />
            ))}
          </div>
        </div>
      </section>

      <section className="pb-8 md:pb-10">
        <div className="content-container">
          <SectionHeader
            title={labels.liquidsTitle}
            text={intros.liquids}
            actionLabel={labels.sectionButton}
            actionHref={seoLinks.liquids}
          />
          <EditorialStrip
            title={activeLocale === "ar" ? "نكهات متنوعة" : "Top flavour directions"}
            cards={[
              {
                key: "liquid-a",
                title: activeLocale === "ar" ? "فواكه" : "Fruit",
                description:
                  activeLocale === "ar"
                    ? "نكهات فاكهية مطلوبة يوميًا وتناسب شريحة واسعة من المستخدمين."
                    : "Popular fruit-led flavour profiles for daily use.",
                href: seoLinks.liquids,
                image: getProductImage(liquidsDisplayProducts[0]),
                icon: "drop",
              },
              {
                key: "liquid-b",
                title: activeLocale === "ar" ? "تبغ ونعناع" : "Tobacco & Mint",
                description:
                  activeLocale === "ar"
                    ? "خيارات أقرب للذوق التقليدي مع وضوح نكهة وثبات في التجربة."
                    : "Traditional flavour directions with clarity and consistency.",
                href: seoLinks.liquids,
                image: getProductImage(liquidsDisplayProducts[1]),
                icon: "star",
              },
              {
                key: "liquid-c",
                title: activeLocale === "ar" ? "بارد ومنعش" : "Icy Blends",
                description:
                  activeLocale === "ar"
                    ? "خلطات باردة ومنعشة تبرز في أقسام النكهات الأكثر طلبًا."
                    : "Cooling blends that stand out in high-demand flavour ranges.",
                href: seoLinks.liquids,
                image: getProductImage(liquidsDisplayProducts[2]),
                icon: "flame",
              },
            ]}
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {liquidsDisplayProducts.map((product) => (
              <ProductPreview key={product.id} product={product} region={region} />
            ))}
          </div>
        </div>
      </section>

      <section className="pb-8 md:pb-10">
        <div className="content-container">
          <SectionHeader
            title={labels.disposablesTitle}
            text={intros.disposables}
            actionLabel={labels.sectionButton}
            actionHref={seoLinks.disposables}
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {disposableDisplayProducts.map((product) => (
              <ProductPreview key={product.id} product={product} region={region} />
            ))}
          </div>
        </div>
      </section>

      <section className="pb-8 md:pb-10">
        <div className="content-container">
          <SectionHeader
            title={labels.dealsTitle}
            text={intros.deals}
            actionLabel={labels.dealsButton}
            actionHref="/store"
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {deals.map((deal, index) => (
              <LocalizedClientLink
                key={deal.key}
                href={deal.href}
                className="group relative overflow-hidden rounded-sm border border-slate-300 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
              >
                <div
                  className="absolute inset-0 opacity-95"
                  style={{
                    background:
                      index === 0
                        ? "linear-gradient(135deg, #0e2440 0%, #16385f 72%, #18a7ff 100%)"
                        : index === 1
                          ? "linear-gradient(135deg, #11233e 0%, #1f3d62 72%, #ff7a18 100%)"
                          : "linear-gradient(135deg, #10263f 0%, #24445f 72%, #34d399 100%)",
                  }}
                />
                <div className="relative z-10 text-white">
                  <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-white/10 text-white">
                    <Icon name={deal.icon} className="h-7 w-7" />
                  </div>
                  <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-white/80">
                    {labels.bestValue}
                  </p>
                  <p className="mt-2 text-2xl font-black">{deal.title}</p>
                  <p className="mt-3 max-w-sm text-sm leading-7 text-white/85">{deal.text}</p>
                </div>
              </LocalizedClientLink>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-8 md:pb-10">
        <div className="content-container">
          <SectionHeader
            title={labels.brandsTitle}
            text={intros.brands}
            actionLabel={labels.brandsButton}
            actionHref={seoLinks.brands}
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-4">
            {topBrands.map(({ brand, count }) => (
              <LocalizedClientLink
                key={brand.handle}
                href={`/brands/${brand.handle}`}
                className="flex min-h-[128px] flex-col items-center justify-center rounded-sm border border-slate-300 bg-white p-4 text-center transition hover:-translate-y-0.5 hover:border-[#18a7ff]"
              >
                <Image
                  src={brand.logo}
                  alt={brand.nameEn}
                  width={140}
                  height={52}
                  className="max-h-12 w-auto object-contain"
                />
                <p className="mt-3 text-sm font-bold uppercase tracking-[0.16em] text-[#11233e]">
                  {brand.nameEn}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {activeLocale === "ar" ? `${count} منتج` : `${count} products`}
                </p>
              </LocalizedClientLink>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-8 md:pb-10">
        <div className="content-container">
          <SectionHeader title={labels.whyTitle} text={intros.why} />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {whyChooseUs.map((item) => (
              <div key={item.key} className="rounded-sm border border-slate-300 bg-white p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#e6f6ff] text-[#18a7ff]">
                  <Icon name={item.icon} className="h-7 w-7" />
                </div>
                <p className="mt-5 text-lg font-black text-[#11233e]">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-8 md:pb-10">
        <div className="content-container">
          <div className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-[0_20px_45px_rgba(15,23,42,0.06)]">
            <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#18a7ff]">
                  {activeLocale === "ar" ? "تجربة شراء موثوقة" : "Trusted Shopping Experience"}
                </p>
                <Heading
                  level="h2"
                  className="mt-3 max-w-[18ch] text-[1.85rem] font-extrabold leading-[1.18] tracking-[-0.02em] text-[#11233e] md:text-[2.15rem] lg:text-[2.35rem]"
                >
                  {labels.seoTitle}
                </Heading>
                <div className="mt-5 space-y-4 text-[15px] leading-8 text-slate-700">
                  {activeLocale === "ar" ? (
                    <>
                      <p>
                        إذا كنت تبحث عن متجر فيب في السعودية يجمع بين المنتجات الأصلية، التصفح الواضح،
                        وخيارات شراء موثوقة، فهذه الصفحة الرئيسية تساعدك على الوصول بسرعة إلى
                        أهم الأقسام مثل{" "}
                        <LocalizedClientLink href={seoLinks.kits} className="font-bold text-[#0f7fd6] hover:text-[#18a7ff]">
                          أجهزة الفيب
                        </LocalizedClientLink>{" "}
                        و{" "}
                        <LocalizedClientLink href={seoLinks.liquids} className="font-bold text-[#0f7fd6] hover:text-[#18a7ff]">
                          نكهات النيكوتين سولت
                        </LocalizedClientLink>{" "}
                        و{" "}
                        <LocalizedClientLink href={seoLinks.disposables} className="font-bold text-[#0f7fd6] hover:text-[#18a7ff]">
                          السحبات الجاهزة
                        </LocalizedClientLink>
                        .
                      </p>
                      <p>
                        نعتمد في عرض الصفحة على تقسيمات واضحة تساعد العميل السعودي على المقارنة
                        السريعة بين الأجهزة، البودات، السوائل، والكويلات، مع إبراز الماركات الموثوقة عبر
                        صفحة{" "}
                        <LocalizedClientLink href={seoLinks.brands} className="font-bold text-[#0f7fd6] hover:text-[#18a7ff]">
                          جميع الماركات
                        </LocalizedClientLink>{" "}
                        وربط المحتوى التحريري داخل{" "}
                        <LocalizedClientLink href={seoLinks.blog} className="font-bold text-[#0f7fd6] hover:text-[#18a7ff]">
                          المدونة
                        </LocalizedClientLink>
                        .
                      </p>
                      <p>
                        الهدف من هذا التنظيم هو تقديم تجربة شراء مريحة وواضحة، مع محتوى مفيد ومسارات
                        سريعة إلى صفحات المنتجات والتصنيفات وملحقات الاستخدام اليومي مثل{" "}
                        <LocalizedClientLink href={seoLinks.accessories} className="font-bold text-[#0f7fd6] hover:text-[#18a7ff]">
                          الكويلات والإكسسوارات
                        </LocalizedClientLink>
                        .
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        This homepage is built to help Saudi shoppers reach key sections quickly, such as{" "}
                        <LocalizedClientLink href={seoLinks.kits} className="font-bold text-[#0f7fd6] hover:text-[#18a7ff]">
                          vape kits
                        </LocalizedClientLink>
                        ,{" "}
                        <LocalizedClientLink href={seoLinks.liquids} className="font-bold text-[#0f7fd6] hover:text-[#18a7ff]">
                          nicotine salts
                        </LocalizedClientLink>
                        , and{" "}
                        <LocalizedClientLink href={seoLinks.disposables} className="font-bold text-[#0f7fd6] hover:text-[#18a7ff]">
                          disposable vapes
                        </LocalizedClientLink>
                        .
                      </p>
                      <p>
                        It combines clear browsing, trusted product discovery, and helpful routes to{" "}
                        <LocalizedClientLink href={seoLinks.brands} className="font-bold text-[#0f7fd6] hover:text-[#18a7ff]">
                          brand pages
                        </LocalizedClientLink>{" "}
                        and{" "}
                        <LocalizedClientLink href={seoLinks.blog} className="font-bold text-[#0f7fd6] hover:text-[#18a7ff]">
                          editorial guides
                        </LocalizedClientLink>
                        .
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="rounded-sm bg-gradient-to-br from-[#11233e] via-[#173457] to-[#0f7fd6] p-6 text-white">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-white/75">
                  {activeLocale === "ar" ? "لماذا يفضّل العملاء التسوق معنا" : "Why Shoppers Choose Us"}
                </p>
                <ul className="mt-5 space-y-4 text-sm leading-7 text-white/90">
                  <li>{activeLocale === "ar" ? "منتجات أصلية مختارة من ماركات موثوقة ومطلوبة في السوق السعودي." : "Authentic products from trusted brands popular in the Saudi market."}</li>
                  <li>{activeLocale === "ar" ? "تنقل واضح بين الأجهزة والنكهات والملحقات لتسهيل الوصول لما تحتاجه بسرعة." : "Clear navigation across devices, flavors, and accessories for faster discovery."}</li>
                  <li>{activeLocale === "ar" ? "إبراز المنتجات المتوفرة بالمخزون والعروض المهمة بشكل مباشر وواضح." : "In-stock products and important offers are highlighted clearly."}</li>
                  <li>{activeLocale === "ar" ? "محتوى عربي احترافي يساعدك على المقارنة واتخاذ قرار شراء واثق." : "Professional Arabic content that helps shoppers compare and buy with confidence."}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-8 md:pb-10">
        <div className="content-container">
          <SectionHeader
            title={labels.blogTitle}
            text={intros.blog}
            actionLabel={labels.readGuide}
            actionHref={seoLinks.blog}
          />
          <div className="grid gap-5 md:grid-cols-3">
            {(blogCards.length ? blogCards : fallbackBlogCards).map((post, index) => (
              <article key={post.id} className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
                <div className="relative min-h-[190px] bg-[#11233e]">
                  {post.image ? (
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          index === 0
                            ? "linear-gradient(135deg, #c9d6ff, #e2e8f0)"
                            : index === 1
                              ? "linear-gradient(135deg, #fef3c7, #fecaca)"
                              : "linear-gradient(135deg, #cffafe, #dbeafe)",
                      }}
                    />
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#18a7ff]">
                    {activeLocale === "ar" ? "دليل الشراء" : "Guide"}
                  </p>
                  <h3 className="mt-3 text-xl font-black leading-8 text-[#11233e]">{post.title}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">{post.excerpt}</p>
                  <LocalizedClientLink
                    href={post.href}
                    className="mt-5 inline-flex rounded-sm bg-[#11233e] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0f7fd6]"
                  >
                    {labels.readGuide}
                  </LocalizedClientLink>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-8 md:pb-10">
        <div className="content-container">
          <SectionHeader
            title={activeLocale === "ar" ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
            text={
              activeLocale === "ar"
                ? "أسئلة مختارة تجيب على أهم الاستفسارات التي يبحث عنها العميل قبل شراء أجهزة الفيب والنكهات والسحبات الجاهزة."
                : "Selected questions covering the most common pre-purchase concerns."
            }
          />
          <div className="grid gap-x-6 gap-y-0 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, columnIndex) => {
              const columnItems = faqItems[activeLocale].filter((_, index) => index % 2 === columnIndex)

              return (
                <div
                  key={`faq-col-${columnIndex}`}
                  className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]"
                >
                  <Accordion.Root
                    type="single"
                    collapsible
                    defaultValue={columnIndex === 0 ? "faq-0" : undefined}
                    className="divide-y divide-slate-200"
                  >
                    {columnItems.map((item, index) => {
                      const originalIndex = columnIndex + index * 2

                      return (
                        <Accordion.Item
                          key={item.question}
                          value={`faq-${originalIndex}`}
                          className="group"
                        >
                          <Accordion.Header>
                            <Accordion.Trigger className="flex w-full items-center justify-between gap-4 px-5 py-5 text-start text-[15px] font-black leading-7 text-[#11233e] transition hover:bg-slate-50 md:px-6">
                              <span>{item.question}</span>
                              <span className="shrink-0 text-[2rem] font-light leading-none text-[#18a7ff] transition group-data-[state=open]:rotate-45">
                                +
                              </span>
                            </Accordion.Trigger>
                          </Accordion.Header>
                          <Accordion.Content className="overflow-hidden">
                            <div className="border-t border-slate-100 bg-white px-5 py-5 text-sm leading-8 text-slate-700 md:px-6">
                              {item.answer}
                            </div>
                          </Accordion.Content>
                        </Accordion.Item>
                      )
                    })}
                  </Accordion.Root>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="pb-8 md:pb-10">
        <div className="content-container">
          <SectionHeader title={labels.reviewsTitle} text={intros.reviews} />
          <div className="grid gap-4 md:grid-cols-3">
            {reviewCards[activeLocale].map((review) => (
              <div key={review.name} className="rounded-sm border border-slate-300 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="text-[#00b67a]">★★★★★</div>
                  <span className="text-xs font-black uppercase tracking-[0.22em] text-[#00b67a]">
                    {labels.trustedLabel}
                  </span>
                </div>
                <p className="mt-4 text-lg font-black text-[#11233e]">{review.title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{review.text}</p>
                <div className="mt-5 border-t border-slate-200 pt-4">
                  <p className="font-black text-[#11233e]">{review.name}</p>
                  <p className="text-sm text-slate-500">{review.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-4">
        <div className="content-container">
          <div className="overflow-hidden rounded-sm border border-slate-300 bg-gradient-to-r from-[#10233f] via-[#17365a] to-[#0e2037] shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
            <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[1fr_0.85fr]">
              <div className="text-white">
                <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-white/10 text-[#18a7ff]">
                  <Icon name="mail" className="h-7 w-7" />
                </div>
                <Heading level="h2" className="mt-5 text-[2rem] font-black tracking-tight text-white md:text-[2.3rem]">
                  {labels.newsletterTitle}
                </Heading>
                <Text className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
                  {intros.newsletter}
                </Text>
              </div>
              <form className="rounded-sm bg-white/10 p-5 backdrop-blur-sm">
                <label className="block text-sm font-black uppercase tracking-[0.22em] text-white/80">
                  Email
                </label>
                <input
                  type="email"
                  placeholder={labels.newsletterPlaceholder}
                  className="mt-4 h-12 w-full rounded-sm border border-white/15 bg-white px-4 text-sm text-[#11233e] outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-sm bg-[#18a7ff] px-6 text-sm font-black text-white transition hover:bg-[#0f7fd6]"
                >
                  {labels.newsletterButton}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
