import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type ProductRecord = {
  id: string
  title?: string | null
  description?: string | null
  metadata?: Record<string, unknown> | null
  categories?: { name?: string | null; handle?: string | null }[] | null
  tags?: { value?: string | null }[] | null
  options?: { title?: string | null; values?: { value?: string | null }[] | null }[] | null
  variants?: {
    title?: string | null
    options?: { value?: string | null }[] | null
  }[] | null
}

type HighlightIcon =
  | "vaping"
  | "bottle"
  | "nicotine"
  | "nicotine-type"
  | "vg"
  | "battery"
  | "drop"
  | "power"
  | "pod"
  | "coil"

type ProductHighlight = {
  key: string
  titleAr: string
  titleEn: string
  value: string
  icon: HighlightIcon
}

const normalize = (value?: string | null) => (value || "").replace(/\s+/g, " ").trim()
const stripHtml = (value?: string | null) =>
  normalize(
    (value || "")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )

const uniq = (values: string[]) => Array.from(new Set(values.map((v) => normalize(v)).filter(Boolean)))

const extractMl = (text: string) =>
  uniq(Array.from(text.matchAll(/(\d+(?:\.\d+)?)\s*(?:ml|مل)/gi)).map((m) => `${m[1]}ml`))

const extractMah = (text: string) => {
  const m = text.match(/(\d{3,5})\s*mAh/i)
  return m ? `${m[1]} mAh` : ""
}

const extractRatio = (text: string) => {
  const classic = text.match(/(\d{2})\s*\/\s*(\d{2})/i)
  if (classic) return `${classic[1]}/${classic[2]}`

  const fromWords = text.match(/(\d{2,3})\s*%?\s*(?:vg|الجليسرين).{0,30}(\d{2,3})\s*%?\s*(?:pg|بروبيلين)/i)
  if (fromWords) return `${fromWords[1]}/${fromWords[2]}`

  const vgOnly = text.match(/(\d{2,3})\s*%\s*VG/i)
  return vgOnly ? `${vgOnly[1]}% VG` : ""
}

const parseNumberCandidates = (text: string, max = 60) =>
  Array.from(text.matchAll(/(\d{1,2})/g))
    .map((m) => Number(m[1]))
    .filter((n) => n >= 1 && n <= max)

const extractNicotineFromProduct = (product: ProductRecord, text: string) => {
  const values: number[] = []

  const pushFrom = (candidate?: string | null) => {
    if (!candidate) return
    parseNumberCandidates(candidate).forEach((n) => values.push(n))
  }

  ;(product.options || []).forEach((option) => {
    const title = normalize(option.title).toLowerCase()
    const nicOption = /nicotine|نيكوتين|mg/i.test(title)
    ;(option.values || []).forEach((v) => {
      if (nicOption) {
        pushFrom(v.value)
      }
    })
  })

  const hasLiquidSignal = /salt|سولت|freebase|فري|نكهة|liquid|juice/i.test(text)

  ;(product.variants || []).forEach((variant) => {
    if (hasLiquidSignal) {
      pushFrom(variant.title)
    }
    ;(variant.options || []).forEach((o) => pushFrom(o.value))
  })

  // fallback from description patterns
  Array.from(text.matchAll(/(\d{1,2})\s*(?:mg|مجم|نيكوتين)/gi)).forEach((m) => values.push(Number(m[1])))

  const sorted = Array.from(new Set(values)).sort((a, b) => a - b)
  return sorted.length ? sorted.map((n) => `${n}mg`).join(", ") : ""
}

const inferType = (text: string) => {
  const t = text.toLowerCase()

  const hasCoil = /(coil|coils|كويل|اوم|ohm|resistance|mesh)/i.test(t)
  const hasPod = /(pod|pods|بود|cartridge|cart)/i.test(t)
  const hasReplacement = /(replacement|بديل|قطع غيار|spare|pack)/i.test(t)
  const hasSalt = /(nic salt|salt nicotine|سولت|سالت)/i.test(t)
  const hasFree = /(freebase|shortfill|فري بيز|e-liquid|e juice|juice|نكهة|سائل)/i.test(t)
  const hasDevice = /(device|kit|جهاز|mod|starter|vape kit|pod kit|xros|argus|caliburn)/i.test(t)

  if (hasCoil) return "coil"
  if (hasPod && hasReplacement) return "pod-replacement"
  if (hasSalt) return "salt"
  if (hasFree) {
    if (/(20mg|25mg|30mg|35mg|50mg|20 مج|25 مج|30 مج|50 مج)/i.test(t)) return "salt"
    if (/(50\s*ml|60\s*ml|100\s*ml|120\s*ml|50مل|60مل|100مل|120مل)/i.test(t)) return "freebase"
    return "freebase"
  }
  if (hasDevice) return "device"
  if (hasPod) return "pod-replacement"
  return "generic"
}

const getText = (product: ProductRecord) => {
  const title = normalize(product.title)
  const description = stripHtml(product.description)
  const categories = (product.categories || []).map((c) => normalize(c.name || c.handle)).join(" ")
  const tags = (product.tags || []).map((t) => normalize(t.value)).join(" ")
  const options = (product.options || [])
    .map((o) => `${normalize(o.title)} ${(o.values || []).map((v) => normalize(v.value)).join(" ")}`)
    .join(" ")
  const variants = (product.variants || [])
    .map((v) => `${normalize(v.title)} ${(v.options || []).map((o) => normalize(o.value)).join(" ")}`)
    .join(" ")

  const metadata = (product.metadata || {}) as Record<string, unknown>
  const manualHints = [
    metadata.product_type,
    metadata.source_product_kind,
    metadata.source_brand,
    metadata.brand_name_ar,
    metadata.brand_name_en,
  ]
    .filter(Boolean)
    .join(" ")

  return normalize(`${title} ${description} ${categories} ${tags} ${options} ${variants} ${manualHints}`)
}

const buildHighlights = (product: ProductRecord) => {
  const text = getText(product)
  const metadata = (product.metadata || {}) as Record<string, unknown>

  const forcedType = normalize(typeof metadata.product_type === "string" ? metadata.product_type : "")
  const type = forcedType || inferType(text)

  const ml = extractMl(text)
  const bottleSize = ml[0] || ""
  const nic = extractNicotineFromProduct(product, text)
  const ratio = extractRatio(text)
  const battery = extractMah(text)
  const resistance = Array.from(text.matchAll(/(\d(?:\.\d+)?)\s*Ω/gi)).map((m) => `${m[1]}Ω`)[0] || ""

  const vapingStyle =
    /mtl/i.test(text) && /rdtl|dtl/i.test(text)
      ? "MTL & RDTL"
      : /mtl/i.test(text)
        ? "MTL"
        : /rdtl|dtl/i.test(text)
          ? "DTL"
          : type === "salt"
            ? "MTL"
            : type === "freebase"
              ? "DTL"
              : "-"

  const nicType =
    type === "salt" ? "Nic Salt" : type === "freebase" ? "Freebase" : /nic salt/i.test(text) ? "Nic Salt" : "-"

  const functionValue = /variable|watt|power|قدرة/i.test(text) ? "Variable Power" : "Auto Draw"
  const podStyle = /refill|refillable|اعادة التعبئة|قابل لإعادة التعبئة/i.test(text) ? "Refillable" : "-"

  let highlights: ProductHighlight[] = []

  if (type === "salt") {
    highlights = [
      { key: "vaping-style", titleAr: "طريقة الفيب", titleEn: "Vaping Style", value: vapingStyle, icon: "vaping" },
      { key: "bottle-size", titleAr: "حجم العبوة", titleEn: "Bottle Size", value: bottleSize || "30ml", icon: "bottle" },
      { key: "nicotine-strength", titleAr: "قوة النيكوتين", titleEn: "Nicotine Strength", value: nic || "20mg, 25mg, 50mg", icon: "nicotine" },
      { key: "nicotine-type", titleAr: "نوع النيكوتين", titleEn: "Nicotine Type", value: nicType, icon: "nicotine-type" },
      { key: "vg-ratio", titleAr: "نسبة VG", titleEn: "VG Ratio", value: ratio || "50/50", icon: "vg" },
    ]
  } else if (type === "freebase") {
    highlights = [
      { key: "vaping-style", titleAr: "طريقة الفيب", titleEn: "Vaping Style", value: vapingStyle, icon: "vaping" },
      { key: "bottle-size", titleAr: "حجم العبوة", titleEn: "Bottle Size", value: bottleSize || "60ml", icon: "bottle" },
      { key: "nicotine-strength", titleAr: "قوة النيكوتين", titleEn: "Nicotine Strength", value: nic || "0mg, 3mg, 6mg", icon: "nicotine" },
      { key: "nicotine-type", titleAr: "نوع النيكوتين", titleEn: "Nicotine Type", value: "Freebase", icon: "nicotine-type" },
      { key: "vg-ratio", titleAr: "نسبة VG", titleEn: "VG Ratio", value: ratio || "70/30", icon: "vg" },
    ]
  } else if (type === "device") {
    highlights = [
      { key: "vaping-style", titleAr: "طريقة الفيب", titleEn: "Vaping Style", value: vapingStyle || "MTL & RDTL", icon: "vaping" },
      { key: "battery", titleAr: "سعة البطارية", titleEn: "Battery Capacity", value: battery || "-", icon: "battery" },
      { key: "capacity", titleAr: "سعة السائل", titleEn: "E-Liquid Capacity", value: bottleSize || "2ml", icon: "drop" },
      { key: "function", titleAr: "الوظيفة", titleEn: "Function", value: functionValue, icon: "power" },
      { key: "pod-style", titleAr: "نوع البود", titleEn: "Pod Style", value: podStyle, icon: "pod" },
    ]
  } else if (type === "coil") {
    highlights = [
      { key: "coil-type", titleAr: "نوع الكويل", titleEn: "Coil Type", value: /mesh/i.test(text) ? "Mesh" : "Standard", icon: "coil" },
      { key: "resistance", titleAr: "المقاومة", titleEn: "Resistance", value: resistance || "-", icon: "nicotine" },
      { key: "vaping-style", titleAr: "طريقة الفيب", titleEn: "Vaping Style", value: vapingStyle, icon: "vaping" },
      { key: "compatibility", titleAr: "التوافق", titleEn: "Compatibility", value: "Device dependent", icon: "pod" },
    ]
  } else if (type === "pod-replacement") {
    highlights = [
      { key: "capacity", titleAr: "سعة البود", titleEn: "Pod Capacity", value: bottleSize || "2ml", icon: "drop" },
      { key: "resistance", titleAr: "المقاومة", titleEn: "Resistance", value: resistance || "-", icon: "nicotine" },
      { key: "pod-style", titleAr: "نوع البود", titleEn: "Pod Style", value: podStyle || "Refillable", icon: "pod" },
      { key: "function", titleAr: "الاستخدام", titleEn: "Usage", value: "Replacement Pods", icon: "power" },
    ]
  } else {
    highlights = [
      { key: "size", titleAr: "الحجم", titleEn: "Size", value: bottleSize || "-", icon: "bottle" },
      { key: "nicotine", titleAr: "النيكوتين", titleEn: "Nicotine", value: nic || "-", icon: "nicotine" },
    ]
  }

  return {
    type,
    highlights,
    derived: {
      vaping_style: vapingStyle,
      bottle_size: bottleSize,
      nicotine_strength: nic,
      nicotine_type: nicType,
      vg_ratio: ratio,
      battery_capacity: battery,
      resistance,
      pod_style: podStyle,
    },
  }
}

export default async function classifyProductHighlights({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModuleService = container.resolve("product")

  logger.info("Starting product highlights classification for all products...")

  const { data } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "description",
      "metadata",
      "categories.id",
      "categories.name",
      "categories.handle",
      "tags.id",
      "tags.value",
      "options.id",
      "options.title",
      "options.values.id",
      "options.values.value",
      "variants.id",
      "variants.title",
      "variants.options.id",
      "variants.options.value",
    ],
  })

  const products = (data || []) as ProductRecord[]
  let updated = 0
  let skipped = 0
  let failed = 0

  for (const product of products) {
    try {
      const metadata = (product.metadata || {}) as Record<string, unknown>
      const next = buildHighlights(product)

      const nextMetadata = {
        ...metadata,
        product_type: next.type,
        product_highlights: next.highlights,
        product_highlights_source: "script-classify-v1",
        ...next.derived,
      }

      const before = JSON.stringify({
        product_type: metadata.product_type || null,
        product_highlights: metadata.product_highlights || null,
      })
      const after = JSON.stringify({
        product_type: nextMetadata.product_type || null,
        product_highlights: nextMetadata.product_highlights || null,
      })

      if (before === after) {
        skipped += 1
        continue
      }

      await productModuleService.updateProducts(product.id, {
        metadata: nextMetadata,
      })

      updated += 1
    } catch (e) {
      failed += 1
      logger.error(
        `Failed to classify product ${product.id}: ${e instanceof Error ? e.message : "Unknown error"}`
      )
    }
  }

  logger.info(`Product highlights classification complete. Updated=${updated}, Skipped=${skipped}, Failed=${failed}`)
}

