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

const extractMatches = (text: string, regex: RegExp, formatter: (value: string) => string) =>
  uniq(Array.from(text.matchAll(regex)).map((match) => formatter(match[1] || match[0] || "")))

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

  return allProducts
    .filter((candidate) => candidate.id !== product.id)
    .filter((candidate) => {
      const sameCategory =
        normalizeText(candidate.categories?.[0]?.handle) &&
        normalizeText(candidate.categories?.[0]?.handle) === categoryHandle
      const candidateBrand =
        typeof (candidate.metadata || {}).brand_handle === "string"
          ? normalizeText(String((candidate.metadata || {}).brand_handle))
          : ""
      const sameBrand = brandHandle && candidateBrand === brandHandle
      return sameCategory || sameBrand
    })
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
                  : "ملحق من ملحقات الفيب"
    }`,
    `الخيارات المتاحة: ${facts.optionSummary.join(" | ") || "بحسب المخزون المتوفر"}`,
    `قوة النيكوتين: ${facts.nicotineStrengths.join("، ") || "بحسب الإصدار المتوفر"}`,
    `السعة أو الحجم: ${facts.volumeValues.join("، ") || "راجع خيارات المنتج"}`,
    `المقاومات أو الأوم: ${facts.resistanceValues.join("، ") || "حسب النسخة أو الملحق المتوافق"}`,
    `سعة البطارية: ${facts.batteryValue || "تختلف حسب الإصدار"}`,
    `التوافق: ${facts.compatibleKeywords.join("، ") || "يرتبط بالموديل أو الجهاز المناسب"}`,
  ]

  return toListHtml(specs)
}

const buildFaqs = (facts: ProductFacts, related: ProductRecord[]) => {
  const relatedTitle = related[0]?.title || "منتجات مشابهة في المتجر"
  const qa = [
    {
      q: "هل هذا المنتج مناسب للمبتدئين؟",
      a: "نعم، إذا كنت تبحث عن خيار واضح الاستخدام ومباشر داخل متجر الفيب، فهذا المنتج مناسب كبداية أو كخيار عملي بحسب نوعه وفئته.",
    },
    {
      q: "ما الفائدة الأساسية من هذا المنتج؟",
      a: `الفائدة الأساسية هنا هي الحصول على تجربة ${facts.inferredType === "salt" ? "نكهة سولت متوازنة" : facts.inferredType === "device" ? "فيب عملية بثبات يومي" : "استخدام مكمل أو بديل متوافق"} مع اسم تجاري معروف وفئة مطلوبة داخل السوق السعودي.`,
    },
    {
      q: "هل أستطيع اختيار القوة أو المقاس المناسب؟",
      a: `غالبًا نعم. تتوفر لهذا المنتج خيارات مرتبطة بالمقاس أو النيكوتين أو المقاومة مثل: ${facts.optionSummary.join("، ") || "خيارات مختلفة حسب المخزون"}.`,
    },
    {
      q: "هل يوجد منتجات مرتبطة يمكن شراؤها معه؟",
      a: `نعم، يمكنك عادة الجمع بين هذا المنتج وبين ${relatedTitle} أو تصفح الأقسام المرتبطة داخل المتجر للحصول على تجربة مكتملة.`,
    },
    {
      q: "كيف أعرف التوافق الصحيح قبل الشراء؟",
      a: "راجع اسم الجهاز أو الموديل المذكور في عنوان المنتج ووصفه، وتأكد من نفس الفئة أو المقاومة أو السعة قبل إضافة المنتج إلى السلة.",
    },
    {
      q: "هل هذا المنتج مناسب للاستخدام اليومي؟",
      a: "إذا كنت تبحث عن حل عملي ومستقر من حيث القيمة وسهولة الشراء وإعادة الطلب، فهو خيار جيد ضمن الفئة التي ينتمي إليها.",
    },
  ]

  return qa
    .map(
      (item) =>
        `<h3>${item.q}</h3><p>${item.a}</p>`
    )
    .join("")
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

  const intro = `<h2>Introduction</h2><p>${product.title} من المنتجات التي تستهدف العميل السعودي الباحث عن جودة واضحة وتجربة شراء مطمئنة داخل سوق الفيب. هذا المنتج يقدم قيمة عملية لأنه يجمع بين اسم معروف وفئة مطلوبة واستخدام مباشر يساعدك على الوصول إلى تجربة أكثر ثباتًا سواء كنت تبحث عن نكهة واضحة، أو جهاز فيب عملي، أو ملحق متوافق يحافظ على الأداء اليومي. عند قراءة مواصفات ${product.title} ستلاحظ أن العنصر الأهم فيه هو التوازن بين سهولة الاستخدام وبين النتيجة الفعلية التي يريدها المستخدم من حيث الأداء، الراحة، وثبات الجودة في كل مرة.</p><p>إذا كنت تتسوق ضمن فئة ${renderLink(categoryLink, facts.categoryName)} وتفضل براند معروف مثل ${renderLink(brandLink, facts.brandName)}، فهذا المنتج يمثل خيارًا مناسبًا لأنه يدخل ضمن المنتجات التي يكثر عليها الطلب في المتجر بفضل وضوح الاستخدام وتنوع الخيارات. كما أن وجوده ضمن نفس البيئة الشرائية مع أقسام مثل ${renderLink(accessoryLink, "مستلزمات الفيب")} يجعل قرار الشراء أسهل لأنك تستطيع استكمال احتياجك من مكان واحد دون الحاجة للخروج إلى روابط خارجية.</p>`

  const overview = `<h2>Product Overview</h2><p>ينتمي هذا المنتج إلى فئة ${facts.categoryName}، وهي فئة أساسية داخل أي متجر فيب يستهدف السوق السعودي بطريقة احترافية. البراند المرتبط به هو ${facts.brandName}، وهو اسم يظهر عادة مع منتجات يسهل التعرف عليها من حيث الجودة والثبات والتكرار في الطلب. بالنسبة للمستخدم النهائي، فإن فكرة المنتج ليست مجرد شراء عنصر منفصل، بل اختيار حل مناسب لطبيعة الاستخدام اليومي؛ سواء كنت تحتاج منتجًا جاهزًا للاستخدام، أو قطعة بديلة، أو سائلًا يمنحك نكهة واضحة، أو جهازًا يركز على العملية والسهولة.</p><p>يعتمد تقييمنا العام لهذا المنتج على معايير مفهومة للمشتري: هل الاسم واضح؟ هل الفئة مناسبة؟ هل الخيارات قابلة للاختيار؟ وهل توجد عناصر مرتبطة داخل المتجر تدعم قرار الشراء؟ في هذه النقاط يظهر ${product.title} بشكل جيد، خصوصًا عندما يتم تصفحه مع ${renderLink(collectionLink, facts.collectionTitle || "المجموعة المرتبطة")} أو مع منتج مشابه مثل ${renderLink(relatedLink, related[0]?.title || "أحد المنتجات القريبة")} ضمن نفس الفئة.</p>`

  const featureItems = [
    `اسم منتج واضح وسهل البحث داخل السوق السعودي`,
    `يرتبط ببراند ${facts.brandName} بشكل طبيعي داخل المتجر`,
    `يأتي ضمن فئة ${facts.categoryName} المطلوبة فعليًا من العملاء`,
    `يقدم خيارات عملية مثل: ${facts.optionSummary.join("، ") || "أحجام أو قوى أو إصدارات متعددة حسب المخزون"}`,
    `مناسب للشراء الفردي أو لإكمال طلب أكبر من خلال الأقسام المرتبطة`,
    `يمكن دعمه بروابط داخلية إلى فئات متوافقة دون الحاجة لأي موقع خارجي`,
  ]

  const keyFeatures = `<h2>Key Features</h2>${toListHtml(featureItems)}`

  const technicalSpecifications = `<h2>Technical Specifications</h2>${buildTechnicalSpecs(facts, product)}`

  const designAndBuild = `<h2>Design and Build Quality</h2><p>من ناحية الانطباع العام، يظهر ${product.title} كمنتج تم تقديمه بطريقة تخدم الاستخدام الفعلي لا العرض النظري فقط. إذا كان المنتج جهازًا أو بودًا أو ملحقًا، فالمطلوب هنا هو وضوح الشكل وسهولة التثبيت أو التشغيل أو الاستبدال. وإذا كان سائلًا أو نكهة، فالأولوية تصبح للتصنيف الصحيح، وحجم العبوة، وقوة النيكوتين، وسهولة اختيار النسخة المناسبة. لذلك نحن ننظر إلى جودة البناء هنا بوصفها جودة قرار الشراء أيضًا: هل يعرف العميل ماذا يشتري؟ وهل المسمى والخيارات تقوده إلى نسخة مناسبة؟</p><p>المنتجات الجيدة في هذا القطاع لا تحتاج إلى مبالغة. يكفي أن تكون المعلومات مرتبة، والعنوان واضح، والخيارات منطقية، والتوافق مفهوم. هذا بالضبط ما يجعل ${product.title} مناسبًا ضمن صفحة منتج محسنة SEO وموجهة للبيع الحقيقي، لأن المستخدم لا يريد حشوًا، بل يريد طمأنة سريعة ومحتوى يقوده إلى فهم ما إذا كان المنتج ملائمًا له أم لا.</p>`

  const performance = `<h2>Performance and Vapor Production</h2><p>الأداء هنا يختلف حسب نوع المنتج، لكن القاعدة واحدة: المشتري يريد نتيجة ثابتة. إذا كان المنتج من فئة الأجهزة أو السحبات الجاهزة، فالمعيار الأساسي يكون راحة الاستخدام، ثبات السحب، واستقرار الأداء خلال الاستخدام اليومي. وإذا كان المنتج من فئة السوائل أو النكهات، فالمعيار يتحول إلى وضوح الطعم، اتزان الإحساس، ومدى ملاءمة القوة أو التركيز. أما إذا كان المنتج من فئة الكويلات أو البودات البديلة أو الملحقات، فالنقطة الأهم تكون في التوافق وسهولة الاستبدال وعدم التعقيد.</p><p>انطلاقًا من ذلك، فإن ${product.title} يقدم تجربة مقنعة عندما يتم اختياره ضمن الفئة الصحيحة ومع الملحق أو الجهاز المناسب. لهذا السبب نربط دائمًا بين المنتج وبين الأقسام المجاورة مثل ${renderLink(categoryLink, facts.categoryName)} و${renderLink(accessoryLink, "مستلزمات الفيب")}، لأن الأداء الأفضل لا يأتي من المنتج وحده فقط، بل من اكتمال الاختيار المحيط به.</p>`

  const ourReview = `<h2>Our Review</h2><p>تقييمنا العملي لهذا المنتج إيجابي من زاوية التجارة الإلكترونية والشراء المدروس. السبب ليس في ادعاء مبالغ فيه، بل لأن ${product.title} يملك عناصر أساسية مهمة: عنوان واضح، فئة يمكن فهمها سريعًا، براند معروف أو قابل للتعرف، وخيارات شراء تساعد العميل على اتخاذ القرار بدون ارتباك. كما أن وجود روابط داخلية مرتبطة بالتصنيف والبراند والمنتجات المكملة يجعل الصفحة نفسها أداة مساعدة للمستخدم وليست مجرد مساحة نصية طويلة.</p><p>لو كنا نقيم المنتج من منظور تجربة عميل داخل السعودية، فسنقول إن هذا النوع من الصفحات يخدم من يريد الشراء بسرعة لكن بشكل واعٍ. المحتوى يشرح، والفئة توضح، والمنتجات القريبة تدعم المقارنة، والاختيارات الظاهرة تقلل من احتمالات الخطأ قبل الدفع. لذلك نعتبر ${product.title} خيارًا يستحق الظهور بشكل قوي في نتائج البحث الداخلية والخارجية معًا.</p>`

  const howToUseItems =
    facts.inferredType === "device" || facts.inferredType === "disposable"
      ? [
          "راجع مواصفات المنتج والخيارات المتاحة قبل الإضافة إلى السلة.",
          "اختر النسخة المناسبة لك من حيث السعة أو القوة أو الطراز.",
          "إذا كان المنتج يحتاج ملحقًا إضافيًا فانتقل إلى القسم المرتبط داخل المتجر.",
          "بعد الاستلام استخدم المنتج حسب الفئة المخصصة له وبالطريقة الموصى بها من المصنع.",
          "حافظ على اختيار النسخ الأصلية والمتوافقة فقط لضمان أفضل نتيجة.",
        ]
      : [
          "تأكد من مطابقة الفئة أو المقاومة أو القوة قبل الشراء.",
          "راجع اسم الجهاز أو البود أو الكويل المرتبط بهذا المنتج.",
          "اختر التركيز أو المقاس المناسب من الخيارات المتاحة.",
          "أضف المنتجات المكملة من الأقسام المرتبطة إذا كنت تحتاج طلبًا كاملاً.",
          "بعد الاستلام استخدم المنتج ضمن الفئة المتوافقة فقط للحصول على أفضل أداء.",
        ]

  const howToUse = `<h2>How to Use</h2>${toListHtml(howToUseItems)}`

  const comparison = `<h2>Comparison</h2><p>عند مقارنة ${product.title} بمنتج آخر من نفس الفئة مثل ${related[0]?.title || "منتج مشابه داخل المتجر"}، تظهر نقاط المقارنة الأساسية في وضوح الفئة، وسهولة اختيار النسخة المناسبة، ومدى اكتمال المحتوى داخل صفحة المنتج. بعض المنتجات تكون قوية بالاسم فقط، لكن صفحة المنتج لا تساعد على اتخاذ القرار. هنا نحن نركز على تقديم منتج مع محتوى مرتب يدعم العميل بالمعلومة والرابط الداخلي والبدائل المرتبطة.</p><p>هذه المقارنة مهمة خصوصًا في متجر يحتوي على تنوع كبير. العميل لا يحتاج أن نخبره بأن كل شيء هو الأفضل، بل يحتاج معرفة أي منتج أنسب لاحتياجه الآن. لذلك فإن المقارنة التي نقدمها هنا هي مقارنة شراء عملية: ماذا تختار لو كنت تبحث عن سرعة؟ ماذا تختار لو كنت تريد توافقًا أفضل؟ وماذا تختار لو كنت تريد التنقل بين القسم والبراند والملحقات دون فقدان السياق؟</p>`

  const whyChoose = `<h2>Why Vapers Choose This Device</h2>${toListHtml([
    "لأنه يقدم فئة واضحة مناسبة لاحتياج العميل بدون تعقيد.",
    "لأن الاسم التجاري والخيارات الظاهرة يسهّلان قرار الشراء.",
    "لأنه مرتبط بأقسام ومنتجات مكملة داخل نفس المتجر.",
    "لأنه مناسب للبحث الداخلي ونتائج SEO بفضل وضوح العنوان والمحتوى.",
    "لأنه يساعد العميل على الشراء بثقة أكبر عند مقارنة الخيارات.",
  ])}`

  const whoShouldUse = `<h2>Who Should Use This Product</h2>${toListHtml([
    "من يريد شراء منتج واضح الفئة والاستخدام داخل متجر فيب سعودي.",
    "من يفضّل مقارنة أكثر من خيار قبل اتخاذ قرار الشراء.",
    "من يحتاج الوصول إلى ملحقات أو منتجات مرتبطة من نفس الصفحة.",
    "من يبحث عن صفحة منتج مرتبة تساعده على فهم الفروقات بسرعة.",
    "من يهمه اختيار نسخة مناسبة من حيث المقاس أو النيكوتين أو المقاومة.",
  ])}`

  const whyBuy = `<h2>Why Buy From Our Store</h2>${toListHtml([
    "منتجات أصلية ضمن أقسام واضحة وسهلة التصفح.",
    "ربط داخلي بين المنتجات والتصنيفات والبراندات لتسهيل الوصول.",
    "تجربة شراء أنسب للعميل السعودي مع محتوى عربي واضح.",
    "إمكانية استكمال الطلب من نفس المتجر دون الاعتماد على روابط خارجية.",
    "تنظيم يساعد على اختيار المنتج المناسب بسرعة وبدون حشو.",
  ])}`

  const relatedProductsSection = `<h2>Explore Related Products</h2><p>إذا كان ${product.title} مناسبًا لاحتياجك الحالي، فغالبًا ستستفيد أيضًا من تصفح ${renderLink(categoryLink, facts.categoryName)} والانتقال إلى ${renderLink(brandLink, `براند ${facts.brandName}`)} لمراجعة المنتجات القريبة من نفس الخط. كما يمكنك استكشاف ${renderLink(accessoryLink, "مستلزمات الفيب")} للوصول إلى الإضافات العملية التي تكمل الطلب وتساعدك على اختيار أدق.</p>${toListHtml(
    related.length
      ? related.map(
          (item) =>
            `<a href="${productUrl(item.handle)}">${item.title}</a> ضمن نفس الفئة أو البراند`
        )
      : [
          `${renderLink(categoryLink, facts.categoryName)} للوصول إلى خيارات أكثر من نفس القسم.`,
          `${renderLink(accessoryLink, "مستلزمات الفيب")} لإكمال الطلب بمنتجات داعمة.`,
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
        seo_source: "local_template_v2",
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
