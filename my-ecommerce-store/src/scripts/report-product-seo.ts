import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type ProductRecord = {
  id: string
  title: string
  handle: string
  metadata?: Record<string, unknown> | null
}

const normalizeText = (value?: string | null) =>
  (value || "").replace(/\s+/g, " ").trim()

export default async function reportProductSeo({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "metadata"],
  })

  const products = ((data || []) as ProductRecord[]).map((product) => {
    const metadata = (product.metadata || {}) as Record<string, unknown>

    return {
      id: product.id,
      title: product.title,
      handle: product.handle,
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

  console.log(JSON.stringify(products, null, 2))
}
