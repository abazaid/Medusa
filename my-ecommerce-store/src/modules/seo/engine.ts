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
  collection?: {
    title?: string | null
    handle?: string | null
  } | null
}

type CompetitorKeyword = {
  keyword: string
  rank_group: number | null
  rank_absolute: number | null
  search_volume: number | null
  keyword_intent: string | null
  cpc: number | null
  competition: number | null
  impressions: number | null
  etv: number | null
}

export type CompetitorProductResult = {
  rank: number
  rank_group: number | null
  rank_absolute: number | null
  title: string
  url: string
  domain: string
  google_snippet: string
  breadcrumb: string
  page_description: string | null
  keywords: CompetitorKeyword[]
  page_excerpt?: string
}

export type CompetitorProductInsights = {
  query: string
  market: {
    location_name: string
    language_name: string
    device: "mobile"
    os: "android"
  }
  check_url: string
  datetime: string
  results: CompetitorProductResult[]
}

export type SeoFieldTarget = "meta_title" | "meta_description" | "description"

export type SeoPromptSettings = {
  global_instructions: string
  meta_title_instructions: string
  meta_description_instructions: string
  product_description_instructions: string
}

export type AiProvider = "openai" | "deepseek" | "claude"

export type SeoAiSettings = {
  provider: AiProvider
  model: string
  openai_api_key: string
  deepseek_api_key: string
  claude_api_key: string
}

type GeneratedFieldResult = {
  content: string
  reasoning?: string
}

export const COUNTRY_CODE = "sa"
export const GOOGLE_LANGUAGE = "ar"
export const GOOGLE_GEO = "sa"
export const GOOGLE_DEVICE = "mobile"
export const DATAFORSEO_LOCATION_NAME = "Saudi Arabia"
export const DATAFORSEO_LANGUAGE_NAME = "Arabic"
export const DATAFORSEO_DEVICE = "mobile"
export const DATAFORSEO_OS = "android"
export const SERP_TOP_RESULTS = 5
export const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini"
export const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini"
export const DEFAULT_DEEPSEEK_MODEL =
  process.env.DEEPSEEK_MODEL || "deepseek-chat"
export const DEFAULT_CLAUDE_MODEL =
  process.env.CLAUDE_MODEL || "claude-3-5-sonnet-latest"
export const DEFAULT_AI_PROVIDER =
  (process.env.SEO_AI_PROVIDER as AiProvider) || "openai"

export const AI_PROVIDER_MODELS: Record<AiProvider, string[]> = {
  openai: [
    "gpt-4.1",
    "gpt-4.1-mini",
    "gpt-4.1-nano",
    "gpt-4o",
    "gpt-4o-mini",
  ],
  deepseek: ["deepseek-chat", "deepseek-reasoner"],
  claude: [
    "claude-3-7-sonnet-latest",
    "claude-3-5-sonnet-latest",
    "claude-3-5-haiku-latest",
    "claude-3-opus-latest",
  ],
}

const DEFAULT_PROVIDER_MODEL: Record<AiProvider, string> = {
  openai: DEFAULT_OPENAI_MODEL,
  deepseek: DEFAULT_DEEPSEEK_MODEL,
  claude: DEFAULT_CLAUDE_MODEL,
}

const isAiProvider = (value: unknown): value is AiProvider =>
  value === "openai" || value === "deepseek" || value === "claude"

export const getDefaultSeoAiSettings = (): SeoAiSettings => {
  const provider = isAiProvider(DEFAULT_AI_PROVIDER)
    ? DEFAULT_AI_PROVIDER
    : "openai"
  const model = normalizeText(DEFAULT_PROVIDER_MODEL[provider])

  return {
    provider,
    model: model || AI_PROVIDER_MODELS[provider][0],
    openai_api_key: normalizeText(process.env.OPENAI_API_KEY),
    deepseek_api_key: normalizeText(process.env.DEEPSEEK_API_KEY),
    claude_api_key: normalizeText(process.env.CLAUDE_API_KEY),
  }
}

export const sanitizeSeoAiSettings = (
  raw?: Record<string, unknown> | null
): SeoAiSettings => {
  const defaults = getDefaultSeoAiSettings()
  const provider = isAiProvider(raw?.provider) ? raw?.provider : defaults.provider
  const model = normalizeText(
    typeof raw?.model === "string" ? raw.model : defaults.model
  )

  return {
    provider,
    model: model || AI_PROVIDER_MODELS[provider][0],
    openai_api_key:
      typeof raw?.openai_api_key === "string"
        ? normalizeText(raw.openai_api_key)
        : defaults.openai_api_key,
    deepseek_api_key:
      typeof raw?.deepseek_api_key === "string"
        ? normalizeText(raw.deepseek_api_key)
        : defaults.deepseek_api_key,
    claude_api_key:
      typeof raw?.claude_api_key === "string"
        ? normalizeText(raw.claude_api_key)
        : defaults.claude_api_key,
  }
}

export const DEFAULT_SEO_PROMPT_SETTINGS: SeoPromptSettings = {
  global_instructions:
    "Write in professional Arabic for a Saudi vape ecommerce store. Keep copy clear, useful, and conversion-focused. Avoid keyword stuffing and exaggerated claims.",
  meta_title_instructions:
    "Write a strong SEO meta title under 60 characters using product name and intent naturally.",
  meta_description_instructions:
    "Write a persuasive SEO meta description between 140 and 160 characters with a clear buyer benefit and CTA.",
  product_description_instructions:
    "Write a professional Arabic HTML product description for Saudi market using clear structure, practical benefits, and natural brand/product naming.",
}

const DESCRIPTION_STRUCTURE_POLICY = [
  "The product description MUST be in Arabic (MSA) and between 1200 and 1600 words.",
  "Use only simple HTML tags: h2, h3, p, ul, li, strong, a.",
  "Follow this exact H2 order: Introduction, Product Overview, Key Features, Technical Specifications, Design and Build Quality, Performance and Vapor Production, Our Review, How to Use, Comparison, Why Vapers Choose This Device, Who Should Use This Product, Why Buy From Our Store, Explore Related Products, Frequently Asked Questions.",
  "Frequently Asked Questions must include 5 to 7 Q&A items.",
  "Key Features must be bullet points using ul/li.",
  "Write unique content that is more complete and better structured than competitors. Do not copy.",
  "Use natural internal links in the body with 3 to 5 clickable anchors.",
  "Internal links must be only to relevant pages inside this same store domain.",
].join(" ")

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
  const parts = [title, category, type, "Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ©"]
    .filter(Boolean)
    .slice(0, 3)

  return parts.join(" ")
}

const getStorefrontBaseUrl = () => {
  const explicit =
    normalizeText(process.env.STOREFRONT_BASE_URL) ||
    normalizeText(process.env.STORE_FRONTEND_URL) ||
    normalizeText(process.env.NEXT_PUBLIC_BASE_URL)

  if (explicit) {
    return explicit.replace(/\/+$/, "")
  }

  const storeCors = normalizeText(process.env.STORE_CORS)
  if (storeCors) {
    const firstOrigin = storeCors
      .split(",")
      .map((item) => normalizeText(item))
      .find(Boolean)

    if (firstOrigin) {
      return firstOrigin.replace(/\/+$/, "")
    }
  }

  return "https://vapehubksa.com"
}

const getProductBrandHandle = (product: ProductRecord) => {
  const metadata = (product.metadata || {}) as Record<string, unknown>
  return typeof metadata.brand_handle === "string"
    ? normalizeText(metadata.brand_handle)
    : ""
}

const buildInternalLinkCandidates = (product: ProductRecord) => {
  const baseUrl = getStorefrontBaseUrl()
  const localePrefix = "/ar"
  const links = new Set<string>()

  links.add(`${baseUrl}${localePrefix}/store`)
  links.add(`${baseUrl}${localePrefix}/brands`)
  links.add(`${baseUrl}${localePrefix}/categories`)

  const safeHandle = encodeURIComponent(normalizeText(product.handle))
  if (safeHandle) {
    links.add(`${baseUrl}${localePrefix}/products/${safeHandle}`)
  }

  const safeTitle = normalizeText(product.title)
  if (safeTitle) {
    links.add(`${baseUrl}${localePrefix}/store?q=${encodeURIComponent(safeTitle)}`)
  }

  const brandHandle = getProductBrandHandle(product)
  if (brandHandle) {
    links.add(`${baseUrl}${localePrefix}/brands/${encodeURIComponent(brandHandle)}`)
  }

  const collectionHandle = normalizeText(product.collection?.handle)
  if (collectionHandle) {
    links.add(
      `${baseUrl}${localePrefix}/collections/${encodeURIComponent(collectionHandle)}`
    )
  }

  for (const category of product.categories || []) {
    const categoryHandle = normalizeText(category?.handle)
    if (!categoryHandle) {
      continue
    }
    links.add(
      `${baseUrl}${localePrefix}/categories/${encodeURIComponent(categoryHandle)}`
    )
  }

  return Array.from(links).slice(0, 8)
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

const getDataForSeoCredentials = () => {
  const login =
    normalizeText(process.env.DATAFORSEO_LOGIN) ||
    normalizeText(process.env.DATAFORSEO_EMAIL)
  const password = normalizeText(process.env.DATAFORSEO_PASSWORD)

  if (!login || !password) {
    throw new Error(
      "DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are required to fetch competitor insights."
    )
  }

  return { login, password }
}

const getDataForSeoAuthHeader = () => {
  const { login, password } = getDataForSeoCredentials()
  return `Basic ${Buffer.from(`${login}:${password}`).toString("base64")}`
}

const toNumberOrNull = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const toStringOrEmpty = (value: unknown) =>
  typeof value === "string" ? normalizeText(value) : ""

const toPageDomain = (value: string) => {
  try {
    return new URL(value).hostname
  } catch {
    return ""
  }
}

const dataForSeoPost = async <TResult = Record<string, unknown>>(
  endpoint: string,
  tasks: Record<string, unknown>[]
) => {
  const response = await fetch(`https://api.dataforseo.com${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: getDataForSeoAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tasks),
  })

  if (!response.ok) {
    throw new Error(
      `DataForSEO request failed with status ${response.status}: ${await response.text()}`
    )
  }

  const payload = (await response.json()) as {
    status_code?: number
    status_message?: string
    tasks?: Array<{
      status_code?: number
      status_message?: string
      result?: TResult[]
      data?: Record<string, unknown>
    }>
  }

  if (payload.status_code && payload.status_code !== 20000) {
    throw new Error(
      payload.status_message || "DataForSEO returned an unexpected status."
    )
  }

  return payload
}

const normalizeDescriptionText = (value?: string | null) =>
  normalizeText(value)
    .replace(
      /(الشحن|سياسة الإرجاع|تسجيل الدخول|السلة|الكوكيز|cookies)/gi,
      " "
    )
    .replace(/\s+/g, " ")
    .trim()

const compactDescription = (parts: string[]) => {
  const seen = new Set<string>()
  const merged: string[] = []

  for (const part of parts.map((item) => normalizeDescriptionText(item))) {
    if (!part || part.length < 40 || seen.has(part)) {
      continue
    }

    seen.add(part)
    merged.push(part)

    if (merged.join(" ").length >= 1000 || merged.length >= 3) {
      break
    }
  }

  return truncate(merged.join(" "), 1000) || null
}

const extractPageDescription = (
  payload: Record<string, unknown> | undefined,
  fallbackSnippet: string
) => {
  const mainTopic =
    payload && typeof payload.main_topic === "object"
      ? (payload.main_topic as Record<string, unknown>)
      : null
  const primaryContent = Array.isArray(payload?.primary_content)
    ? (payload?.primary_content as unknown[])
    : []
  const secondaryContent = Array.isArray(payload?.secondary_content)
    ? (payload?.secondary_content as unknown[])
    : []
  const headings = Array.isArray(payload?.headings)
    ? (payload?.headings as Array<Record<string, unknown>>)
    : []

  const candidateParts: string[] = []

  const pushValue = (value: unknown) => {
    if (typeof value === "string") {
      candidateParts.push(value)
    }
  }

  if (mainTopic) {
    pushValue(mainTopic.primary_content)
    pushValue(mainTopic.description)
    pushValue(mainTopic.h_title)
  }

  for (const item of primaryContent) {
    if (typeof item === "string") {
      candidateParts.push(item)
      continue
    }

    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>
      pushValue(record.text)
      pushValue(record.content)
    }
  }

  if (!candidateParts.length) {
    for (const heading of headings.slice(0, 3)) {
      pushValue(heading.h1)
      pushValue(heading.h2)
      pushValue(heading.title)
      pushValue(heading.text)
    }
  }

  if (!candidateParts.length) {
    for (const item of secondaryContent.slice(0, 3)) {
      if (typeof item === "string") {
        candidateParts.push(item)
        continue
      }

      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>
        pushValue(record.text)
        pushValue(record.content)
      }
    }
  }

  return compactDescription(candidateParts) || normalizeDescriptionText(fallbackSnippet) || null
}

const mapKeywordItem = (item: Record<string, unknown>): CompetitorKeyword | null => {
  const keywordData =
    item.keyword_data && typeof item.keyword_data === "object"
      ? (item.keyword_data as Record<string, unknown>)
      : {}
  const keywordInfo =
    item.keyword_info && typeof item.keyword_info === "object"
      ? (item.keyword_info as Record<string, unknown>)
      : {}
  const rankedSerpElement =
    item.ranked_serp_element && typeof item.ranked_serp_element === "object"
      ? (item.ranked_serp_element as Record<string, unknown>)
      : {}
  const serpItem =
    rankedSerpElement.serp_item && typeof rankedSerpElement.serp_item === "object"
      ? (rankedSerpElement.serp_item as Record<string, unknown>)
      : {}
  const keywordProperties =
    item.keyword_properties && typeof item.keyword_properties === "object"
      ? (item.keyword_properties as Record<string, unknown>)
      : {}
  const keywordIntent =
    item.keyword_intent && typeof item.keyword_intent === "object"
      ? (item.keyword_intent as Record<string, unknown>)
      : {}

  const keyword =
    toStringOrEmpty(keywordData.keyword) || toStringOrEmpty(item.keyword)

  if (!keyword) {
    return null
  }

  return {
    keyword,
    rank_group:
      toNumberOrNull(serpItem.rank_group) ?? toNumberOrNull(item.rank_group),
    rank_absolute:
      toNumberOrNull(serpItem.rank_absolute) ??
      toNumberOrNull(item.rank_absolute),
    search_volume:
      toNumberOrNull(keywordInfo.search_volume) ??
      toNumberOrNull(item.search_volume),
    keyword_intent:
      toStringOrEmpty(keywordIntent.label) || toStringOrEmpty(item.keyword_intent) || null,
    cpc: toNumberOrNull(keywordInfo.cpc) ?? toNumberOrNull(item.cpc),
    competition:
      toNumberOrNull(keywordInfo.competition) ??
      toNumberOrNull(item.competition) ??
      toNumberOrNull(keywordProperties.competition),
    impressions:
      toNumberOrNull(rankedSerpElement.impressions) ??
      toNumberOrNull(item.impressions),
    etv:
      toNumberOrNull(rankedSerpElement.etv) ?? toNumberOrNull(item.etv),
  }
}

const sortKeywords = (keywords: CompetitorKeyword[]) =>
  keywords.sort((a, b) => {
    const rankDelta = (a.rank_absolute ?? 999999) - (b.rank_absolute ?? 999999)
    if (rankDelta !== 0) {
      return rankDelta
    }

    return (b.search_volume ?? 0) - (a.search_volume ?? 0)
  })

export const getCompetitorProductInsights = async (
  productName: string
): Promise<CompetitorProductInsights> => {
  const query = normalizeText(productName)

  if (!query) {
    throw new Error("A product name is required to fetch competitor insights.")
  }

  const serpPayload = await dataForSeoPost<{
    check_url?: string
    datetime?: string
    items?: Array<Record<string, unknown>>
  }>("/v3/serp/google/organic/live/advanced", [
    {
      keyword: query,
      device: DATAFORSEO_DEVICE,
      os: DATAFORSEO_OS,
      depth: SERP_TOP_RESULTS,
      location_name: DATAFORSEO_LOCATION_NAME,
      language_name: DATAFORSEO_LANGUAGE_NAME,
    },
  ])

  const serpResult = serpPayload.tasks?.[0]?.result?.[0]
  const organicItems = ((serpResult?.items || []) as Array<Record<string, unknown>>)
    .filter((item) => toStringOrEmpty(item.type) === "organic")
    .slice(0, SERP_TOP_RESULTS)

  if (!organicItems.length) {
    return {
      query,
      market: {
        location_name: DATAFORSEO_LOCATION_NAME,
        language_name: DATAFORSEO_LANGUAGE_NAME,
        device: "mobile",
        os: "android",
      },
      check_url: toStringOrEmpty(serpResult?.check_url),
      datetime: toStringOrEmpty(serpResult?.datetime),
      results: [],
    }
  }

  const baseResults: CompetitorProductResult[] = organicItems.map((item, index) => {
    const url = toStringOrEmpty(item.url)

    return {
      rank: index + 1,
      rank_group: toNumberOrNull(item.rank_group),
      rank_absolute: toNumberOrNull(item.rank_absolute),
      title: toStringOrEmpty(item.title),
      url,
      domain: toStringOrEmpty(item.domain) || toPageDomain(url),
      google_snippet:
        toStringOrEmpty(item.description) ||
        toStringOrEmpty(item.snippet) ||
        toStringOrEmpty(item.pre_snippet),
      breadcrumb: toStringOrEmpty(item.breadcrumb),
      page_description: null,
      keywords: [],
      page_excerpt: "",
    }
  })

  const rankedKeywordsPayload = await dataForSeoPost<{
    items?: Array<Record<string, unknown>>
  }>(
    "/v3/dataforseo_labs/google/ranked_keywords/live",
    baseResults.map((result) => ({
      target: result.url,
      location_name: DATAFORSEO_LOCATION_NAME,
      language_name: DATAFORSEO_LANGUAGE_NAME,
      limit: 20,
      historical_serp_mode: "live",
      ignore_synonyms: true,
      item_types: ["organic"],
    }))
  ).catch(() => null)

  const contentParsingPayload = await dataForSeoPost<{
    items?: Array<Record<string, unknown>>
  }>(
    "/v3/on_page/content_parsing/live",
    baseResults.map((result) => ({
      url: result.url,
    }))
  ).catch(() => null)

  return {
    query,
    market: {
      location_name: DATAFORSEO_LOCATION_NAME,
      language_name: DATAFORSEO_LANGUAGE_NAME,
      device: "mobile",
      os: "android",
    },
    check_url: toStringOrEmpty(serpResult?.check_url),
    datetime: toStringOrEmpty(serpResult?.datetime),
    results: baseResults.map((result, index) => {
      const keywordItems =
        rankedKeywordsPayload?.tasks?.[index]?.result?.[0]?.items || []
      const parsedContent =
        contentParsingPayload?.tasks?.[index]?.result?.[0] || undefined

      const keywords = sortKeywords(
        keywordItems
          .map((item) => mapKeywordItem(item))
          .filter((item): item is CompetitorKeyword => Boolean(item))
      ).slice(0, 10)

      const pageDescription = extractPageDescription(
        parsedContent as Record<string, unknown> | undefined,
        result.google_snippet
      )

      return {
        ...result,
        page_description: pageDescription,
        page_excerpt: pageDescription || result.google_snippet,
        keywords,
      }
    }),
  }
}

export const fetchTopSaudiSearchResults = async (query: string) => {
  const insights = await getCompetitorProductInsights(query)

  return insights.results.map((result) => ({
    title: result.title,
    snippet: result.google_snippet,
    link: result.url,
    position: result.rank_absolute ?? result.rank,
    page_excerpt: result.page_description || result.google_snippet,
    domain: result.domain,
    breadcrumb: result.breadcrumb,
    keywords: result.keywords,
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
  currentFieldValue: string,
  internalLinkCandidates: string[]
) => {
  if (target !== "description") {
    return []
  }

  return [
    "For product description generation, analyze the top 5 competitor results and their page excerpts first.",
    "Compare their strengths and weaknesses, then write a stronger description for this store.",
    "Your response is invalid if it is substantially similar to the current description.",
    DESCRIPTION_STRUCTURE_POLICY,
    `Internal links available for this product (use 3 to 5 only): ${internalLinkCandidates.join(" | ")}`,
    `Current description to improve from only as reference and not for reuse: ${truncate(
      stripHtml(currentFieldValue),
      700
    ) || "N/A"}`,
  ]
}

const buildGenerationPrompt = (input: {
  product: ProductRecord
  searchQuery: string
  target: SeoFieldTarget
  topResults: Awaited<ReturnType<typeof fetchTopSaudiSearchResults>>
  settings: SeoPromptSettings
}) => {
  const product = input.product
  const metadata = (product.metadata || {}) as Record<string, unknown>
  const currentFieldValue = getCurrentFieldValue(product, input.target)
  const internalLinkCandidates = buildInternalLinkCandidates(product)
  const categoryNames = (product.categories || [])
    .map((category) => normalizeText(category.name))
    .filter(Boolean)
    .join(" | ")

  return [
    "You are an elite ecommerce SEO strategist and Arabic product copywriter for a Saudi Arabian vape store.",
    input.settings.global_instructions,
    getFieldPrompt(input.target, input.settings),
    ...buildResponseRules(input.target),
    ...buildTargetSpecificConstraints(
      input.target,
      currentFieldValue,
      internalLinkCandidates
    ),
    "Use the top Saudi Google results and page excerpts as competitive context only. Do not copy them verbatim.",
    "",
    `Target field: ${input.target}`,
    `Product title: ${product.title}`,
    `Product handle: ${product.handle}`,
    `Product type: ${normalizeText(product.type?.value) || "Not specified"}`,
    `Product categories: ${categoryNames || "Not specified"}`,
    `Product collection: ${normalizeText(product.collection?.title) || "Not specified"}`,
    `Store base URL for internal links: ${getStorefrontBaseUrl()}`,
    `Current field value: ${truncate(
      input.target === "description"
        ? stripHtml(currentFieldValue)
        : normalizeText(currentFieldValue),
      1200
    ) || "Not available"}`,
    `Current meta title: ${
      typeof metadata.meta_title === "string"
        ? normalizeText(metadata.meta_title)
        : "Not available"
    }`,
    `Current meta description: ${
      typeof metadata.meta_description === "string"
        ? normalizeText(metadata.meta_description)
        : "Not available"
    }`,
    `Product description excerpt: ${truncate(stripHtml(product.description), 1200) || "Not available"}`,
    `Google Saudi query used: ${input.searchQuery}`,
    "Top Google Saudi results:",
    ...input.topResults.map((result, index) =>
      [
        `Result ${index + 1}:`,
        `Title: ${result.title || "N/A"}`,
        `Snippet: ${result.snippet || "N/A"}`,
        `Link: ${result.link || "N/A"}`,
        `Domain: ${
          typeof (result as { domain?: string }).domain === "string"
            ? (result as { domain?: string }).domain
            : "N/A"
        }`,
        `Breadcrumb: ${
          typeof (result as { breadcrumb?: string }).breadcrumb === "string"
            ? (result as { breadcrumb?: string }).breadcrumb
            : "N/A"
        }`,
        `Page excerpt: ${result.page_excerpt || "N/A"}`,
        `Ranked keywords: ${
          Array.isArray((result as { keywords?: unknown[] }).keywords)
            ? (
                (result as {
                  keywords?: Array<{ keyword?: string; search_volume?: number | null }>
                }).keywords || []
              )
                .slice(0, 10)
                .map(
                  (keyword) =>
                    `${keyword.keyword || "N/A"}${
                      keyword.search_volume ? ` (${keyword.search_volume})` : ""
                    }`
                )
                .join(" | ") || "N/A"
            : "N/A"
        }`,
      ].join("\n")
    ),
  ].join("\n")
}

const parseJsonFromModelResponse = (content: string) => {
  const trimmed = (content || "").trim()

  if (!trimmed) {
    throw new Error("Model returned an empty response.")
  }

  const fenced = trimmed.match(/```json\s*([\s\S]*?)\s*```/i)
  const candidate = fenced?.[1] || trimmed

  try {
    return JSON.parse(candidate) as GeneratedFieldResult
  } catch {
    const firstBrace = candidate.indexOf("{")
    const lastBrace = candidate.lastIndexOf("}")
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const possibleJson = candidate.slice(firstBrace, lastBrace + 1)
      try {
        return JSON.parse(possibleJson) as GeneratedFieldResult
      } catch {
        throw new Error(`Model response was not valid JSON: ${trimmed}`)
      }
    }
    throw new Error(`Model response was not valid JSON: ${trimmed}`)
  }
}

const isInternalLink = (href: string, baseUrl: string) => {
  const value = normalizeText(href)
  if (!value) return false

  if (value.startsWith("/")) {
    return true
  }

  try {
    const linkUrl = new URL(value)
    const base = new URL(baseUrl)
    return linkUrl.hostname === base.hostname
  } catch {
    return false
  }
}

const enforceInternalLinksOnly = (html: string) => {
  const baseUrl = getStorefrontBaseUrl()

  return (html || "").replace(
    /<a\b([^>]*?)href=(["'])(.*?)\2([^>]*)>([\s\S]*?)<\/a>/gi,
    (_fullMatch, beforeHref, quote, href, afterHref, innerHtml) => {
      if (isInternalLink(href, baseUrl)) {
        return `<a${beforeHref}href=${quote}${href}${quote}${afterHref}>${innerHtml}</a>`
      }

      return innerHtml
    }
  )
}

const getProviderApiKey = (settings: SeoAiSettings) => {
  if (settings.provider === "openai") {
    return settings.openai_api_key || normalizeText(process.env.OPENAI_API_KEY)
  }

  if (settings.provider === "deepseek") {
    return settings.deepseek_api_key || normalizeText(process.env.DEEPSEEK_API_KEY)
  }

  return settings.claude_api_key || normalizeText(process.env.CLAUDE_API_KEY)
}

const requestOpenAiCompatible = async (input: {
  endpoint: string
  apiKey: string
  model: string
  prompt: string
  temperature: number
  providerLabel: string
}) => {
  const response = await fetch(input.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify({
      model: input.model,
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
          content: input.prompt,
        },
      ],
      temperature: input.temperature,
    }),
  })

  if (!response.ok) {
    throw new Error(
      `${input.providerLabel} request failed with status ${response.status}: ${await response.text()}`
    )
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
  }

  return payload.choices?.[0]?.message?.content || ""
}

const requestClaude = async (input: {
  apiKey: string
  model: string
  prompt: string
  temperature: number
}) => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": input.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: input.model,
      max_tokens: 1400,
      temperature: input.temperature,
      system:
        "You generate high-performing Arabic ecommerce SEO and product copy for product pages. Always return valid JSON only.",
      messages: [
        {
          role: "user",
          content: input.prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(
      `Claude request failed with status ${response.status}: ${await response.text()}`
    )
  }

  const payload = (await response.json()) as {
    content?: {
      type?: string
      text?: string
    }[]
  }

  return (
    payload.content?.find((item) => item.type === "text")?.text ||
    payload.content?.[0]?.text ||
    ""
  )
}

export const generateSeoFieldWithAI = async (input: {
  product: ProductRecord
  searchQuery: string
  target: SeoFieldTarget
  topResults: Awaited<ReturnType<typeof fetchTopSaudiSearchResults>>
  settings: SeoPromptSettings
  aiSettings?: SeoAiSettings
}) => {
  const aiSettings = sanitizeSeoAiSettings(input.aiSettings || null)
  const providerApiKey = getProviderApiKey(aiSettings)

  if (!providerApiKey) {
    if (aiSettings.provider === "openai") {
      throw new Error("OpenAI API key is required to generate SEO content.")
    }
    if (aiSettings.provider === "deepseek") {
      throw new Error("DeepSeek API key is required to generate SEO content.")
    }
    throw new Error("Claude API key is required to generate SEO content.")
  }

  const prompt = buildGenerationPrompt(input)
  const temperature = input.target === "description" ? 0.9 : 0.7
  const model =
    normalizeText(aiSettings.model) || AI_PROVIDER_MODELS[aiSettings.provider][0]
  const content =
    aiSettings.provider === "openai"
      ? await requestOpenAiCompatible({
          endpoint: "https://api.openai.com/v1/chat/completions",
          apiKey: providerApiKey,
          model,
          prompt,
          temperature,
          providerLabel: "OpenAI",
        })
      : aiSettings.provider === "deepseek"
      ? await requestOpenAiCompatible({
          endpoint: "https://api.deepseek.com/chat/completions",
          apiKey: providerApiKey,
          model,
          prompt,
          temperature,
          providerLabel: "DeepSeek",
        })
      : await requestClaude({
          apiKey: providerApiKey,
          model,
          prompt,
          temperature,
        })

  if (!content) {
    throw new Error("AI provider returned an empty response.")
  }

  const parsed = parseJsonFromModelResponse(content)
  const currentFieldValue = getCurrentFieldValue(input.product, input.target)
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
      : enforceInternalLinksOnly(normalizedContent)

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

export const generateSeoFieldWithOpenAI = async (input: {
  product: ProductRecord
  searchQuery: string
  target: SeoFieldTarget
  topResults: Awaited<ReturnType<typeof fetchTopSaudiSearchResults>>
  settings: SeoPromptSettings
}) =>
  generateSeoFieldWithAI({
    ...input,
    aiSettings: sanitizeSeoAiSettings({
      provider: "openai",
      model: DEFAULT_OPENAI_MODEL,
      openai_api_key: normalizeText(process.env.OPENAI_API_KEY),
      deepseek_api_key: "",
      claude_api_key: "",
    }),
  })

