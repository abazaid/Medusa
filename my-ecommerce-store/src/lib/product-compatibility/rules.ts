export type CompatibilityKind = "device" | "pod" | "coil" | "ignore"

export type ProductCompatibilityRule = {
  key: string
  devicePatterns: string[]
  podPatterns?: string[]
  coilPatterns?: string[]
}

const EXCLUDED_PATTERNS = [
  "salt",
  "سولت",
  "nic salt",
  "nicotine salt",
  "liquid",
  "juice",
  "e-liquid",
  "نكهة",
  "نكهات",
  "سائل",
  "سائل الكتروني",
  "flavor",
  "flavour",
  "case",
  "silicone",
  "جراب",
  "تعليقة",
  "lanyard",
  "charger",
  "usb",
  "cable",
  "cotton",
  "battery only",
]

const STRONG_DEVICE_PATTERNS = [
  "kit",
  "device",
  "جهاز",
  "pod mod",
  "pod system",
  "starter kit",
  "mod",
]

const WEAK_DEVICE_PATTERNS = ["سحبة", "شيشة", "electronic shisha"]

const POD_PATTERNS = [
  "pod",
  "pods",
  "بود",
  "بودات",
  "cartridge",
  "replacement pod",
  "empty pod",
]

const COIL_PATTERNS = [
  "coil",
  "coils",
  "كويل",
  "كويلات",
  "mesh coil",
  "rpm coil",
]

export const COMPATIBILITY_RULES: ProductCompatibilityRule[] = [
  {
    key: "vaporesso-zero",
    devicePatterns: [
      "renova zero",
      "zero care version",
      "zero 2",
      "zero s",
    ],
    podPatterns: [
      "zero pod",
      "zero pods mesh",
      "zero 2 ccell pods",
      "zero 2 mesh pods",
      "zero s replacement pods",
    ],
  },
  {
    key: "vaporesso-xros",
    devicePatterns: [
      "xros kit",
      "xros 2",
      "xros nano",
      "xros 3",
      "xros 3 mini",
      "xros 3 nano",
      "xros pro",
      "xros 4",
      "xros 4 mini",
      "xros 5",
    ],
    podPatterns: ["xros pods"],
  },
  {
    key: "veiik-airo",
    devicePatterns: ["airo kit", "veiik airo"],
    podPatterns: ["airo pods"],
  },
  {
    key: "veiik-airo-pro",
    devicePatterns: ["airo pro"],
    coilPatterns: ["airo pro coil"],
  },
  {
    key: "veiik-dynam",
    devicePatterns: ["veiik dynam", "dynam"],
    podPatterns: ["veiik dynam"],
  },
  {
    key: "uwell-caliburn-core",
    devicePatterns: ["uwell caliburn", "uwell caliburn koko"],
    podPatterns: ["pod caliburn uwell"],
  },
  {
    key: "uwell-caliburn-g",
    devicePatterns: ["caliburn g", "koko prime"],
    podPatterns: ["caliburn g/koko prime replacement pod"],
    coilPatterns: ["caliburn g coils"],
  },
  {
    key: "uwell-caliburn-a2",
    devicePatterns: ["caliburn a2"],
    podPatterns: ["caliburn a2 replacement pods"],
  },
  {
    key: "uwell-caliburn-gpp",
    devicePatterns: [
      "caliburn g5 lite",
      "caliburn g5 lite koko",
      "caliburn g5 lite se",
      "caliburn g3",
      "caliburn g4",
      "caliburn g5",
    ],
    podPatterns: ["caliburn gpp pod", "gpp g3 g4"],
  },
  {
    key: "smok-nord-1",
    devicePatterns: ["smok nord kit"],
    podPatterns: ["nord 1 replacement pod", "nord 1 replacement pod and coils"],
    coilPatterns: ["nord 1 and nord 2 coil"],
  },
  {
    key: "smok-nord-2",
    devicePatterns: ["nord 2 kit"],
    podPatterns: ["nord 2 replacement pods"],
    coilPatterns: ["nord 1 and nord 2 coil"],
  },
  {
    key: "smok-rpm40",
    devicePatterns: ["rpm40 kit", "rpm 40"],
    podPatterns: ["rpm40 replacement pods", "rpm40 pod & coil", "smok rpm40 pod"],
    coilPatterns: ["rpm40 smok rpm coil", "smok rpm coil", "rpm coil"],
  },
  {
    key: "smok-rpm80",
    devicePatterns: ["rpm80 pro kit", "rpm80 kit", "rpm 80"],
    podPatterns: ["rpm80 replacement pods"],
    coilPatterns: ["rpm 80 coil rgc", "rgc"],
  },
]

export const normalizeCompatibilityText = (value?: string | null) =>
  (value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()

const textIncludesAny = (text: string, patterns: string[]) =>
  patterns.some((pattern) => text.includes(normalizeCompatibilityText(pattern)))

export const inferCompatibilityKind = (
  text: string
): CompatibilityKind => {
  if (!text) {
    return "ignore"
  }

  if (textIncludesAny(text, EXCLUDED_PATTERNS)) {
    return "ignore"
  }

  const hasStrongDevice = textIncludesAny(text, STRONG_DEVICE_PATTERNS)
  const hasWeakDevice = textIncludesAny(text, WEAK_DEVICE_PATTERNS)
  const hasPod = textIncludesAny(text, POD_PATTERNS)
  const hasCoil = textIncludesAny(text, COIL_PATTERNS)
  const isExplicitPodDevice =
    text.includes("pod system") ||
    text.includes("pod kit") ||
    text.includes("starter kit") ||
    text.includes(" device ") ||
    text.endsWith(" device") ||
    text.includes(" mod ")

  if (hasPod && hasCoil && !hasStrongDevice) {
    return "pod"
  }

  if (hasCoil) {
    return "coil"
  }

  if (hasStrongDevice && isExplicitPodDevice) {
    return "device"
  }

  if (hasPod) {
    return "pod"
  }

  if (hasStrongDevice) {
    return "device"
  }

  if (hasWeakDevice) {
    return "device"
  }

  return "ignore"
}
