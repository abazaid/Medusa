type ProductRecord = {
  id: string
  title: string
  handle: string
  description?: string | null
  metadata?: Record<string, unknown> | null
  type?: {
    value?: string | null
  } | null
  categories?: {
    name?: string | null
    handle?: string | null
  }[] | null
}

type SerpResult = {
  title?: string
  snippet?: string
  link?: string
  position?: number
  page_excerpt?: string
}

export type SeoFieldTarget = "meta_title" | "meta_description" | "description"

export type SeoPromptSettings = {
  global_instructions: string
  meta_title_instructions: string
  meta_description_instructions: string
  product_description_instructions: string
}

type GeneratedFieldResult = {
  content: string
  reasoning?: string
}

export const COUNTRY_CODE = "sa"
export const GOOGLE_LANGUAGE = "ar"
export const GOOGLE_GEO = "sa"
export const GOOGLE_DEVICE = "mobile"
export const SERP_TOP_RESULTS = 5
export const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini"

export const DEFAULT_SEO_PROMPT_SETTINGS: SeoPromptSettings = {
  global_instructions:
    "اكتب بصياغة عربية احترافية موجهة للسوق السعودي لمتجر فيب. ركز على وضوح نية الشراء، قوة الإقناع، وابتعد عن النسخ الحرفي من المنافسين. استخدم اسم المنتج والماركة عند الحاجة، وتجنب الحشو والمبالغة غير الواقعية.",
  meta_title_instructions:
    "اكتب Meta Title قويًا وقصيرًا وواضحًا وجذابًا، يركز على اسم المنتج والكلمة الشرائية. الطول المثالي أقل من 60 حرفًا ويجب أن يكون مناسبًا لنتائج البحث.",
  meta_description_instructions:
    "اكتب Meta Description احترافيًا بين 140 و160 حرفًا تقريبًا. اجعله مقنعًا، يوضح الفائدة الأساسية، ويحتوي نداءً شرائيًا واضحًا بدون حشو.",
  product_description_instructions:
    "اكتب وصف منتج احترافيًا ومنظمًا بصيغة HTML بسيطة تتضمن فقرات وعنوانًا فرعيًا وقائمة نقاط عند الحاجة. اجعله مناسبًا لمتجر فيب في السعودية، واضحًا، مقنعًا، ويبرز المزايا والاستخدام والفئة المناسبة للمنتج.",
}

export const normalizeText = (value?: string | null) =>
  (value || "").replace(/\s+/g, " ").trim()

export const stripHtml = (value?: string | null) =>
  normalizeText(
    (value || "")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, " ")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/p>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
  )

const sanitizeCompetitorHtml = (value: string) =>
  normalizeText(
    value
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, " ")
      .replace(/<head[\s\S]*?<\/head>/gi, " ")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/p>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
  )

export const truncate = (value: string, limit: number) => {
  const normalized = normalizeText(value)

  if (normalized.length <= limit) {
    return normalized
  }

  return `${normalized.slice(0, Math.max(0, limit - 3)).trim()}...`
}

export const parseDate = (value?: string | null) => {
  if (!value) {
    return null
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const shouldRefreshSeo = (
  metadata?: Record<string, unknown> | null,
  lookbackDays = 30,
  force = false
) => {
  if (force) {
    return true
  }

  const lastOptimizedRaw =
    typeof metadata?.seo_last_optimized_at === "string"
      ? metadata.seo_last_optimized_at
      : null
  const lastOptimized = parseDate(lastOptimizedRaw)

  if (!lastOptimized) {
    return true
  }

  const threshold = new Date()
  threshold.setDate(threshold.getDate() - Math.max(1, lookbackDays))

  return lastOptimized < threshold
}

export const buildSearchQuery = (product: ProductRecord) => {
  const title = normalizeText(product.title)
  const category = normalizeText(product.categories?.[0]?.name)
  const type = normalizeText(product.type?.value)
  const parts = [title, category, type, "السعودية"]
    .filter(Boolean)
    .slice(0, 3)

  return parts.join(" ")
}

const fetchCompetitorPageExcerpt = async (url: string) => {
  if (!url) {
    return ""
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 7000)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MedusaSEO/1.0; +https://localhost)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return ""
    }

    const html = await response.text()
    return truncate(sanitizeCompetitorHtml(html), 900)
  } catch {
    return ""
  }
}

export const fetchTopSaudiSearchResults = async (query: string) => {
  const serpApiKey = process.env.SERPAPI_KEY

  if (!serpApiKey) {
    throw new Error("SERPAPI_KEY is required to fetch Google Saudi results.")
  }

  const searchUrl = new URL("https://serpapi.com/search.json")
  searchUrl.searchParams.set("engine", "google")
  searchUrl.searchParams.set("q", query)
  searchUrl.searchParams.set("gl", GOOGLE_GEO)
  searchUrl.searchParams.set("hl", GOOGLE_LANGUAGE)
  searchUrl.searchParams.set("device", GOOGLE_DEVICE)
  searchUrl.searchParams.set("google_domain", "google.com.sa")
  searchUrl.searchParams.set("num", String(SERP_TOP_RESULTS))
  searchUrl.searchParams.set("api_key", serpApiKey)

  const response = await fetch(searchUrl.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(
      `SERP API request failed with status ${response.status}: ${await response.text()}`
    )
  }

  const payload = (await response.json()) as {
    organic_results?: SerpResult[]
  }

  const topResults = (payload.organic_results || [])
    .slice(0, SERP_TOP_RESULTS)
    .map((result) => ({
      title: normalizeText(result.title),
      snippet: normalizeText(result.snippet),
      link: normalizeText(result.link),
      position: result.position,
    }))
    .filter((result) => result.title || result.snippet)

  const pageExcerpts = await Promise.all(
    topResults.map((result) => fetchCompetitorPageExcerpt(result.link || ""))
  )

  return topResults.map((result, index) => ({
    ...result,
    page_excerpt: pageExcerpts[index] || "",
  }))
}

const getFieldPrompt = (target: SeoFieldTarget, settings: SeoPromptSettings) => {
  if (target === "meta_title") {
    return settings.meta_title_instructions
  }

  if (target === "meta_description") {
    return settings.meta_description_instructions
  }

  return settings.product_description_instructions
}

const getCurrentFieldValue = (product: ProductRecord, target: SeoFieldTarget) => {
  const metadata = (product.metadata || {}) as Record<string, unknown>

  if (target === "meta_title") {
    return typeof metadata.meta_title === "string" ? metadata.meta_title : ""
  }

  if (target === "meta_description") {
    return typeof metadata.meta_description === "string"
      ? metadata.meta_description
      : ""
  }

  return product.description || ""
}

const buildResponseRules = (target: SeoFieldTarget) => {
  if (target === "meta_title") {
    return [
      "Return JSON only with keys: content, reasoning.",
      "The content must be a meta title under 60 characters.",
    ]
  }

  if (target === "meta_description") {
    return [
      "Return JSON only with keys: content, reasoning.",
      "The content must be a meta description between 140 and 160 characters.",
    ]
  }

  return [
    "Return JSON only with keys: content, reasoning.",
    "The content must be HTML suitable for a product description.",
    "Use only simple HTML tags such as p, h2, h3, ul, li, strong.",
    "Write a newly created product description from scratch.",
    "It must be stronger, clearer, more persuasive, and better structured than the top 5 competitor pages.",
    "Do not reuse or lightly paraphrase the current description.",
  ]
}

const buildTargetSpecificConstraints = (
  target: SeoFieldTarget,
  currentFieldValue: string
) => {
  if (target !== "description") {
    return []
  }

  return [
    "For product description generation, analyze the top 5 competitor results and their page excerpts first.",
    "Compare their strengths and weaknesses, then write a stronger description for this store.",
    "Your response is invalid if it is substantially similar to the current description.",
    `Current description to improve from only as reference and not for reuse: ${truncate(
      stripHtml(currentFieldValue),
      700
    ) || "N/A"}`,
  ]
}

export const generateSeoFieldWithOpenAI = async (input: {
  product: ProductRecord
  searchQuery: string
  target: SeoFieldTarget
  topResults: Awaited<ReturnType<typeof fetchTopSaudiSearchResults>>
  settings: SeoPromptSettings
}) => {
  const openAiKey = process.env.OPENAI_API_KEY

  if (!openAiKey) {
    throw new Error("OPENAI_API_KEY is required to generate SEO content.")
  }

  const product = input.product
  const metadata = (product.metadata || {}) as Record<string, unknown>
  const currentFieldValue = getCurrentFieldValue(product, input.target)
  const categoryNames = (product.categories || [])
    .map((category) => normalizeText(category.name))
    .filter(Boolean)
    .join(" | ")

  const prompt = [
    "You are an elite ecommerce SEO strategist and Arabic product copywriter for a Saudi Arabian vape store.",
    input.settings.global_instructions,
    getFieldPrompt(input.target, input.settings),
    ...buildResponseRules(input.target),
    ...buildTargetSpecificConstraints(input.target, currentFieldValue),
    "Use the top Saudi Google results and page excerpts as competitive context only. Do not copy them verbatim.",
    "",
    `Target field: ${input.target}`,
    `Product title: ${product.title}`,
    `Product handle: ${product.handle}`,
    `Product type: ${normalizeText(product.type?.value) || "غير محدد"}`,
    `Product categories: ${categoryNames || "غير محدد"}`,
    `Current field value: ${truncate(
      input.target === "description"
        ? stripHtml(currentFieldValue)
        : normalizeText(currentFieldValue),
      1200
    ) || "غير موجود"}`,
    `Current meta title: ${
      typeof metadata.meta_title === "string"
        ? normalizeText(metadata.meta_title)
        : "غير موجود"
    }`,
    `Current meta description: ${
      typeof metadata.meta_description === "string"
        ? normalizeText(metadata.meta_description)
        : "غير موجود"
    }`,
    `Product description excerpt: ${truncate(stripHtml(product.description), 1200) || "غير موجود"}`,
    `Google Saudi query used: ${input.searchQuery}`,
    "Top Google Saudi results:",
    ...input.topResults.map((result, index) =>
      [
        `Result ${index + 1}:`,
        `Title: ${result.title || "N/A"}`,
        `Snippet: ${result.snippet || "N/A"}`,
        `Link: ${result.link || "N/A"}`,
        `Page excerpt: ${result.page_excerpt || "N/A"}`,
      ].join("\n")
    ),
  ].join("\n")

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content:
            "You generate high-performing Arabic ecommerce SEO and product copy for product pages. Always return valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: input.target === "description" ? 0.9 : 0.7,
    }),
  })

  if (!response.ok) {
    throw new Error(
      `OpenAI request failed with status ${response.status}: ${await response.text()}`
    )
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = payload.choices?.[0]?.message?.content

  if (!content) {
    throw new Error("OpenAI returned an empty response.")
  }

  let parsed: GeneratedFieldResult

  try {
    parsed = JSON.parse(content) as GeneratedFieldResult
  } catch {
    throw new Error(`OpenAI response was not valid JSON: ${content}`)
  }

  const normalizedContent =
    input.target === "description"
      ? (parsed.content || "").trim()
      : normalizeText(parsed.content)

  if (!normalizedContent) {
    throw new Error("Generated content was empty after normalization.")
  }

  const finalContent =
    input.target === "meta_title"
      ? truncate(normalizedContent, 60)
      : input.target === "meta_description"
      ? truncate(normalizedContent, 160)
      : normalizedContent

  if (
    input.target === "description" &&
    normalizeText(stripHtml(finalContent)) ===
      normalizeText(stripHtml(currentFieldValue))
  ) {
    throw new Error(
      "Generated description matched the current description too closely. Try regenerating."
    )
  }

  return {
    content: finalContent,
    reasoning: normalizeText(parsed.reasoning),
  }
}
