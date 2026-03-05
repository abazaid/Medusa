import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  COUNTRY_CODE,
  DEFAULT_SEO_PROMPT_SETTINGS,
  buildSearchQuery,
  fetchTopSaudiSearchResults,
  generateSeoFieldWithOpenAI,
  shouldRefreshSeo,
} from "../modules/seo/engine"

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

const DEFAULT_LOOKBACK_DAYS = Math.max(
  1,
  Number(process.env.SEO_UPDATE_DAYS || "30")
)
const MAX_PRODUCTS_PER_RUN = Math.max(
  1,
  Number(process.env.SEO_MAX_PRODUCTS || "100")
)
const DRY_RUN = process.env.SEO_DRY_RUN === "true"
const FORCE_REFRESH = process.env.SEO_FORCE === "true"

export default async function refreshProductSeo({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModuleService = container.resolve("product")

  logger.info(
    `Starting monthly SEO refresh. lookback_days=${DEFAULT_LOOKBACK_DAYS}, max_products=${MAX_PRODUCTS_PER_RUN}, dry_run=${DRY_RUN}, force=${FORCE_REFRESH}`
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
    ],
  })

  const products = ((data || []) as ProductRecord[])
    .filter((product) => product.title?.trim())
    .filter((product) =>
      shouldRefreshSeo(product.metadata, DEFAULT_LOOKBACK_DAYS, FORCE_REFRESH)
    )
    .slice(0, MAX_PRODUCTS_PER_RUN)

  let updatedCount = 0
  let skippedCount = 0
  let failedCount = 0

  for (const product of products) {
    try {
      const searchQuery = buildSearchQuery(product)

      if (!searchQuery) {
        skippedCount += 1
        logger.warn(`Skipping product ${product.id} because no search query could be built.`)
        continue
      }

      const topResults = await fetchTopSaudiSearchResults(searchQuery)

      if (!topResults.length) {
        skippedCount += 1
        logger.warn(
          `Skipping product ${product.id} because no Saudi Google results were returned for "${searchQuery}".`
        )
        continue
      }

      const titleResult = await generateSeoFieldWithOpenAI({
        product,
        searchQuery,
        target: "meta_title",
        topResults,
        settings: DEFAULT_SEO_PROMPT_SETTINGS,
      })
      const descriptionResult = await generateSeoFieldWithOpenAI({
        product,
        searchQuery,
        target: "meta_description",
        topResults,
        settings: DEFAULT_SEO_PROMPT_SETTINGS,
      })

      const nextMetadata = {
        ...(product.metadata || {}),
        meta_title: titleResult.content,
        page_title: titleResult.content,
        meta_description: descriptionResult.content,
        page_description: descriptionResult.content,
        seo_last_optimized_at: new Date().toISOString(),
        seo_last_query: searchQuery,
        seo_last_country_code: COUNTRY_CODE,
        seo_source: "google_sa_top5_openai",
        seo_title_reasoning: titleResult.reasoning || null,
        seo_description_reasoning: descriptionResult.reasoning || null,
        seo_top_results: topResults,
      }

      if (!DRY_RUN) {
        await productModuleService.updateProducts(product.id, {
          metadata: nextMetadata,
        })
      }

      updatedCount += 1
      logger.info(
        `${DRY_RUN ? "[dry-run] " : ""}SEO refreshed for product ${product.id} (${product.title}).`
      )
    } catch (error) {
      failedCount += 1
      logger.error(
        `SEO refresh failed for product ${product.id} (${product.title}): ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      )
    }
  }

  logger.info(
    `SEO refresh complete. Updated: ${updatedCount}. Skipped: ${skippedCount}. Failed: ${failedCount}.`
  )
}
