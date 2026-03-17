import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  COMPATIBILITY_RULES,
  inferCompatibilityKind,
  normalizeCompatibilityText,
  type CompatibilityKind,
} from "../lib/product-compatibility/rules"

type ProductRecord = {
  id: string
  title?: string | null
  handle?: string | null
  metadata?: Record<string, unknown> | null
  categories?: { name?: string | null; handle?: string | null }[] | null
  type?: { value?: string | null } | null
  tags?: { value?: string | null }[] | null
}

type CompatibilityUpdate = {
  product: ProductRecord
  compatibilityKind: CompatibilityKind
  compatibilityRuleKeys: string[]
  compatibleProducts: ProductRecord[]
}

const parseBooleanArg = (flag: string) => process.argv.includes(flag)

const asString = (value: unknown) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : ""

const uniq = <T,>(values: T[]) => Array.from(new Set(values))

const getProductSearchText = (product: ProductRecord) => {
  const metadata = (product.metadata || {}) as Record<string, unknown>

  return normalizeCompatibilityText(
    [
      product.title,
      product.handle,
      product.type?.value,
      ...(product.categories || []).map((category) => category.name || category.handle),
      ...(product.tags || []).map((tag) => tag.value),
      asString(metadata.product_type),
      asString(metadata.brand_name_ar),
      asString(metadata.brand_name_en),
      asString(metadata.brand_handle),
      asString(metadata.source_brand),
    ]
      .filter(Boolean)
      .join(" ")
  )
}

const getProductKindText = (product: ProductRecord) => {
  return normalizeCompatibilityText(
    [
      product.title,
      product.handle,
      product.type?.value,
    ]
      .filter(Boolean)
      .join(" ")
  )
}

const matchesAnyPattern = (product: ProductRecord, patterns: string[]) => {
  const text = getProductSearchText(product)

  return patterns.some((pattern) =>
    text.includes(normalizeCompatibilityText(pattern))
  )
}

const getCompatibilityKind = (product: ProductRecord) =>
  inferCompatibilityKind(getProductKindText(product))

const sortCompatibleProducts = (
  product: ProductRecord,
  compatibilityKind: CompatibilityKind,
  compatibleProducts: ProductRecord[]
) => {
    const productText = getProductSearchText(product)

  const rankKind = (candidate: ProductRecord) => {
    const candidateKind = getCompatibilityKind(candidate)

    if (compatibilityKind === "device") {
      if (candidateKind === "pod") return 0
      if (candidateKind === "coil") return 1
      return 2
    }

    if (compatibilityKind === "pod") {
      if (candidateKind === "device") return 0
      if (candidateKind === "coil") return 1
      return 2
    }

    if (candidateKind === "device") return 0
    if (candidateKind === "pod") return 1
    return 2
  }

  return [...compatibleProducts].sort((left, right) => {
    const byKind = rankKind(left) - rankKind(right)
    if (byKind !== 0) {
      return byKind
    }

    const leftText = getProductSearchText(left)
    const rightText = getProductSearchText(right)
    const leftShares = productText && leftText.includes(productText) ? -1 : 0
    const rightShares = productText && rightText.includes(productText) ? -1 : 0

    if (leftShares !== rightShares) {
      return leftShares - rightShares
    }

    return asString(left.title).localeCompare(asString(right.title), "ar")
  })
}

const buildCompatibilityUpdates = (products: ProductRecord[]) => {
  const productById = new Map(products.map((product) => [product.id, product]))
  const compatibilityById = new Map<
    string,
    {
      compatibilityKind: CompatibilityKind
      ruleKeys: Set<string>
      compatibleIds: Set<string>
    }
  >()

  const ensureEntry = (product: ProductRecord, compatibilityKind: CompatibilityKind) => {
    const existing = compatibilityById.get(product.id)
    if (existing) {
      if (existing.compatibilityKind === "ignore" && compatibilityKind !== "ignore") {
        existing.compatibilityKind = compatibilityKind
      }
      return existing
    }

    const next = {
      compatibilityKind,
      ruleKeys: new Set<string>(),
      compatibleIds: new Set<string>(),
    }
    compatibilityById.set(product.id, next)
    return next
  }

  for (const product of products) {
    ensureEntry(product, getCompatibilityKind(product))
  }

  for (const rule of COMPATIBILITY_RULES) {
    const devices = products.filter(
      (product) =>
        getCompatibilityKind(product) === "device" &&
        matchesAnyPattern(product, rule.devicePatterns)
    )
    const pods = products.filter(
      (product) =>
        getCompatibilityKind(product) === "pod" &&
        matchesAnyPattern(product, rule.podPatterns || [])
    )
    const coils = products.filter(
      (product) =>
        getCompatibilityKind(product) === "coil" &&
        matchesAnyPattern(product, rule.coilPatterns || [])
    )

    const connect = (source: ProductRecord, targets: ProductRecord[], kind: CompatibilityKind) => {
      const entry = ensureEntry(source, kind)
      entry.ruleKeys.add(rule.key)

      for (const target of targets) {
        if (target.id !== source.id) {
          entry.compatibleIds.add(target.id)
        }
      }
    }

    for (const device of devices) {
      connect(device, [...pods, ...coils], "device")
    }

    for (const pod of pods) {
      connect(pod, [...devices, ...coils], "pod")
    }

    for (const coil of coils) {
      connect(coil, [...devices, ...pods], "coil")
    }
  }

  return products.map<CompatibilityUpdate>((product) => {
    const entry = compatibilityById.get(product.id)!
    const compatibleProducts = sortCompatibleProducts(
      product,
      entry.compatibilityKind,
      uniq(
        [...entry.compatibleIds]
          .map((id) => productById.get(id))
          .filter((candidate): candidate is ProductRecord => Boolean(candidate))
      )
    )

    return {
      product,
      compatibilityKind: entry.compatibilityKind,
      compatibilityRuleKeys: [...entry.ruleKeys].sort(),
      compatibleProducts,
    }
  })
}

export default async function syncProductCompatibility({
  container,
}: ExecArgs) {
  const write = parseBooleanArg("--write")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModuleService = container.resolve(Modules.PRODUCT)

  const { data } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "metadata",
      "type.value",
      "categories.id",
      "categories.name",
      "categories.handle",
      "tags.value",
    ],
    pagination: {
      take: 5000,
      skip: 0,
    },
  })

  const products = ((data || []) as ProductRecord[]).filter(
    (product) => product.id && product.handle
  )

  const updates = buildCompatibilityUpdates(products)
  const impacted = updates.filter(
    (item) =>
      item.compatibilityKind !== "ignore" || item.compatibleProducts.length > 0
  )

  console.log(
    `[compatibility] Analysed ${products.length} products, ${impacted.length} products got compatibility metadata.`
  )

  for (const item of impacted.slice(0, 25)) {
    console.log(
      `[compatibility] ${item.product.title} -> ${item.compatibilityKind} -> ${item.compatibleProducts
        .map((product) => product.title)
        .join(" | ")}`
    )
  }

  if (!write) {
    console.log(
      "[compatibility] Dry run only. Re-run with --write to persist product metadata."
    )
    return
  }

  for (const item of updates) {
    const nextMetadata: Record<string, unknown> = {
      ...(item.product.metadata || {}),
      compatibility_kind: item.compatibilityKind,
      compatibility_rule_keys: item.compatibilityRuleKeys,
      compatible_product_ids: item.compatibleProducts.map((product) => product.id),
      compatible_product_handles: item.compatibleProducts
        .map((product) => asString(product.handle))
        .filter(Boolean),
      compatible_product_titles: item.compatibleProducts
        .map((product) => asString(product.title))
        .filter(Boolean),
    }

    await productModuleService.updateProducts(item.product.id, {
      metadata: nextMetadata,
    })
  }

  console.log(
    `[compatibility] Saved compatibility metadata for ${updates.length} products.`
  )
}
