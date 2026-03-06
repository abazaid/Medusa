import { HttpTypes } from "@medusajs/types"

export type ProductHighlight = {
  key: string
  titleAr: string
  titleEn: string
  value: string
  icon: "vaping" | "bottle" | "nicotine" | "nicotine-type" | "vg" | "battery" | "drop" | "power" | "pod" | "coil"
}

const uniq = (values: string[]) =>
  Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)))

const stripHtml = (value?: string | null) =>
  (value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()

const extractMlValues = (text: string) => {
  const matches = Array.from(text.matchAll(/(\d+(?:\.\d+)?)\s*(?:ml|مل)/gi)).map(
    (m) => `${m[1]}ml`
  )
  return uniq(matches)
}

const extractMah = (text: string) => {
  const match = text.match(/(\d{3,5})\s*mAh/i)
  return match ? `${match[1]} mAh` : ""
}

const extractNicotineStrengths = (text: string) => {
  const values = Array.from(text.matchAll(/(\d{1,2})\s*(?:mg|نيكوتين)/gi)).map(
    (m) => Number(m[1])
  )
  const uniqueSorted = Array.from(new Set(values)).sort((a, b) => a - b)
  return uniqueSorted.length ? uniqueSorted.map((v) => `${v}mg`).join(", ") : ""
}

const extractNicotineStrengthsFromProduct = (product: HttpTypes.StoreProduct) => {
  const values: number[] = []
  const signalText = `${product.title || ""} ${stripHtml(product.description)}`
  const hasNicSignal = /nic|نيكوتين|salt|سولت|freebase|فري/i.test(signalText)

  const parseCandidate = (raw?: string | null) => {
    if (!raw) return
    const matches = Array.from(raw.matchAll(/(\d{1,2})/g)).map((m) => Number(m[1]))
    matches.forEach((value) => {
      if (value >= 1 && value <= 60) {
        values.push(value)
      }
    })
  }

  ;(product.options || []).forEach((option) => {
    const title = (option.title || "").toLowerCase()
    const isNicOption = /nicotine|نيكوتين|mg/i.test(title)
    ;(option.values || []).forEach((v) => {
      if (isNicOption) {
        parseCandidate(v.value)
      }
    })
  })

  ;(product.variants || []).forEach((variant) => {
    if (hasNicSignal) {
      parseCandidate(variant.title)
    }
    ;(variant.options || []).forEach((opt) => parseCandidate(opt.value))
  })

  const uniqueSorted = Array.from(new Set(values)).sort((a, b) => a - b)
  return uniqueSorted.length ? uniqueSorted.map((v) => `${v}mg`).join(", ") : ""
}

const extractRatio = (text: string) => {
  const ratio = text.match(/(\d{2})\s*\/\s*(\d{2})/i)
  if (ratio) return `${ratio[1]}/${ratio[2]}`

  const vgOnly = text.match(/(\d{2,3})\s*%\s*VG/i)
  if (vgOnly) return `${vgOnly[1]}% VG`

  return ""
}

const getCombinedText = (product: HttpTypes.StoreProduct) => {
  const tags = (product.tags || []).map((t) => t.value || "").join(" ")
  const categories = (product.categories || []).map((c) => c.name || "").join(" ")
  const options = (product.options || [])
    .flatMap((o) => (o.values || []).map((v) => v.value || ""))
    .join(" ")
  const variants = (product.variants || []).map((v) => v.title || "").join(" ")
  const metadata = (product.metadata || {}) as Record<string, unknown>
  const metadataHints = [
    metadata.vg_ratio,
    metadata.nicotine_strength,
    metadata.nicotine_type,
    metadata.bottle_size,
    metadata.battery_capacity,
    metadata.pod_capacity,
    metadata.function,
    metadata.pod_style,
    metadata.resistance,
  ]
    .filter(Boolean)
    .join(" ")

  return `${product.title || ""} ${stripHtml(product.description)} ${tags} ${categories} ${options} ${variants} ${metadataHints}`.trim()
}

const inferKind = (textLower: string) => {
  const hasSalt = /(nic salt|nic-salt|salt nicotine|سولت|سالت)/i.test(textLower)
  const hasFreebase = /(freebase|shortfill|فري بيز|شورت فيل|e-liquid|ejuice|e juice)/i.test(textLower)
  const hasLiquid =
    /(نكهة|نكهات|سائل|liquid|juice|flavour|flavor|vape juice|شيشة الكترونية|شيشة إلكترونية)/i.test(
      textLower
    )
  const hasCoil = /(coil|coils|كويل|resistance|ohm|اوم)/i.test(textLower)
  const hasPod = /(pod|pods|بود|cartridge|cartridges)/i.test(textLower)
  const hasReplacement = /(replacement|بديل|spare|refill|قطع غيار|replacement pods)/i.test(textLower)
  const hasDevice = /(kit|device|جهاز|vape kit|pod kit|argus|caliburn|xros|mod|starter kit)/i.test(
    textLower
  )

  if (hasCoil) return "coil"
  if (hasPod && hasReplacement) return "pod-replacement"
  if (hasSalt) return "salt"
  if (hasFreebase) return "freebase"

  // Liquids first: prevent misclassifying flavors as devices.
  if (hasLiquid) {
    if (/(\b50\s*ml\b|\b60\s*ml\b|\b100\s*ml\b|\b120\s*ml\b|50مل|60مل|100مل|120مل)/i.test(textLower)) {
      return "freebase"
    }
    if (/(20mg|25mg|30mg|35mg|40mg|50mg|20 مج|25 مج|30 مج|50 مج)/i.test(textLower)) {
      return "salt"
    }
    return "freebase"
  }

  if (hasDevice) return "device"
  return "generic"
}

export const buildProductHighlights = ({
  product,
  locale,
}: {
  product: HttpTypes.StoreProduct
  locale: "ar" | "en"
}): ProductHighlight[] => {
  const metadata = (product.metadata || {}) as Record<string, unknown>
  const storedHighlights = Array.isArray(metadata.product_highlights)
    ? (metadata.product_highlights as Record<string, unknown>[])
    : []

  if (storedHighlights.length) {
    const normalized = storedHighlights
      .map((item) => ({
        key: String(item.key || "").trim(),
        titleAr: String(item.titleAr || "").trim(),
        titleEn: String(item.titleEn || "").trim(),
        value: String(item.value || "").trim(),
        icon: String(item.icon || "").trim() as ProductHighlight["icon"],
      }))
      .filter((item) => item.key && item.value)

    if (normalized.length) {
      return normalized
    }
  }

  const text = getCombinedText(product)
  const textLower = text.toLowerCase()
  const forcedType = String(metadata.product_type || "").toLowerCase()
  const kind = forcedType || inferKind(textLower)

  const mlValues = extractMlValues(text)
  const bottleSize = mlValues.length ? mlValues[0] : ""
  const podCapacity = mlValues.length > 1 ? mlValues[0] : bottleSize
  const battery = extractMah(text)
  const nicStrength =
    extractNicotineStrengthsFromProduct(product) || extractNicotineStrengths(text)
  const ratio = extractRatio(text)
  const vapingStyle =
    /rdtl/i.test(text)
      ? "MTL & RDTL"
      : /mtl/i.test(text)
        ? "MTL"
        : kind === "freebase"
          ? "DTL"
          : kind === "salt"
            ? "MTL"
            : "-"

  const nicType =
    kind === "salt"
      ? locale === "ar"
        ? "سولت نيكوتين"
        : "Nic Salt"
      : kind === "freebase"
        ? locale === "ar"
          ? "فري بيز"
          : "Freebase"
        : /nic salt/i.test(text)
          ? "Nic Salt"
          : ""

  const functionValue =
    /variable power|قدرة متغيرة|adjustable wattage|watt/i.test(text)
      ? locale === "ar"
        ? "قدرة متغيرة"
        : "Variable Power"
      : locale === "ar"
        ? "تشغيل تلقائي"
        : "Auto Draw"

  const podStyle =
    /refill|refillable|اعادة التعبئة|قابل لإعادة التعبئة/i.test(text)
      ? locale === "ar"
        ? "قابل لإعادة التعبئة"
        : "Refillable"
      : ""

  const resistance =
    Array.from(text.matchAll(/(\d(?:\.\d+)?)\s*Ω/gi)).map((m) => `${m[1]}Ω`)[0] || ""

  if (kind === "salt") {
    return [
      {
        key: "vaping-style",
        titleAr: "طريقة الفيب",
        titleEn: "Vaping Style",
        value: vapingStyle || "MTL",
        icon: "vaping",
      },
      {
        key: "bottle-size",
        titleAr: "حجم العبوة",
        titleEn: "Bottle Size",
        value: bottleSize || "30ml",
        icon: "bottle",
      },
      {
        key: "nicotine-strength",
        titleAr: "قوة النيكوتين",
        titleEn: "Nicotine Strength",
        value: nicStrength || "20mg, 25mg, 50mg",
        icon: "nicotine",
      },
      {
        key: "nicotine-type",
        titleAr: "نوع النيكوتين",
        titleEn: "Nicotine Type",
        value: nicType || (locale === "ar" ? "سولت نيكوتين" : "Nic Salt"),
        icon: "nicotine-type",
      },
      {
        key: "vg-ratio",
        titleAr: "نسبة VG",
        titleEn: "VG Ratio",
        value: ratio || "50/50",
        icon: "vg",
      },
    ]
  }

  if (kind === "freebase") {
    return [
      {
        key: "vaping-style",
        titleAr: "طريقة الفيب",
        titleEn: "Vaping Style",
        value: vapingStyle || "DTL",
        icon: "vaping",
      },
      {
        key: "bottle-size",
        titleAr: "حجم العبوة",
        titleEn: "Bottle Size",
        value: bottleSize || "60ml",
        icon: "bottle",
      },
      {
        key: "nicotine-strength",
        titleAr: "قوة النيكوتين",
        titleEn: "Nicotine Strength",
        value: nicStrength || (locale === "ar" ? "0mg, 3mg, 6mg" : "0mg, 3mg, 6mg"),
        icon: "nicotine",
      },
      {
        key: "vg-ratio",
        titleAr: "نسبة VG",
        titleEn: "VG Ratio",
        value: ratio || "70/30",
        icon: "vg",
      },
    ]
  }

  if (kind === "device") {
    return [
      {
        key: "vaping-style",
        titleAr: "طريقة الفيب",
        titleEn: "Vaping Style",
        value: vapingStyle || "MTL & RDTL",
        icon: "vaping",
      },
      {
        key: "battery",
        titleAr: "سعة البطارية",
        titleEn: "Battery Capacity",
        value: battery || "-",
        icon: "battery",
      },
      {
        key: "capacity",
        titleAr: "سعة السائل",
        titleEn: "E-Liquid Capacity",
        value: podCapacity || "-",
        icon: "drop",
      },
      {
        key: "function",
        titleAr: "الوظيفة",
        titleEn: "Function",
        value: functionValue,
        icon: "power",
      },
      {
        key: "pod-style",
        titleAr: "نوع البود",
        titleEn: "Pod Style",
        value: podStyle || "-",
        icon: "pod",
      },
    ]
  }

  if (kind === "coil") {
    return [
      {
        key: "coil-type",
        titleAr: "نوع الكويل",
        titleEn: "Coil Type",
        value: /mesh/i.test(text) ? "Mesh" : locale === "ar" ? "قياسي" : "Standard",
        icon: "coil",
      },
      {
        key: "resistance",
        titleAr: "المقاومة",
        titleEn: "Resistance",
        value: resistance || "-",
        icon: "nicotine",
      },
      {
        key: "vaping-style",
        titleAr: "طريقة الفيب",
        titleEn: "Vaping Style",
        value: vapingStyle,
        icon: "vaping",
      },
      {
        key: "nicotine-type",
        titleAr: "التوافق",
        titleEn: "Compatibility",
        value: locale === "ar" ? "حسب الجهاز" : "Device dependent",
        icon: "pod",
      },
    ]
  }

  if (kind === "pod-replacement") {
    return [
      {
        key: "capacity",
        titleAr: "سعة البود",
        titleEn: "Pod Capacity",
        value: podCapacity || "2ml",
        icon: "drop",
      },
      {
        key: "resistance",
        titleAr: "المقاومة",
        titleEn: "Resistance",
        value: resistance || "-",
        icon: "nicotine",
      },
      {
        key: "pod-style",
        titleAr: "نوع البود",
        titleEn: "Pod Style",
        value: podStyle || (locale === "ar" ? "قابل لإعادة التعبئة" : "Refillable"),
        icon: "pod",
      },
      {
        key: "function",
        titleAr: "الاستخدام",
        titleEn: "Usage",
        value: locale === "ar" ? "بودات بديلة" : "Replacement Pods",
        icon: "power",
      },
    ]
  }

  return [
    {
      key: "vaping-style",
      titleAr: "طريقة الفيب",
      titleEn: "Vaping Style",
      value: vapingStyle,
      icon: "vaping",
    },
    {
      key: "bottle-size",
      titleAr: "الحجم",
      titleEn: "Size",
      value: bottleSize || "-",
      icon: "bottle",
    },
    {
      key: "nicotine-strength",
      titleAr: "النيكوتين",
      titleEn: "Nicotine",
      value: nicStrength || "-",
      icon: "nicotine",
    },
    {
      key: "vg-ratio",
      titleAr: "النسبة",
      titleEn: "Ratio",
      value: ratio || "-",
      icon: "vg",
    },
  ]
}
