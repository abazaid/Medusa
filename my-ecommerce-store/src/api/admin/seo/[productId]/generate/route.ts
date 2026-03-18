import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  sanitizeSeoAiSettings,
  COUNTRY_CODE,
  DEFAULT_SEO_PROMPT_SETTINGS,
  SeoFieldTarget,
  buildSearchQuery,
  buildSearchQueries,
  getCompetitorProductInsights,
  generateSeoFieldWithAI,
} from "../../../../../modules/seo/engine"

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

type SeoTarget = SeoFieldTarget | "all"

type SeoPayload = {
  target?: string
  preview?: boolean
  content?: string
  fields?: {
    meta_title?: string
    meta_description?: string
    description?: string
  }
}

const ALLOWED_TARGETS: SeoTarget[] = [
  "meta_title",
  "meta_description",
  "description",
  "all",
]

const pickSettings = (metadata?: Record<string, unknown> | null) => {
  const seoSettings =
    metadata && typeof metadata.seo_prompt_settings === "object"
      ? (metadata.seo_prompt_settings as Record<string, unknown>)
      : {}

  return {
    global_instructions:
      typeof seoSettings.global_instructions === "string"
        ? seoSettings.global_instructions
        : DEFAULT_SEO_PROMPT_SETTINGS.global_instructions,
    meta_title_instructions:
      typeof seoSettings.meta_title_instructions === "string"
        ? seoSettings.meta_title_instructions
        : DEFAULT_SEO_PROMPT_SETTINGS.meta_title_instructions,
    meta_description_instructions:
      typeof seoSettings.meta_description_instructions === "string"
        ? seoSettings.meta_description_instructions
        : DEFAULT_SEO_PROMPT_SETTINGS.meta_description_instructions,
    product_description_instructions:
      typeof seoSettings.product_description_instructions === "string"
        ? seoSettings.product_description_instructions
        : DEFAULT_SEO_PROMPT_SETTINGS.product_description_instructions,
  }
}

const pickAiSettings = (metadata?: Record<string, unknown> | null) => {
  const rawAiSettings =
    metadata && typeof metadata.seo_ai_settings === "object"
      ? (metadata.seo_ai_settings as Record<string, unknown>)
      : null

  return sanitizeSeoAiSettings(rawAiSettings)
}

const getCurrentSeoValues = (product: ProductRecord) => {
  const metadata = (product.metadata || {}) as Record<string, unknown>

  return {
    meta_title:
      typeof metadata.meta_title === "string" ? metadata.meta_title : "",
    meta_description:
      typeof metadata.meta_description === "string"
        ? metadata.meta_description
        : "",
    description: product.description || "",
  }
}

const buildNextMetadata = (
  product: ProductRecord,
  fields: {
    meta_title?: string
    meta_description?: string
    description?: string
  }
) => {
  const nextMetadata: Record<string, unknown> = {
    ...(product.metadata || {}),
    seo_last_optimized_at: new Date().toISOString(),
    seo_last_query: buildSearchQuery(product),
    seo_last_country_code: COUNTRY_CODE,
    seo_source: "dataforseo_google_sa_top5_ai",
  }

  if (typeof fields.meta_title === "string") {
    nextMetadata.meta_title = fields.meta_title
    nextMetadata.page_title = fields.meta_title
  }

  if (typeof fields.meta_description === "string") {
    nextMetadata.meta_description = fields.meta_description
    nextMetadata.page_description = fields.meta_description
  }

  return nextMetadata
}

const getStorefrontBaseUrl = () => {
  const explicit =
    process.env.STOREFRONT_BASE_URL ||
    process.env.STORE_FRONTEND_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.STORE_CORS?.split(",")[0]

  return (explicit || "https://vapehubksa.com").trim().replace(/\/+$/, "")
}

const revalidateStorefrontSeo = async (product: ProductRecord) => {
  const secret = process.env.STOREFRONT_REVALIDATE_SECRET

  if (!secret) {
    return
  }

  const endpoint = `${getStorefrontBaseUrl()}/api/revalidate/seo`

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": secret,
      },
      body: JSON.stringify({
        product: {
          title: product.title,
          handle: product.handle,
          metadata: product.metadata || {},
        },
        locales: ["ar"],
      }),
    })
  } catch {
    // Best effort only. SEO save should not fail if storefront revalidation is unavailable.
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    const storeModuleService = req.scope.resolve(Modules.STORE)
    const body = (req.body || {}) as SeoPayload
    const target = body.target as SeoTarget
    const preview = body.preview !== false

    if (!ALLOWED_TARGETS.includes(target)) {
      res.status(400).json({ message: "Invalid SEO target." })
      return
    }

    const productId = req.params.productId
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
        "collection.id",
        "collection.title",
        "collection.handle",
      ],
      filters: {
        id: productId,
      },
    })

    const product = ((data || [])[0] as ProductRecord | undefined) || null

    if (!product) {
      res.status(404).json({ message: "Product not found." })
      return
    }

    const before = getCurrentSeoValues(product)
    const overrideFields = body.fields || {}

    if (!preview && (body.content || Object.keys(overrideFields).length)) {
      const fieldSet =
        target === "all"
          ? {
              meta_title:
                typeof overrideFields.meta_title === "string"
                  ? overrideFields.meta_title
                  : before.meta_title,
              meta_description:
                typeof overrideFields.meta_description === "string"
                  ? overrideFields.meta_description
                  : before.meta_description,
              description:
                typeof overrideFields.description === "string"
                  ? overrideFields.description
                  : before.description,
            }
          : {
              meta_title:
                target === "meta_title"
                  ? typeof body.content === "string"
                    ? body.content
                    : before.meta_title
                  : undefined,
              meta_description:
                target === "meta_description"
                  ? typeof body.content === "string"
                    ? body.content
                    : before.meta_description
                  : undefined,
              description:
                target === "description"
                  ? typeof body.content === "string"
                    ? body.content
                    : before.description
                  : undefined,
            }

      const nextMetadata = buildNextMetadata(product, fieldSet)

      await productModuleService.updateProducts(product.id, {
        ...(typeof fieldSet.description === "string"
          ? { description: fieldSet.description }
          : {}),
        metadata: nextMetadata,
      })

      await revalidateStorefrontSeo({
        ...product,
        metadata: nextMetadata,
        description:
          typeof fieldSet.description === "string"
            ? fieldSet.description
            : product.description,
      })

      res.status(200).json({
        before,
        after: {
          meta_title:
            typeof fieldSet.meta_title === "string"
              ? fieldSet.meta_title
              : before.meta_title,
          meta_description:
            typeof fieldSet.meta_description === "string"
              ? fieldSet.meta_description
              : before.meta_description,
          description:
            typeof fieldSet.description === "string"
              ? fieldSet.description
              : before.description,
        },
        saved: true,
        product: {
          id: product.id,
          meta_title:
            typeof nextMetadata.meta_title === "string"
              ? nextMetadata.meta_title
              : before.meta_title,
          meta_description:
            typeof nextMetadata.meta_description === "string"
              ? nextMetadata.meta_description
              : before.meta_description,
          description:
            typeof fieldSet.description === "string"
              ? fieldSet.description
              : before.description,
          seo_last_optimized_at:
            typeof nextMetadata.seo_last_optimized_at === "string"
              ? nextMetadata.seo_last_optimized_at
              : "",
        },
      })
      return
    }

    const [store] = await storeModuleService.listStores({}, { take: 1 } as any)
    const storeMetadata =
      ((store as any)?.metadata as Record<string, unknown> | null) || null
    const settings = pickSettings(storeMetadata)
    const aiSettings = pickAiSettings(storeMetadata)
    const searchQueries = buildSearchQueries(product)
    const searchQuery = searchQueries[0] || buildSearchQuery(product)

    if (!searchQuery || !searchQueries.length) {
      res
        .status(400)
        .json({ message: "Could not build a search query for this product." })
      return
    }
    let competitorInsights = await getCompetitorProductInsights(searchQuery)

    if (!competitorInsights.results.length && searchQueries.length > 1) {
      for (const fallbackQuery of searchQueries.slice(1)) {
        const fallbackInsights = await getCompetitorProductInsights(fallbackQuery)
        if (fallbackInsights.results.length) {
          competitorInsights = fallbackInsights
          break
        }
      }
    }
    const topResults = competitorInsights.results.map((result) => ({
      title: result.title,
      snippet: result.google_snippet,
      link: result.url,
      position: result.rank_absolute ?? result.rank,
      page_excerpt: result.page_description || result.google_snippet,
      domain: result.domain,
      breadcrumb: result.breadcrumb,
      keywords: result.keywords,
    }))

    if (!topResults.length) {
      res.status(400).json({
        message: `No Saudi competitor results were found for queries: ${searchQueries.join(" | ")}`,
      })
      return
    }

    const generatedFields: {
      meta_title?: string
      meta_description?: string
      description?: string
    } = {}
    const reasonings: Record<string, string> = {}

    const targets: SeoFieldTarget[] =
      target === "all"
        ? ["meta_title", "meta_description", "description"]
        : [target]

    for (const currentTarget of targets) {
      const generated = await generateSeoFieldWithAI({
        product,
        searchQuery,
        target: currentTarget,
        topResults,
        settings,
        aiSettings,
      })

      generatedFields[currentTarget] = generated.content
      reasonings[currentTarget] = generated.reasoning || ""
    }

    const after = {
      meta_title: generatedFields.meta_title ?? before.meta_title,
      meta_description:
        generatedFields.meta_description ?? before.meta_description,
      description: generatedFields.description ?? before.description,
    }

    if (!preview) {
      const nextMetadata = buildNextMetadata(product, generatedFields)
      nextMetadata.seo_top_results = topResults
      nextMetadata.seo_competitor_insights = competitorInsights
      nextMetadata.seo_title_reasoning =
        reasonings.meta_title ||
        (product.metadata as any)?.seo_title_reasoning ||
        null
      nextMetadata.seo_description_reasoning =
        reasonings.meta_description ||
        (product.metadata as any)?.seo_description_reasoning ||
        null
      nextMetadata.seo_product_description_reasoning =
        reasonings.description ||
        (product.metadata as any)?.seo_product_description_reasoning ||
        null

      await productModuleService.updateProducts(product.id, {
        ...(generatedFields.description
          ? { description: generatedFields.description }
          : {}),
        metadata: nextMetadata,
      })

      await revalidateStorefrontSeo({
        ...product,
        metadata: nextMetadata,
        description: generatedFields.description || product.description,
      })
    }

    res.status(200).json({
      before,
      after,
      saved: !preview,
      top_results: topResults,
      competitor_insights: competitorInsights,
      reasoning: reasonings,
      product: {
        id: product.id,
        meta_title: after.meta_title,
        meta_description: after.meta_description,
        description: after.description,
        seo_last_optimized_at: preview ? "" : new Date().toISOString(),
      },
    })
  } catch (error: any) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate SEO content."
    const normalized = message.toLowerCase()

    const statusCode =
      normalized.includes("product not found") ? 404 :
      normalized.includes("invalid seo target") ? 400 :
      normalized.includes("required") ||
      normalized.includes("no saudi competitor results") ||
      normalized.includes("could not build a search query")
        ? 400
        : 500

    res.status(statusCode).json({ message })
  }
}
