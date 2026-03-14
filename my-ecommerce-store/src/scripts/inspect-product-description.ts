import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function inspectProductDescription({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const handle = process.env.INSPECT_PRODUCT_HANDLE || ""

  if (!handle) {
    throw new Error("INSPECT_PRODUCT_HANDLE is required.")
  }

  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "description", "metadata"],
    filters: {
      handle,
    },
  })

  const product = (data || [])[0] as
    | {
        id: string
        title: string
        handle: string
        description?: string | null
        metadata?: Record<string, unknown> | null
      }
    | undefined

  if (!product) {
    throw new Error(`Product not found for handle: ${handle}`)
  }

  logger.info(
    JSON.stringify(
      {
        id: product.id,
        title: product.title,
        handle: product.handle,
        seo_source: product.metadata?.seo_source || null,
        seo_generation_mode: product.metadata?.seo_generation_mode || null,
        description_preview: (product.description || "").slice(0, 2500),
      },
      null,
      2
    )
  )
}
