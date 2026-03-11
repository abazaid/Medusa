import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  AI_PROVIDER_MODELS,
  DEFAULT_SEO_PROMPT_SETTINGS,
  sanitizeSeoAiSettings,
  normalizeText,
} from "../../../modules/seo/engine"

type ProductRecord = {
  id: string
  title: string
  handle: string
  description?: string | null
  metadata?: Record<string, unknown> | null
  variants?: {
    inventory_quantity?: number | null
    allow_backorder?: boolean | null
    manage_inventory?: boolean | null
  }[] | null
}

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

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const storeModuleService = req.scope.resolve(Modules.STORE)

  const { data } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "description",
      "metadata",
      "variants.id",
      "variants.inventory_quantity",
      "variants.allow_backorder",
      "variants.manage_inventory",
    ],
  })

  const products = ((data || []) as ProductRecord[]).map((product) => {
    const metadata = (product.metadata || {}) as Record<string, unknown>
    const variants = product.variants || []
    const inStock = variants.some((variant) => {
      const inventoryQuantity =
        typeof variant.inventory_quantity === "number"
          ? variant.inventory_quantity
          : 0
      const allowBackorder = variant.allow_backorder === true
      const manageInventory = variant.manage_inventory === true

      if (allowBackorder) {
        return true
      }

      if (!manageInventory) {
        return true
      }

      return inventoryQuantity > 0
    })
    const seoLastOptimizedAt =
      typeof metadata.seo_last_optimized_at === "string"
        ? metadata.seo_last_optimized_at
        : ""

    return {
      id: product.id,
      title: product.title,
      handle: product.handle,
      description: product.description || "",
      meta_title:
        typeof metadata.meta_title === "string"
          ? normalizeText(metadata.meta_title)
          : "",
      meta_description:
        typeof metadata.meta_description === "string"
          ? normalizeText(metadata.meta_description)
          : "",
      seo_last_optimized_at: seoLastOptimizedAt,
      is_optimized: Boolean(seoLastOptimizedAt),
      in_stock: inStock,
    }
  })

  const [store] = await storeModuleService.listStores({}, { take: 1 } as any)
  const settings = pickSettings(
    ((store as any)?.metadata as Record<string, unknown> | null) || null
  )
  const ai_settings = pickAiSettings(
    ((store as any)?.metadata as Record<string, unknown> | null) || null
  )

  res.status(200).json({
    products,
    settings,
    ai_settings,
    ai_provider_models: AI_PROVIDER_MODELS,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const storeModuleService = req.scope.resolve(Modules.STORE)
  const body = (req.body || {}) as Record<string, unknown>
  const [store] = await storeModuleService.listStores({}, { take: 1 } as any)

  if (!store?.id) {
    res.status(404).json({ message: "Store not found." })
    return
  }

  const currentMetadata =
    (((store as any).metadata as Record<string, unknown> | null) || {})
  const nextSettings = {
    global_instructions:
      typeof body.global_instructions === "string"
        ? body.global_instructions
        : DEFAULT_SEO_PROMPT_SETTINGS.global_instructions,
    meta_title_instructions:
      typeof body.meta_title_instructions === "string"
        ? body.meta_title_instructions
        : DEFAULT_SEO_PROMPT_SETTINGS.meta_title_instructions,
    meta_description_instructions:
      typeof body.meta_description_instructions === "string"
        ? body.meta_description_instructions
        : DEFAULT_SEO_PROMPT_SETTINGS.meta_description_instructions,
    product_description_instructions:
      typeof body.product_description_instructions === "string"
        ? body.product_description_instructions
        : DEFAULT_SEO_PROMPT_SETTINGS.product_description_instructions,
  }
  const nextAiSettings = sanitizeSeoAiSettings({
    provider: body.ai_provider,
    model: body.ai_model,
    openai_api_key: body.openai_api_key,
    deepseek_api_key: body.deepseek_api_key,
    claude_api_key: body.claude_api_key,
  } as Record<string, unknown>)

  const updatedStore = await storeModuleService.updateStores(store.id, {
    metadata: {
      ...currentMetadata,
      seo_prompt_settings: nextSettings,
      seo_ai_settings: nextAiSettings,
    },
  })

  res.status(200).json({
    settings: pickSettings(
      ((updatedStore as any)?.metadata as Record<string, unknown> | null) || null
    ),
    ai_settings: pickAiSettings(
      ((updatedStore as any)?.metadata as Record<string, unknown> | null) || null
    ),
    ai_provider_models: AI_PROVIDER_MODELS,
  })
}
