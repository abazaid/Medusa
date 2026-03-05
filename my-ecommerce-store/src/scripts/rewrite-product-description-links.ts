import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type ProductRecord = {
  id: string
  title: string
  handle: string
  description?: string | null
}

type CategoryRecord = {
  id: string
  name: string
  handle?: string | null
  metadata?: Record<string, unknown> | null
}

const COUNTRY_CODE = "sa"

const normalizeText = (value?: string | null) =>
  (value || "")
    .toLowerCase()
    .replace(/%20/g, " ")
    .replace(/[-_/]+/g, " ")
    .replace(/[^\p{Letter}\p{Number}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()

const tokenize = (value?: string | null) =>
  normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 1)

const unique = <T,>(values: T[]) => [...new Set(values)]

const scoreTokenOverlap = (left: string, right: string) => {
  const leftTokens = unique(tokenize(left))
  const rightTokens = new Set(tokenize(right))

  if (!leftTokens.length || !rightTokens.size) {
    return 0
  }

  return leftTokens.reduce((score, token) => {
    return score + (rightTokens.has(token) ? 1 : 0)
  }, 0)
}

const tryDecode = (value: string) => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const stripAnchorKeepText = (anchorHtml: string, innerHtml: string) => {
  const targetAttrs = anchorHtml.match(/\s(?:target|rel|class|style|title)=(".*?"|'.*?')/g)
  void targetAttrs
  return innerHtml
}

export default async function rewriteProductDescriptionLinks({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModuleService = container.resolve("product")

  const { data: productData } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "description"],
  })

  const { data: categoryData } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle", "metadata"],
  })

  const products = ((productData || []) as ProductRecord[]).filter(
    (product) => product.description && product.description.includes("href=")
  )
  const categories = (categoryData || []) as CategoryRecord[]

  const categoryPathMap = new Map<string, string>()
  const categoryNameMap = new Map<string, string>()

  for (const category of categories) {
    const sourceLink =
      typeof category.metadata?.source_page_link === "string"
        ? category.metadata.source_page_link
        : ""

    const categoryHref = category.handle
      ? `/${COUNTRY_CODE}/categories/${category.handle}`
      : ""

    if (!categoryHref) {
      continue
    }

    if (sourceLink) {
      categoryPathMap.set(normalizeText(sourceLink), categoryHref)
    }

    if (category.handle) {
      categoryPathMap.set(normalizeText(category.handle), categoryHref)
    }

    categoryNameMap.set(normalizeText(category.name), categoryHref)
  }

  const findProductHref = (candidate: string, linkText: string) => {
    const candidates = [candidate, linkText].filter(Boolean)
    let bestMatch: ProductRecord | null = null
    let bestScore = 0

    for (const product of products) {
      for (const probe of candidates) {
        const score = Math.max(
          scoreTokenOverlap(probe, product.title),
          scoreTokenOverlap(probe, product.handle)
        )

        if (score > bestScore) {
          bestScore = score
          bestMatch = product
        }
      }
    }

    if (bestMatch && bestScore >= 2) {
      return `/${COUNTRY_CODE}/products/${bestMatch.handle}`
    }

    return null
  }

  const resolveInternalHref = (rawHref: string, linkText: string) => {
    let parsed: URL

    try {
      parsed = new URL(rawHref)
    } catch {
      return null
    }

    const hostname = parsed.hostname.replace(/^www\./, "")

    if (hostname !== "zerovape.store") {
      return rawHref
    }

    const cleanedPath = tryDecode(parsed.pathname)
      .replace(/^\/+/, "")
      .replace(/^ar\//, "")
      .replace(/^en\//, "")
    const segments = cleanedPath.split("/").filter(Boolean)

    if (!segments.length) {
      return null
    }

    const categorySegment = segments.find((segment) => /^c\d+$/i.test(segment))
      ? segments[segments.findIndex((segment) => /^c\d+$/i.test(segment)) - 1]
      : null

    if (categorySegment) {
      const key = normalizeText(categorySegment)
      return (
        categoryPathMap.get(key) ||
        categoryNameMap.get(key) ||
        null
      )
    }

    const productIndex = segments.findIndex((segment) => /^p\d+$/i.test(segment))

    if (productIndex > 0) {
      const slugSegment = segments[productIndex - 1]
      return findProductHref(slugSegment, linkText)
    }

    if (/^page-\d+$/i.test(segments[segments.length - 1])) {
      return null
    }

    if (segments.length === 1 && /^[a-z0-9]+$/i.test(segments[0])) {
      return null
    }

    return findProductHref(segments[segments.length - 1], linkText)
  }

  let updatedCount = 0
  let relinkedCount = 0
  let removedCount = 0

  for (const product of products) {
    const originalDescription = product.description || ""
    let changed = false

    const nextDescription = originalDescription.replace(
      /<a\b([^>]*)href=(["'])(.*?)\2([^>]*)>([\s\S]*?)<\/a>/gi,
      (fullMatch, beforeHref, _quote, href, afterHref, innerHtml) => {
        const resolvedHref = resolveInternalHref(href, innerHtml.replace(/<[^>]+>/g, " "))

        if (resolvedHref === href) {
          return fullMatch
        }

        changed = true

        if (!resolvedHref) {
          removedCount += 1
          return stripAnchorKeepText(fullMatch, innerHtml)
        }

        relinkedCount += 1

        const preservedAttrs = `${beforeHref || ""}${afterHref || ""}`
          .replace(/\s*href=(["']).*?\1/gi, "")
          .replace(/\s*target=(["']).*?\1/gi, "")
          .replace(/\s*rel=(["']).*?\1/gi, "")

        return `<a${preservedAttrs} href="${resolvedHref}">${innerHtml}</a>`
      }
    )

    if (!changed || nextDescription === originalDescription) {
      continue
    }

    await productModuleService.updateProducts(product.id, {
      description: nextDescription,
    })

    updatedCount += 1
  }

  logger.info(
    `Description link rewrite complete. Updated products: ${updatedCount}. Relinked anchors: ${relinkedCount}. Removed stale internal anchors: ${removedCount}.`
  )
}
