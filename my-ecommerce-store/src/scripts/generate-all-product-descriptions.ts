import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/core-flows"

type ProductCategory = {
  id?: string
  name?: string | null
  handle?: string | null
}

type ProductCollection = {
  title?: string | null
  handle?: string | null
}

type ProductTag = {
  value?: string | null
}

type ProductOptionValue = {
  value?: string | null
}

type ProductOption = {
  title?: string | null
  values?: ProductOptionValue[] | null
}

type ProductVariant = {
  title?: string | null
  options?: ProductOptionValue[] | null
  inventory_quantity?: number | null
  manage_inventory?: boolean | null
  allow_backorder?: boolean | null
}

type ProductRecord = {
  id: string
  title: string
  handle: string
  description?: string | null
  metadata?: Record<string, unknown> | null
  type?: {
    value?: string | null
  } | null
  categories?: ProductCategory[] | null
  collection?: ProductCollection | null
  tags?: ProductTag[] | null
  options?: ProductOption[] | null
  variants?: ProductVariant[] | null
}

type LinkItem = {
  href: string
  label: string
}

type ProductFacts = {
  brandName: string
  brandHandle: string
  categoryName: string
  categoryHandle: string
  collectionTitle: string
  typeName: string
  inferredType:
    | "device"
    | "salt"
    | "freebase"
    | "coil"
    | "pod"
    | "disposable"
    | "accessory"
    | "generic"
  nicotineStrengths: string[]
  volumeValues: string[]
  resistanceValues: string[]
  batteryValue: string
  compatibleKeywords: string[]
  optionSummary: string[]
  tags: string[]
}

const DRY_RUN = process.env.SEO_DRY_RUN === "true"
const MAX_PRODUCTS = Math.max(1, Number(process.env.SEO_MAX_PRODUCTS || "10000"))
const ONLY_MISSING_DESCRIPTION =
  process.env.SEO_ONLY_MISSING_DESCRIPTION === "true"
const UPDATE_BATCH_SIZE = Math.max(
  1,
  Number(process.env.SEO_UPDATE_BATCH_SIZE || "50")
)
const COUNTRY_CODE = "ar"

const normalizeText = (value?: string | null) =>
  (value || "").replace(/\s+/g, " ").trim()

const normalizeKey = (value?: string | null) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[-_/]+/g, " ")

const stripHtml = (value?: string | null) =>
  normalizeText(
    (value || "")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )

const uniq = (values: string[]) =>
  Array.from(new Set(values.map((value) => normalizeText(value)).filter(Boolean)))

const extractMatches = (
  text: string,
  regex: RegExp,
  formatter: (value: string) => string
) => uniq(Array.from(text.matchAll(regex)).map((match) => formatter(match[1] || match[0] || "")))

const toListHtml = (items: string[]) =>
  `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`

const truncate = (value: string, limit: number) =>
  value.length <= limit ? value : `${value.slice(0, Math.max(0, limit - 3)).trim()}...`

const productUrl = (handle: string) => `/${COUNTRY_CODE}/products/${encodeURIComponent(handle)}`
const categoryUrl = (handle: string) =>
  `/${COUNTRY_CODE}/categories/${encodeURIComponent(handle)}`
const brandUrl = (handle: string) => `/${COUNTRY_CODE}/brands/${encodeURIComponent(handle)}`
const collectionUrl = (handle: string) =>
  `/${COUNTRY_CODE}/collections/${encodeURIComponent(handle)}`

const inferType = (text: string): ProductFacts["inferredType"] => {
  const t = normalizeKey(text)

  if (/(disposable|سحبة|جاهزة)/i.test(t)) return "disposable"
  if (/(coil|coils|كويل|mesh|ohm|resistance|مقاومة)/i.test(t)) return "coil"
  if (/(pod|pods|بود|cartridge|cart|replacement pod)/i.test(t)) return "pod"
  if (/(salt|سولت|nic salt|salt nic)/i.test(t)) return "salt"
  if (/(freebase|free base|shortfill|e liquid|e-liquid|juice|نكهة)/i.test(t))
    return "freebase"
  if (/(kit|device|mod|starter|جهاز|بود سيستم|pod system|xros|argus|caliburn)/i.test(t))
    return "device"
  if (/(accessor|ملحق|بطارية|تانك|شاحن|قطن|ورق لف)/i.test(t)) return "accessory"
  return "generic"
}

const isVariantAvailable = (variant: ProductVariant) => {
  if (variant.allow_backorder) return true
  if (variant.manage_inventory === false) return true

  return Number(variant.inventory_quantity || 0) > 0
}

const isProductAvailable = (product: ProductRecord) => {
  const variants = product.variants || []

  if (!variants.length) {
    return true
  }

  return variants.some(isVariantAvailable)
}

const buildFacts = (product: ProductRecord): ProductFacts => {
  const metadata = (product.metadata || {}) as Record<string, unknown>
  const category = product.categories?.[0]
  const allText = normalizeText(
    [
      product.title,
      stripHtml(product.description),
      product.type?.value,
      category?.name,
      product.collection?.title,
      ...(product.tags || []).map((tag) => tag.value || ""),
      ...(product.options || []).flatMap((option) => [
        option.title || "",
        ...((option.values || []).map((value) => value.value || "")),
      ]),
      ...(product.variants || []).flatMap((variant) => [
        variant.title || "",
        ...((variant.options || []).map((value) => value.value || "")),
      ]),
      typeof metadata.brand_name_ar === "string" ? metadata.brand_name_ar : "",
      typeof metadata.brand_name_en === "string" ? metadata.brand_name_en : "",
      typeof metadata.product_type === "string" ? metadata.product_type : "",
    ].join(" ")
  )

  const nicotineStrengths = extractMatches(
    allText,
    /(\d{1,2})\s*(?:mg|مجم|ملغ)/gi,
    (value) => `${value}mg`
  )
  const volumeValues = extractMatches(
    allText,
    /(\d+(?:\.\d+)?)\s*(?:ml|مل)/gi,
    (value) => `${value}ml`
  )
  const resistanceValues = extractMatches(
    allText,
    /(\d(?:\.\d+)?)\s*(?:ohm|Ω|اوم)/gi,
    (value) => `${value}ohm`
  )
  const batteryValue =
    extractMatches(allText, /(\d{3,5})\s*(?:mah|mAh)/gi, (value) => `${value}mAh`)[0] || ""

  const compatibleKeywords = uniq(
    Array.from(allText.matchAll(/(?:compatible with|متوافق مع|يناسب)\s+([^\.\،,\n]+)/gi)).map(
      (match) => truncate(normalizeText(match[1]), 70)
    )
  )

  const optionSummary = uniq(
    (product.options || []).flatMap((option) => {
      const title = normalizeText(option.title)
      const values = uniq((option.values || []).map((value) => value.value || ""))
      return title && values.length ? [`${title}: ${values.join("، ")}`] : []
    })
  )

  const tags = uniq((product.tags || []).map((tag) => tag.value || ""))
  const inferredType = inferType(allText)

  return {
    brandName:
      normalizeText(
        (typeof metadata.brand_name_ar === "string" && metadata.brand_name_ar) ||
          (typeof metadata.brand_name_en === "string" && metadata.brand_name_en) ||
          ""
      ) || "العلامة الأصلية",
    brandHandle:
      typeof metadata.brand_handle === "string" ? normalizeText(metadata.brand_handle) : "",
    categoryName: normalizeText(category?.name) || "مستلزمات الفيب",
    categoryHandle: normalizeText(category?.handle) || "",
    collectionTitle: normalizeText(product.collection?.title),
    typeName: normalizeText(product.type?.value) || normalizeText(String(metadata.product_type || "")),
    inferredType,
    nicotineStrengths,
    volumeValues,
    resistanceValues,
    batteryValue,
    compatibleKeywords,
    optionSummary,
    tags,
  }
}

const pickRelatedProducts = (product: ProductRecord, allProducts: ProductRecord[]) => {
  const categoryHandle = normalizeText(product.categories?.[0]?.handle)
  const brandHandle =
    typeof (product.metadata || {}).brand_handle === "string"
      ? normalizeText(String((product.metadata || {}).brand_handle))
      : ""

  const candidates = allProducts
    .filter((candidate) => candidate.id !== product.id)
    .filter(isProductAvailable)

  const sameCategory = candidates.filter(
    (candidate) =>
      normalizeText(candidate.categories?.[0]?.handle) &&
      normalizeText(candidate.categories?.[0]?.handle) === categoryHandle
  )

  const sameBrand = candidates.filter((candidate) => {
    const candidateBrand =
      typeof (candidate.metadata || {}).brand_handle === "string"
        ? normalizeText(String((candidate.metadata || {}).brand_handle))
        : ""

    return Boolean(brandHandle && candidateBrand === brandHandle)
  })

  return uniq(
    [...sameCategory, ...sameBrand]
      .map((candidate) => candidate.id)
  )
    .map((id) => candidates.find((candidate) => candidate.id === id))
    .filter((candidate): candidate is ProductRecord => Boolean(candidate))
    .slice(0, 3)
}

const buildInternalLinks = (product: ProductRecord, facts: ProductFacts, related: ProductRecord[]) => {
  const links: LinkItem[] = []

  if (facts.categoryHandle) {
    links.push({
      href: categoryUrl(facts.categoryHandle),
      label: facts.categoryName,
    })
  }

  if (facts.brandHandle) {
    links.push({
      href: brandUrl(facts.brandHandle),
      label: `براند ${facts.brandName}`,
    })
  }

  if (product.collection?.handle) {
    links.push({
      href: collectionUrl(product.collection.handle),
      label: facts.collectionTitle || "المجموعة",
    })
  }

  const accessoryCategory = [
    { handle: "accessories", label: "مستلزمات الفيب" },
    { handle: "coils", label: "الكويلات" },
    { handle: "pods", label: "البودات" },
  ]

  for (const item of accessoryCategory) {
    if (links.length >= 5) break
    links.push({
      href: categoryUrl(item.handle),
      label: item.label,
    })
  }

  for (const relatedProduct of related) {
    if (links.length >= 5) break
    links.push({
      href: productUrl(relatedProduct.handle),
      label: relatedProduct.title,
    })
  }

  return uniq(links.map((item) => `${item.href}|${item.label}`))
    .map((item) => {
      const [href, label] = item.split("|")
      return { href, label }
    })
    .slice(0, 5)
}

const renderLink = (link?: LinkItem, fallback?: string) =>
  link ? `<a href="${link.href}">${link.label}</a>` : fallback || ""

const buildTechnicalSpecs = (facts: ProductFacts, product: ProductRecord) => {
  const specs = [
    `اسم المنتج: ${product.title}`,
    `البراند: ${facts.brandName}`,
    `الفئة: ${facts.categoryName}`,
    `نوع الاستخدام: ${
      facts.inferredType === "device"
        ? "جهاز فيب"
        : facts.inferredType === "salt"
          ? "نكهة نيكوتين سولت"
          : facts.inferredType === "freebase"
            ? "سائل فيب"
            : facts.inferredType === "coil"
              ? "كويل"
              : facts.inferredType === "pod"
                ? "بود أو خرطوشة بديلة"
                : facts.inferredType === "disposable"
                  ? "سحبة جاهزة"
                  : "ملحق فيب"
    }`,
    `الخيارات المتاحة: ${facts.optionSummary.join(" | ") || "بحسب المخزون المتوفر"}`,
    `قوة النيكوتين: ${facts.nicotineStrengths.join("، ") || "بحسب الإصدار المتوفر"}`,
    `السعة أو الحجم: ${facts.volumeValues.join("، ") || "راجع خيارات المنتج"}`,
    `المقاومات أو الأوم: ${facts.resistanceValues.join("، ") || "حسب النسخة أو الملحق المتوافق"}`,
    `سعة البطارية: ${facts.batteryValue || "تختلف حسب الإصدار"}`,
    `التوافق: ${facts.compatibleKeywords.join("، ") || "راجع اسم الجهاز أو الموديل المناسب"}`,
  ]

  return toListHtml(specs)
}

const buildFaqs = (facts: ProductFacts, related: ProductRecord[]) => {
  const relatedTitle = related[0]?.title || "منتجات مشابهة من نفس الفئة"
  const qa = [
    {
      q: "هل هذا المنتج مناسب للمبتدئين؟",
      a: "نعم، ويعتمد ذلك على نوع المنتج نفسه. إذا كنت تبحث عن خيار واضح وسهل الفهم فستجد هنا المعلومات الأساسية التي تساعدك على اختيار النسخة المناسبة بثقة أكبر.",
    },
    {
      q: "ما الفائدة الأساسية من هذا المنتج؟",
      a: `الفائدة الأساسية منه أنه يقدم لك ${
        facts.inferredType === "salt"
          ? "نكهة واضحة ومتوازنة"
          : facts.inferredType === "device"
            ? "استخدامًا عمليًا وسهلًا"
            : facts.inferredType === "pod"
              ? "توافقًا واضحًا واستبدالًا مريحًا"
              : facts.inferredType === "coil"
                ? "أداءً ثابتًا عند اختيار المقاومة المناسبة"
                : "خيارًا مناسبًا في فئته"
      } مع مواصفات مرتبة وخيارات تساعدك على اتخاذ القرار بشكل أسرع.`,
    },
    {
      q: "هل أستطيع اختيار القوة أو المقاس المناسب؟",
      a: `غالبًا نعم. تظهر لهذا المنتج خيارات مثل ${facts.optionSummary.join("، ") || "خيارات متعددة حسب المتاح"}، لذلك من الأفضل مراجعة النسخة المناسبة لك قبل الإضافة إلى السلة.`,
    },
    {
      q: "هل يوجد منتجات مرتبطة يمكن شراؤها معه؟",
      a: `نعم، يمكنك الاطلاع على منتجات قريبة أو مكملة مثل ${relatedTitle}، وذلك إذا كنت تريد المقارنة أو استكمال احتياجك من نفس الفئة.`,
    },
    {
      q: "كيف أعرف التوافق الصحيح قبل الشراء؟",
      a: "راجع عنوان المنتج والمواصفات الفنية والخيارات المتاحة، وتأكد من اسم الجهاز أو الفئة أو المقاومة أو السعة قبل إتمام الطلب.",
    },
    {
      q: "هل هذا المنتج مناسب للاستخدام اليومي؟",
      a: "إذا كانت مواصفاته وخياراته تناسب أسلوب استخدامك اليومي، فهو يعد خيارًا مناسبًا ضمن فئته، خاصة عندما تختار النسخة المتوافقة مع احتياجك الفعلي.",
    },
  ]

  return qa.map((item) => `<h3>${item.q}</h3><p>${item.a}</p>`).join("")
}

const buildDescription = (
  product: ProductRecord,
  allProducts: ProductRecord[]
) => {
  const facts = buildFacts(product)
  const related = pickRelatedProducts(product, allProducts)
  const links = buildInternalLinks(product, facts, related)
  const categoryLink = links.find((link) => link.href.includes("/categories/"))
  const brandLink = links.find((link) => link.href.includes("/brands/"))
  const collectionLink = links.find((link) => link.href.includes("/collections/"))
  const relatedLink = links.find((link) => link.href.includes("/products/"))
  const accessoryLink =
    links.find((link) => link.label === "مستلزمات الفيب") ||
    links.find((link) => link.label === "الكويلات") ||
    links.find((link) => link.label === "البودات")

  const intro = `<h2>Introduction</h2><p>${product.title} ${
    facts.inferredType === "salt"
      ? "مناسب لمن يبحث عن نكهة واضحة وتوازن مريح في الاستخدام."
      : facts.inferredType === "device"
        ? "يأتي كخيار عملي لمن يريد جهازًا واضح المواصفات وسهل الاستخدام."
        : facts.inferredType === "pod"
          ? "يوفر خيارًا مناسبًا لمن يحتاج بودات بديلة أو خرطوشة متوافقة بوضوح."
          : facts.inferredType === "coil"
            ? "يخدم من يبحث عن مقاومة مناسبة وتوافق صحيح مع جهازه."
            : facts.inferredType === "disposable"
              ? "يعد خيارًا مناسبًا لمن يفضل الاستخدام المباشر دون إعدادات معقدة."
              : "يقدم فائدة عملية داخل فئته مع مواصفات واضحة وخيارات مرتبة."
  }</p><p>ومن خلال صفحة المنتج ستجد تفاصيل تساعدك على معرفة الفئة، والخيارات المتاحة، والمواصفات الأهم، مع إمكانية الانتقال إلى ${renderLink(
    categoryLink,
    facts.categoryName
  )} أو ${renderLink(brandLink, `براند ${facts.brandName}`)} إذا كنت تريد مقارنة هذا المنتج بخيارات أخرى قريبة.</p>`

  const overview = `<h2>Product Overview</h2><p>ينتمي هذا المنتج إلى فئة ${facts.categoryName}، ويحمل اسم ${facts.brandName}، وهذا يمنحك صورة أوضح عن نوع الاستخدام الذي صُمم له وطبيعة المواصفات المتوقعة منه. سواء كنت تبحث عن نكهة، أو جهاز، أو بودات بديلة، أو كويل متوافق، فإن الصفحة تضع أمامك أهم التفاصيل بشكل مباشر.</p><p>وضوح العنوان والمواصفات والخيارات المتاحة يجعل ${product.title} أسهل في المقارنة مع منتجات مشابهة، خصوصًا إذا كنت ما زلت تحسم اختيارك بين أكثر من منتج من نفس الفئة أو من نفس الخط.</p>`

  const featureItems = [
    `ينتمي إلى فئة ${facts.categoryName}`,
    `مرتبط ببراند ${facts.brandName}`,
    `يظهر بخيارات واضحة مثل: ${facts.optionSummary.join("، ") || "نسخ متعددة حسب المتاح"}`,
    `مناسب للمقارنة مع منتجات مشابهة من نفس الفئة`,
    `يعرض المواصفات الأساسية بطريقة سهلة الفهم`,
    `يساعد على اتخاذ قرار الشراء بسرعة أكبر بفضل وضوح الترتيب`,
  ]

  const keyFeatures = `<h2>Key Features</h2>${toListHtml(featureItems)}`
  const technicalSpecifications = `<h2>Technical Specifications</h2>${buildTechnicalSpecs(facts, product)}`

  const designAndBuild = `<h2>Design and Build Quality</h2><p>الانطباع الأول عن ${product.title} يعتمد على مدى وضوح الفئة والخيارات وطريقة عرض المواصفات. في الأجهزة والملحقات يهمك التوافق وسهولة الاستخدام أو الاستبدال، بينما في السوائل والنكهات تبرز أهمية السعة والتركيز والنسخة المناسبة. لهذا فإن ترتيب التفاصيل هنا يساعدك على قراءة المنتج بسرعة وبدون تشويش.</p><p>كلما كانت المعلومات أوضح، أصبح القرار أسهل. وهذا ما يجعل الصفحة مفيدة للمشتري الذي يريد فهمًا مباشرًا للمنتج بدل وصف طويل لا يضيف قيمة فعلية.</p>`

  const performance = `<h2>Performance and Vapor Production</h2><p>الأداء المتوقع من ${product.title} يختلف حسب نوعه، لكن الفكرة الأساسية تبقى واحدة: اختيار المنتج المناسب يبدأ من فهم الفئة والمواصفات الصحيحة. في الأجهزة والسحبات الجاهزة يكون الاهتمام غالبًا براحة الاستخدام وثبات الأداء، وفي السوائل يبرز وضوح النكهة والتوازن، وفي البودات والكويلات تظهر أهمية التوافق وسهولة الاستبدال.</p><p>ولهذا فإن قراءة المواصفات ومقارنة الخيارات المتاحة قبل الشراء تمنحك نتيجة أفضل، خاصة عندما تنتقل بعدها إلى منتجات مشابهة أو مكملة متوفرة من نفس الفئة.</p>`

  const ourReview = `<h2>Our Review</h2><p>${product.title} يظهر كخيار واضح لمن يريد صفحة منتج مرتبة ومباشرة. الفئة معروفة، والمواصفات الأساسية ظاهرة، والخيارات المتاحة تساعد على فهم النسخة المناسبة دون تعقيد. وهذه نقطة مهمة لأي عميل يريد الشراء بعد مقارنة سريعة ومفهومة.</p><p>كما أن وجود منتجات مرتبطة متوفرة في نفس السياق يجعل الوصول إلى البدائل أو المكملات أسهل، ويمنحك تجربة تصفح أكثر راحة إذا كنت لا تزال تقارن بين أكثر من خيار.</p>`

  const howToUseItems =
    facts.inferredType === "device" || facts.inferredType === "disposable"
      ? [
          "راجع مواصفات المنتج والخيارات المتاحة قبل إضافته إلى السلة.",
          "اختر النسخة المناسبة لك من حيث الطراز أو السعة أو الإصدار.",
          "إذا كان المنتج يحتاج ملحقًا إضافيًا فتأكد من التوافق قبل الشراء.",
          "استخدم المنتج وفق الفئة المخصصة له وتعليمات الشركة المصنعة.",
          "احرص على اختيار النسخ الأصلية والمتوافقة للحصول على أفضل نتيجة.",
        ]
      : [
          "تأكد من مطابقة الفئة أو المقاومة أو القوة قبل الشراء.",
          "راجع اسم الجهاز أو البود أو الكويل المرتبط بهذا المنتج.",
          "اختر التركيز أو المقاس المناسب من الخيارات المتاحة.",
          "أضف المنتجات المكملة إذا كنت تريد إكمال الطلب من نفس الفئة.",
          "استخدم المنتج ضمن التوافق الموصى به للحصول على أفضل أداء.",
        ]

  const howToUse = `<h2>How to Use</h2>${toListHtml(howToUseItems)}`

  const comparison = `<h2>Comparison</h2><p>عند مقارنة ${product.title} بمنتج آخر من نفس الفئة مثل ${
    related[0]?.title || "منتج مشابه"
  }، فإن أفضل نقطة بداية تكون في فهم الفئة، والمواصفات، والخيارات المتاحة، ومدى التوافق مع احتياجك الحالي. بعض المنتجات تكون أقرب لما تريده من حيث الحجم أو النيكوتين أو المقاومة أو سهولة الاستخدام، ولذلك فإن المقارنة المباشرة تعطي صورة أوضح قبل الدفع.</p><p>إذا كنت ما زلت محتارًا، فغالبًا يفيدك الانتقال إلى منتج مشابه متوفر من نفس الفئة لرؤية الفروقات بشكل أسرع واتخاذ قرار أدق.</p>`

  const whyChoose = `<h2>Why Vapers Choose This Device</h2>${toListHtml([
    "لأن الفئة والخيارات معروضة بشكل واضح.",
    "لأن المواصفات الأساسية تسهل المقارنة قبل الشراء.",
    "لأنه يمنح فكرة مباشرة عن النسخة المناسبة للاستخدام.",
    "لأن المنتجات المرتبطة المتوفرة تظهر بطريقة تساعد على استكمال الطلب.",
    "لأن الصفحة منظمة بأسلوب يجعل القرار أسهل وأسرع.",
  ])}`

  const whoShouldUse = `<h2>Who Should Use This Product</h2>${toListHtml([
    "من يريد الوصول إلى منتج واضح المواصفات وسهل الفهم.",
    "من يفضل مقارنة أكثر من خيار قبل اتخاذ القرار.",
    "من يحتاج معرفة التوافق أو المقاس أو القوة قبل الشراء.",
    "من يريد رؤية بدائل أو منتجات مكملة متوفرة من نفس الفئة.",
    "من يفضل الشراء بعد قراءة معلومات مرتبة ومباشرة.",
  ])}`

  const whyBuy = `<h2>Why Buy From Our Store</h2>${toListHtml([
    "وصف واضح ومواصفات مرتبة تساعد على الاختيار بسرعة.",
    "تنظيم جيد للأقسام والبراندات لتسهيل الوصول إلى المنتجات.",
    "منتجات مرتبطة متوفرة تساعدك على المقارنة أو استكمال الطلب.",
    "محتوى عربي مباشر ومفهوم بدون حشو غير مفيد.",
    "تجربة تصفح مريحة تساعد على اتخاذ القرار بثقة أكبر.",
  ])}`

  const relatedProductsSection = `<h2>Explore Related Products</h2><p>إذا كان ${product.title} مناسبًا لاحتياجك الحالي، فقد يفيدك أيضًا الاطلاع على منتجات أخرى متوفرة من نفس الفئة أو البراند. اخترنا لك هنا خيارات قريبة يمكن أن تساعدك على المقارنة أو استكمال الطلب بشكل أفضل.</p>${toListHtml(
    related.length
      ? related.map((item) => `<a href="${productUrl(item.handle)}">${item.title}</a>`)
      : [
          `${renderLink(categoryLink, facts.categoryName)} للاطلاع على مزيد من الخيارات المتوفرة في نفس الفئة.`,
          `${renderLink(accessoryLink, "مستلزمات الفيب")} إذا كنت تريد منتجات مكملة أو ملحقات متوافقة.`,
        ]
  )}`

  const faqs = `<h2>Frequently Asked Questions</h2>${buildFaqs(facts, related)}`

  return [
    intro,
    overview,
    keyFeatures,
    technicalSpecifications,
    designAndBuild,
    performance,
    ourReview,
    howToUse,
    comparison,
    whyChoose,
    whoShouldUse,
    whyBuy,
    relatedProductsSection,
    faqs,
  ].join("")
}

export default async function generateAllProductDescriptions({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  logger.info(
    `Starting local bulk product-description generation. dry_run=${DRY_RUN}, max_products=${MAX_PRODUCTS}, only_missing_description=${ONLY_MISSING_DESCRIPTION}`
  )

  const { data } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "description",
      "metadata",
      "type.value",
      "categories.id",
      "categories.name",
      "categories.handle",
      "collection.title",
      "collection.handle",
      "tags.value",
      "options.title",
      "options.values.value",
      "variants.title",
      "variants.options.value",
      "variants.inventory_quantity",
      "variants.manage_inventory",
      "variants.allow_backorder",
    ],
  })

  const allProducts = (data || []) as ProductRecord[]
  const candidates = allProducts
    .filter((product) => normalizeText(product.title))
    .filter((product) =>
      ONLY_MISSING_DESCRIPTION ? !normalizeText(stripHtml(product.description)) : true
    )
    .slice(0, MAX_PRODUCTS)

  logger.info(`Local description candidates: ${candidates.length}`)

  let updated = 0
  let skipped = 0
  let failed = 0
  const updates: { id: string; description: string; metadata: Record<string, unknown> }[] = []

  for (const product of candidates) {
    try {
      const nextDescription = buildDescription(product, allProducts)

      if (!normalizeText(stripHtml(nextDescription))) {
        skipped += 1
        logger.warn(`Skipping ${product.id}: generated description was empty.`)
        continue
      }

      const nextMetadata = {
        ...(product.metadata || {}),
        seo_last_optimized_at: new Date().toISOString(),
        seo_last_query: "local-template-generator",
        seo_last_country_code: "sa",
        seo_source: "local_template_v3_customer_facing",
        seo_generation_mode: "offline_no_serp_no_ai",
      }

      updates.push({
        id: product.id,
        description: nextDescription,
        metadata: nextMetadata,
      })

      updated += 1
      logger.info(
        `${DRY_RUN ? "[dry-run] " : ""}Description generated for ${product.id} (${product.title}).`
      )
    } catch (error) {
      failed += 1
      logger.error(
        `Description generation failed for ${product.id} (${product.title}): ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      )
    }
  }

  if (!DRY_RUN && updates.length) {
    for (let index = 0; index < updates.length; index += UPDATE_BATCH_SIZE) {
      const batch = updates.slice(index, index + UPDATE_BATCH_SIZE)
      await updateProductsWorkflow(container).run({
        input: {
          products: batch.map((item) => ({
            id: item.id,
            description: item.description,
            metadata: item.metadata,
          })),
        },
      })
      logger.info(
        `Persisted batch ${Math.floor(index / UPDATE_BATCH_SIZE) + 1} containing ${batch.length} products.`
      )
    }
  }

  logger.info(
    `Bulk description generation complete. Updated: ${updated}. Skipped: ${skipped}. Failed: ${failed}.`
  )
}
