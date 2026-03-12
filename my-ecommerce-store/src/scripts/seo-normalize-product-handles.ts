import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type ProductRecord = {
  id: string
  title: string
  handle: string
}

const normalizeText = (value?: string | null) =>
  (value || "").replace(/\s+/g, " ").trim()

const slugifyEnglish = (value: string) =>
  normalizeText(value)
    .normalize("NFKD")
    .replace(/[\u0600-\u06FF]/g, " ")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")

const extractSeoBase = (title: string, currentHandle: string) => {
  const normalizedTitle = normalizeText(title)
  const englishPart = normalizedTitle
    .split("|")
    .map((part) => part.trim())
    .reverse()
    .find((part) => /[a-zA-Z]/.test(part))

  const fromEnglishPart = slugifyEnglish(englishPart || "")
  if (fromEnglishPart) {
    return fromEnglishPart
  }

  const fromTitle = slugifyEnglish(normalizedTitle)
  if (fromTitle) {
    return fromTitle
  }

  const fromHandle = slugifyEnglish(currentHandle)
  if (fromHandle) {
    return fromHandle
  }

  return ""
}

const ensureUniqueHandle = (
  baseHandle: string,
  originalHandle: string,
  usedHandles: Set<string>
) => {
  if (!baseHandle) {
    baseHandle = "product"
  }

  let nextHandle = baseHandle
  let index = 2

  while (usedHandles.has(nextHandle) && nextHandle !== originalHandle) {
    nextHandle = `${baseHandle}-${index}`
    index += 1
  }

  return nextHandle
}

export default async function seoNormalizeProductHandles({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModuleService = container.resolve("product")

  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle"],
  })

  const products = (data || []) as ProductRecord[]
  const usedHandles = new Set(
    products.map((product) => normalizeText(product.handle).toLowerCase()).filter(Boolean)
  )

  let updatedCount = 0
  let skippedCount = 0
  let failedCount = 0

  for (const product of products) {
    const originalHandle = normalizeText(product.handle).toLowerCase()
    usedHandles.delete(originalHandle)

    const baseHandle = extractSeoBase(product.title, product.handle)
    const nextHandle = ensureUniqueHandle(baseHandle, originalHandle, usedHandles)

    if (!nextHandle || nextHandle === originalHandle) {
      usedHandles.add(originalHandle || nextHandle)
      skippedCount += 1
      continue
    }

    try {
      await productModuleService.updateProducts(product.id, {
        handle: nextHandle,
      })
      usedHandles.add(nextHandle)
      updatedCount += 1
      logger.info(
        `Updated handle: ${product.id} | "${product.handle}" -> "${nextHandle}"`
      )
    } catch (error) {
      usedHandles.add(originalHandle || nextHandle)
      failedCount += 1
      logger.error(
        `Failed to update handle for ${product.id} (${product.title}): ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      )
    }
  }

  logger.info(
    `SEO handle normalization complete. Updated=${updatedCount}, Skipped=${skippedCount}, Failed=${failedCount}`
  )
}

