import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  DEFAULT_SEO_PROMPT_SETTINGS,
  normalizeText,
} from "../../../modules/seo/engine"

type ProductRecord = {
  id: string
  title: string
  handle: string
  description?: string | null
  metadata?: Record<string, unknown> | null
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

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const storeModuleService = req.scope.resolve(Modules.STORE)

  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "description", "metadata"],
  })

  const products = ((data || []) as ProductRecord[]).map((product) => {
    const metadata = (product.metadata || {}) as Record<string, unknown>

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
      seo_last_optimized_at:
        typeof metadata.seo_last_optimized_at === "string"
          ? metadata.seo_last_optimized_at
          : "",
    }
  })

  const [store] = await storeModuleService.listStores({}, { take: 1 } as any)
  const settings = pickSettings(
    ((store as any)?.metadata as Record<string, unknown> | null) || null
  )

  res.status(200).json({
    products,
    settings,
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

  const updatedStore = await storeModuleService.updateStores(store.id, {
    metadata: {
      ...currentMetadata,
      seo_prompt_settings: nextSettings,
    },
  })

  res.status(200).json({
    settings: pickSettings(
      ((updatedStore as any)?.metadata as Record<string, unknown> | null) || null
    ),
  })
}
