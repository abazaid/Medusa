import fs from "fs"
import os from "os"
import path from "path"
import { execFileSync } from "child_process"

import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils"
import {
  createProductsWorkflow,
  deleteProductsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows"

const DEFAULT_OPTION_TITLE = "Title"
const DEFAULT_OPTION_VALUE = "Default"

const OPTION_COLUMN_GROUPS = [
  { name: "AF", value: "AH" },
  { name: "AJ", value: "AL" },
  { name: "AN", value: "AP" },
  { name: "AR", value: "AT" },
  { name: "AV", value: "AX" },
  { name: "AZ", value: "BB" },
  { name: "BD", value: "BF" },
  { name: "BH", value: "BJ" },
  { name: "BL", value: "BN" },
  { name: "BP", value: "BR" },
] as const

type ContainerLike = {
  resolve: (key: string) => any
}

type SheetRow = Record<string, string>

type SourceProduct = {
  productRow: SheetRow
  variantRows: SheetRow[]
}

type CategoryRecord = {
  id: string
  name: string
  parent_category_id?: string | null
}

type InventoryLevelInput = {
  inventory_item_id: string
  location_id: string
  stocked_quantity: number
}

type BrandRecord = {
  handle: string
  nameAr: string
  nameEn: string
}

type ImportOptions = {
  container: ContainerLike
  filePath: string
  replaceAll?: boolean
  skipExistingSkus?: boolean
}

type ImportSummary = {
  deletedProducts: number
  createdProducts: number
  createdVariants: number
  skippedProducts: number
  skippedSkus: string[]
}

const BRAND_RECORDS: BrandRecord[] = [
  { handle: "vgod", nameAr: "فيقود - VGOD", nameEn: "VGOD" },
  { handle: "nasty-juice", nameAr: "ناستي Nasty Juice", nameEn: "Nasty Juice" },
  { handle: "uwell", nameAr: "يو ويل Uwell", nameEn: "Uwell" },
  { handle: "gummy", nameAr: "قمي - GUMMY", nameEn: "GUMMY" },
  { handle: "vaporesso", nameAr: "فابريسو Vaporesso", nameEn: "Vaporesso" },
  { handle: "geekvape", nameAr: "جيك فيب Geekvape", nameEn: "Geekvape" },
  { handle: "samsvape", nameAr: "سامز فيب SamsVape", nameEn: "SamsVape" },
  { handle: "dr-vape", nameAr: "دكتور فيب Dr Vape", nameEn: "Dr Vape" },
  { handle: "mazaj", nameAr: "مزاج - Mazaj", nameEn: "Mazaj" },
  { handle: "smok", nameAr: "سموك SMOK", nameEn: "SMOK" },
  { handle: "voopoo", nameAr: "فوبو VooPoo", nameEn: "VooPoo" },
  { handle: "professor-vape", nameAr: "البروفيسور فيب", nameEn: "Professor Vape" },
  { handle: "myle", nameAr: "مايلي Myle", nameEn: "Myle" },
  { handle: "loko-lab", nameAr: "لوكو لاب Loko Lab", nameEn: "Loko Lab" },
  { handle: "joosy-world", nameAr: "جوسي ورلد JOOSY WORLD", nameEn: "JOOSY WORLD" },
  { handle: "rincoe", nameAr: "رينكو Rincoe", nameEn: "Rincoe" },
  { handle: "mega-vape", nameAr: "ميجا فيب - Mega Vape", nameEn: "Mega Vape" },
  { handle: "cv", nameAr: "نكهات CV", nameEn: "CV" },
  { handle: "ghost-vapes", nameAr: "قوست فيب GHOST VAPES", nameEn: "GHOST VAPES" },
  { handle: "diapple", nameAr: "ديابل Diapple", nameEn: "Diapple" },
  { handle: "ripe-vapes", nameAr: "ريب فيب RIPE VAPES", nameEn: "RIPE VAPES" },
  { handle: "roll-upz", nameAr: "رول ابز Roll Upz", nameEn: "Roll Upz" },
  { handle: "ecigara", nameAr: "نكهات اي سيجاره eCigara", nameEn: "eCigara" },
  { handle: "cloud-breakers", nameAr: "كلاود بريكرز Cloud Breakers", nameEn: "Cloud Breakers" },
  { handle: "bazooka", nameAr: "بازوكا BAZOOKA", nameEn: "BAZOOKA" },
  { handle: "i-love-salt", nameAr: "اي لوف سولت I Love Salt", nameEn: "I Love Salt" },
  { handle: "naked-100", nameAr: "نيكيد Naked 100", nameEn: "Naked 100" },
  { handle: "al-fakher", nameAr: "الفاخر Al Fakher", nameEn: "Al Fakher" },
  { handle: "bomb", nameAr: "بومب BOMB", nameEn: "BOMB" },
  { handle: "elf-bar", nameAr: "الف بار Elf Bar", nameEn: "Elf Bar" },
  { handle: "air-bar", nameAr: "اير بار AIR BAR", nameEn: "AIR BAR" },
  { handle: "raw", nameAr: "راو - RAW", nameEn: "RAW" },
  { handle: "ubbs", nameAr: "اوبس - Ubbs", nameEn: "Ubbs" },
  { handle: "velo", nameAr: "فيلو - VELO", nameEn: "VELO" },
  { handle: "my-shisha", nameAr: "ماي شيشة - My Shisha", nameEn: "My Shisha" },
  { handle: "ruthless", nameAr: "روثلس - Ruthless", nameEn: "Ruthless" },
  { handle: "loaded", nameAr: "لوديد - Loaded", nameEn: "Loaded" },
  { handle: "white-fox", nameAr: "وايت فوكس - White Fox", nameEn: "White Fox" },
  { handle: "oxva", nameAr: "اوكسفا - OXVA", nameEn: "OXVA" },
  { handle: "ocean-vape", nameAr: "اوشن فيب - Ocean Vape", nameEn: "Ocean Vape" },
  { handle: "efest", nameAr: "ايفست - Efest", nameEn: "Efest" },
  { handle: "juul", nameAr: "جول - JUUL", nameEn: "JUUL" },
  { handle: "juicy", nameAr: "جوسي - Juicy", nameEn: "Juicy" },
  { handle: "voug", nameAr: "فوج - VOUG", nameEn: "VOUG" },
  { handle: "phix", nameAr: "فيكس - PHIX", nameEn: "PHIX" },
  { handle: "romana", nameAr: "رمانه - ROMANA", nameEn: "ROMANA" },
  { handle: "kiwi", nameAr: "كيوي - KIWI", nameEn: "KIWI" },
]

const escapePowerShellString = (value: string) => value.replace(/'/g, "''")

const decodeXmlEntities = (value: string) =>
  value
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, decimal) =>
      String.fromCodePoint(parseInt(decimal, 10))
    )
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")

const stripXmlTags = (value: string) => value.replace(/<[^>]+>/g, "")

const normalizeText = (value?: string | null) =>
  (value || "").replace(/\s+/g, " ").trim()

const normalizeKey = (value?: string | null) =>
  normalizeText(value).toLowerCase()

const normalizeBrandKey = (value?: string | null) =>
  normalizeText(value)
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .toLowerCase()

const parseNumber = (value?: string | null) => {
  const normalized = normalizeText(value)
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

const parseInteger = (value?: string | null) => {
  const parsed = parseNumber(value)
  if (parsed === null) return null
  return Math.max(0, Math.trunc(parsed))
}

const parseBoolean = (value?: string | null) => {
  const normalized = normalizeKey(value)
  if (!normalized) return undefined
  if (["نعم", "yes", "true", "1"].includes(normalized)) return true
  if (["لا", "no", "false", "0"].includes(normalized)) return false
  return undefined
}

const normalizeWeight = (value?: string | null, unit?: string | null) => {
  const parsed = parseNumber(value)
  if (parsed === null) return undefined
  const normalizedUnit = normalizeKey(unit)
  if (normalizedUnit === "kg") return Math.round(parsed * 1000)
  if (normalizedUnit === "g") return Math.round(parsed)
  return parsed
}

const makeAsciiHandle = (title: string, fallback: string) => {
  const asciiSlug = title
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  const normalizedFallback = fallback.toLowerCase().replace(/[^a-z0-9]+/g, "-")

  if (asciiSlug) {
    return `${asciiSlug}-${normalizedFallback}`.replace(/-+/g, "-")
  }

  return normalizedFallback || `product-${Date.now()}`
}

const stripHtml = (value?: string | null) =>
  normalizeText(
    decodeXmlEntities(
      (value || "")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<iframe[\s\S]*?<\/iframe>/gi, " ")
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<\/p>/gi, " ")
        .replace(/<[^>]+>/g, " ")
    )
  )

const toMetaDescription = (row: SheetRow) => {
  const base =
    stripHtml(row.J) ||
    normalizeText(row.X) ||
    normalizeText(row.C) ||
    "منتج فيب أصلي مع شحن سريع داخل السعودية."

  return base.length > 320 ? `${base.slice(0, 317)}...` : base
}

const getCurrentPrice = (row: SheetRow) => {
  const regular = parseNumber(row.H)
  const discounted = parseNumber(row.N)
  if (
    discounted !== null &&
    discounted > 0 &&
    (regular === null || discounted < regular)
  ) {
    return discounted
  }
  return regular ?? discounted ?? 0
}

const parseImageList = (value?: string | null) =>
  (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

const extractSharedStrings = (xml: string) => {
  const strings: string[] = []
  const sharedStringMatches = xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)

  for (const match of sharedStringMatches) {
    const text = [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
      .map((part) => decodeXmlEntities(stripXmlTags(part[1])))
      .join("")

    strings.push(text)
  }

  return strings
}

const extractRows = (xml: string, sharedStrings: string[]) => {
  const rows: SheetRow[] = []
  const rowMatches = xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)

  for (const rowMatch of rowMatches) {
    const row: SheetRow = {}
    const cellMatches = rowMatch[1].matchAll(
      /<c\b([^>]*?)(?:>([\s\S]*?)<\/c>|\/>)/g
    )

    for (const cellMatch of cellMatches) {
      const attributes = cellMatch[1]
      const inner = cellMatch[2] || ""
      const reference = /r="([A-Z]+)\d+"/.exec(attributes)?.[1]

      if (!reference) continue

      const type = /t="([^"]+)"/.exec(attributes)?.[1]
      let value = ""

      if (type === "s") {
        const index = Number(/<v>([\s\S]*?)<\/v>/.exec(inner)?.[1] || "")
        value = sharedStrings[index] || ""
      } else if (type === "inlineStr") {
        value = [...inner.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
          .map((part) => decodeXmlEntities(stripXmlTags(part[1])))
          .join("")
      } else {
        value = decodeXmlEntities(/<v>([\s\S]*?)<\/v>/.exec(inner)?.[1] || "")
      }

      row[reference] = value
    }

    rows.push(row)
  }

  return rows
}

const readWorkbookRows = (filePath: string) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Import file not found: ${filePath}`)
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "medusa-product-import-"))
  const extractDir = path.join(tempDir, "xlsx")

  try {
    execFileSync(
      "powershell",
      [
        "-NoProfile",
        "-Command",
        [
          "Add-Type -AssemblyName System.IO.Compression.FileSystem",
          `[System.IO.Compression.ZipFile]::ExtractToDirectory('${escapePowerShellString(
            filePath
          )}', '${escapePowerShellString(extractDir)}')`,
        ].join("; "),
      ],
      { stdio: "pipe" }
    )

    const sharedStringsXml = fs.readFileSync(
      path.join(extractDir, "xl", "sharedStrings.xml"),
      "utf8"
    )
    const sheetXml = fs.readFileSync(
      path.join(extractDir, "xl", "worksheets", "sheet1.xml"),
      "utf8"
    )

    const sharedStrings = extractSharedStrings(sharedStringsXml)
    return extractRows(sheetXml, sharedStrings)
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

const buildSourceProducts = (rows: SheetRow[]) => {
  const dataRows = rows.slice(1)
  const products: SourceProduct[] = []
  let current: SourceProduct | null = null

  for (const row of dataRows) {
    if (normalizeText(row.D)) {
      current = {
        productRow: row,
        variantRows: [],
      }
      products.push(current)
      continue
    }

    if (current) {
      current.variantRows.push(row)
    }
  }

  return products
}

const buildCategoryMaps = (categories: CategoryRecord[]) => {
  const byId = new Map(categories.map((category) => [category.id, category]))
  const pathCache = new Map<string, string>()
  const byPath = new Map<string, string>()
  const byName = new Map<string, string>()

  const getPath = (category: CategoryRecord): string => {
    const cached = pathCache.get(category.id)
    if (cached) return cached
    const ownName = normalizeText(category.name)
    const parentId = category.parent_category_id || undefined
    const parent = parentId ? byId.get(parentId) : undefined
    const fullPath = parent ? `${getPath(parent)} > ${ownName}` : ownName
    pathCache.set(category.id, fullPath)
    return fullPath
  }

  for (const category of categories) {
    const nameKey = normalizeKey(category.name)
    const pathKey = normalizeKey(getPath(category))
    if (nameKey && !byName.has(nameKey)) byName.set(nameKey, category.id)
    if (pathKey) byPath.set(pathKey, category.id)
  }

  return { byName, byPath }
}

const resolveCategoryIds = (
  rawValue: string,
  categoryMaps: ReturnType<typeof buildCategoryMaps>
) => {
  const ids = new Set<string>()
  const values = rawValue
    .split(",")
    .map((item) => normalizeText(item))
    .filter(Boolean)

  for (const value of values) {
    const fullPathKey = normalizeKey(value)
    const directPathMatch = categoryMaps.byPath.get(fullPathKey)

    if (directPathMatch) {
      ids.add(directPathMatch)
      continue
    }

    const leaf = normalizeText(value.split(">").pop())
    const leafMatch = categoryMaps.byName.get(normalizeKey(leaf))
    if (leafMatch) {
      ids.add(leafMatch)
    }
  }

  return [...ids]
}

const resolveBrandRecord = (value?: string | null) => {
  const normalized = normalizeBrandKey(value)
  if (!normalized) return undefined

  const exactMatch = BRAND_RECORDS.find((brand) =>
    [brand.handle, brand.nameAr, brand.nameEn]
      .map((candidate) => normalizeBrandKey(candidate))
      .includes(normalized)
  )

  if (exactMatch) return exactMatch

  return BRAND_RECORDS.find((brand) =>
    [brand.handle, brand.nameAr, brand.nameEn]
      .map((candidate) => normalizeBrandKey(candidate))
      .some(
        (candidate) =>
          candidate &&
          (normalized.includes(candidate) || candidate.includes(normalized))
      )
  )
}

const collectVariantSkus = (sourceProduct: SourceProduct) => {
  const row = sourceProduct.productRow
  const baseSku = normalizeText(row.L) || `SKU-${normalizeText(row.A)}`
  const hasVariantRows = sourceProduct.variantRows.length > 0
  const rowsForVariants = hasVariantRows
    ? sourceProduct.variantRows
    : [sourceProduct.productRow]

  return rowsForVariants
    .map((variantRow, index) =>
      normalizeText(variantRow.L) ||
      `${baseSku}-${String(index + 1).padStart(2, "0")}`
    )
    .filter(Boolean)
}

export const importProductsFromWorkbook = async ({
  container,
  filePath,
  replaceAll = false,
  skipExistingSkus = true,
}: ImportOptions): Promise<ImportSummary> => {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModuleService = container.resolve(Modules.PRODUCT)
  const inventoryModuleService = container.resolve(Modules.INVENTORY)
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const storeModuleService = container.resolve(Modules.STORE)
  const stockLocationModuleService = container.resolve(Modules.STOCK_LOCATION)

  logger.info(`Reading product import file: ${filePath}`)

  const workbookRows = readWorkbookRows(filePath)
  const sourceProducts = buildSourceProducts(workbookRows)

  if (!sourceProducts.length) {
    throw new Error("No products were found in the workbook.")
  }

  let deletedProducts = 0

  if (replaceAll) {
    const { data: existingProducts } = await query.graph({
      entity: "product",
      fields: ["id"],
    })

    const existingProductIds = (existingProducts || [])
      .map((product: any) => product.id as string)
      .filter(Boolean)

    deletedProducts = existingProductIds.length

    if (existingProductIds.length) {
      await deleteProductsWorkflow(container as any).run({
        input: {
          ids: existingProductIds,
        },
      })
    }

    const existingInventoryLevels = await inventoryModuleService.listInventoryLevels(
      {},
      { take: 5000 } as any
    )
    const existingInventoryLevelIds = existingInventoryLevels
      .map((level: any) => level.id as string)
      .filter(Boolean)

    if (existingInventoryLevelIds.length) {
      await inventoryModuleService.deleteInventoryLevels(existingInventoryLevelIds)
    }

    const existingInventoryItems = await inventoryModuleService.listInventoryItems(
      {},
      { take: 5000 } as any
    )
    const existingInventoryItemIds = existingInventoryItems
      .map((item: any) => item.id as string)
      .filter(Boolean)

    if (existingInventoryItemIds.length) {
      await inventoryModuleService.deleteInventoryItems(existingInventoryItemIds)
    }
  }

  const currentInventoryItems = await inventoryModuleService.listInventoryItems(
    {},
    { take: 10000 } as any
  )
  const existingSkuSet = new Set(
    currentInventoryItems
      .map((item: any) => normalizeKey(item.sku as string))
      .filter(Boolean)
  )

  const { data: categoryData } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "parent_category_id"],
  })

  const categoryMaps = buildCategoryMaps((categoryData || []) as CategoryRecord[])

  const [store] = await storeModuleService.listStores()
  const defaultSalesChannelId =
    (store as any)?.default_sales_channel_id ||
    (await salesChannelModuleService.listSalesChannels())[0]?.id
  const defaultLocationId =
    (store as any)?.default_location_id ||
    (await stockLocationModuleService.listStockLocations({}))[0]?.id
  const shippingProfile =
    (await fulfillmentModuleService.listShippingProfiles({ type: "default" }))[0]

  if (!defaultSalesChannelId) {
    throw new Error("No sales channel is available for product import.")
  }

  if (!defaultLocationId) {
    throw new Error("No stock location is available for product import.")
  }

  if (!shippingProfile?.id) {
    throw new Error("No default shipping profile is available for product import.")
  }

  // Ensure inventory in the default stock location is visible on the storefront sales channel.
  // If this link is missing, variants return inventory_quantity=0 in Store API responses.
  try {
    await linkSalesChannelsToStockLocationWorkflow(container as any).run({
      input: {
        id: defaultLocationId,
        add: [defaultSalesChannelId],
      },
    })
  } catch (error) {
    logger.warn(
      `Could not link sales channel "${defaultSalesChannelId}" to stock location "${defaultLocationId}": ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    )
  }

  const storeCurrencies =
    ((store as any)?.supported_currencies as
      | { currency_code: string; is_default?: boolean }[]
      | undefined) || []
  const defaultCurrency =
    storeCurrencies.find((currency) => currency.is_default)?.currency_code ||
    storeCurrencies[0]?.currency_code ||
    "sar"

  let createdProductsCount = 0
  let createdVariantsCount = 0
  let skippedProductsCount = 0
  const skippedSkus: string[] = []

  const existingTypes = await productModuleService.listProductTypes(
    {},
    { take: 200 } as any
  )
  const typeIdByValue = new Map(
    existingTypes.map((type: any) => [normalizeKey(type.value), type.id as string])
  )

  const ensureTypeId = async (value: string) => {
    const normalized = normalizeKey(value)
    if (!normalized) return undefined
    const existingId = typeIdByValue.get(normalized)
    if (existingId) return existingId
    const createdType = await productModuleService.createProductTypes({ value })
    typeIdByValue.set(normalized, createdType.id)
    return createdType.id
  }

  for (const sourceProduct of sourceProducts) {
    const row = sourceProduct.productRow
    const title = normalizeText(row.C)
    const candidateSkus = collectVariantSkus(sourceProduct)
    const duplicateSku = skipExistingSkus
      ? candidateSkus.find((sku) => existingSkuSet.has(normalizeKey(sku)))
      : undefined

    if (duplicateSku) {
      skippedProductsCount += 1
      skippedSkus.push(duplicateSku)
      logger.info(`Skipping "${title}" because SKU "${duplicateSku}" already exists.`)
      continue
    }

    const baseSku = normalizeText(row.L) || `SKU-${normalizeText(row.A)}`
    const optionDefinitions = OPTION_COLUMN_GROUPS.reduce<
      { title: string; valueColumns: string[] }[]
    >((accumulator, group) => {
      const title = normalizeText(row[group.name])

      if (!title) {
        return accumulator
      }

      const existing = accumulator.find(
        (item) => normalizeKey(item.title) === normalizeKey(title)
      )

      if (existing) {
        existing.valueColumns.push(group.value)
        return accumulator
      }

      accumulator.push({
        title,
        valueColumns: [group.value],
      })

      return accumulator
    }, [])

    const hasVariantRows = sourceProduct.variantRows.length > 0
    const usesDefaultOption = !hasVariantRows || !optionDefinitions.length
    const rawRowsForVariants = hasVariantRows
      ? sourceProduct.variantRows
      : [sourceProduct.productRow]
    const seenVariantSkus = new Set<string>()
    const rowsForVariants = rawRowsForVariants.filter((variantRow, index) => {
      const variantSku =
        normalizeText(variantRow.L) ||
        `${baseSku}-${String(index + 1).padStart(2, "0")}`
      const variantSkuKey = normalizeKey(variantSku)

      if (!variantSkuKey) {
        return true
      }

      if (seenVariantSkus.has(variantSkuKey)) {
        logger.warn(
          `Skipping duplicate variant row inside "${title}" because SKU "${variantSku}" is repeated in the workbook.`
        )
        return false
      }

      seenVariantSkus.add(variantSkuKey)
      return true
    })
    const options = usesDefaultOption
      ? [{ title: DEFAULT_OPTION_TITLE, values: [DEFAULT_OPTION_VALUE] }]
      : optionDefinitions.map((option) => {
          const values = [
            ...new Set(
              rowsForVariants
                .map((variantRow) =>
                  option.valueColumns
                    .map((column) => normalizeText(variantRow[column]))
                    .find(Boolean) || ""
                )
                .filter(Boolean)
            ),
          ]

          return {
            title: option.title,
            values: values.length ? values : [DEFAULT_OPTION_VALUE],
          }
        })

    const inventoryLevels: InventoryLevelInput[] = []
    const variants = []

    for (let index = 0; index < rowsForVariants.length; index += 1) {
      const variantRow = rowsForVariants[index]
      const sku =
        normalizeText(variantRow.L) ||
        `${baseSku}-${String(index + 1).padStart(2, "0")}`
      const inventoryQuantity = parseInteger(variantRow.I) ?? 0
      const currentPrice = getCurrentPrice(variantRow)
      const optionMap = usesDefaultOption
        ? { [DEFAULT_OPTION_TITLE]: DEFAULT_OPTION_VALUE }
        : Object.fromEntries(
            optionDefinitions.map((option) => [
              option.title,
              option.valueColumns
                .map((column) => normalizeText(variantRow[column]))
                .find(Boolean) || DEFAULT_OPTION_VALUE,
            ])
          )

      const variantLabel = Object.values(optionMap).join(" / ")

      const inventoryItem = await inventoryModuleService.createInventoryItems({
        sku,
        title: `${title} - ${variantLabel}`,
        description: stripHtml(row.J) || title,
        thumbnail: parseImageList(row.E)[0] || null,
        requires_shipping: parseBoolean(row.K) ?? true,
        weight: normalizeWeight(row.T, row.U) ?? null,
        hs_code: null,
        origin_country: null,
        mid_code: null,
        metadata: {
          source_row_no: normalizeText(variantRow.A),
        },
      })

      existingSkuSet.add(normalizeKey(sku))

      inventoryLevels.push({
        inventory_item_id: inventoryItem.id,
        location_id: defaultLocationId,
        stocked_quantity: inventoryQuantity,
      })

      variants.push({
        title: variantLabel || title,
        sku,
        barcode: normalizeText(variantRow.Z) || undefined,
        manage_inventory: true,
        allow_backorder: false,
        requires_shipping: parseBoolean(row.K) ?? true,
        weight: normalizeWeight(row.T, row.U),
        options: optionMap,
        inventory_items: [
          {
            inventory_item_id: inventoryItem.id,
            required_quantity: 1,
          },
        ],
        prices: [
          {
            amount: currentPrice,
            currency_code: defaultCurrency,
          },
        ],
        metadata: {
          regular_price: parseNumber(variantRow.H),
          sale_price: parseNumber(variantRow.N),
          source_row_no: normalizeText(variantRow.A),
        },
      })
    }

    const categoryIds = resolveCategoryIds(normalizeText(row.D), categoryMaps)

    if (!categoryIds.length && normalizeText(row.D)) {
      logger.warn(`No category match found for "${title}" using "${row.D}"`)
    }

    const imageUrls = parseImageList(row.E)
    const images = imageUrls.map((url) => ({ url }))
    const metaTitle = normalizeText(row.X) || title
    const metaDescription = toMetaDescription(row)
    const productType = normalizeText(row.G)
    const brand = normalizeText(row.W)
    const brandRecord = resolveBrandRecord(brand)
    const typeId = productType ? await ensureTypeId(productType) : undefined

    if (brand && !brandRecord) {
      logger.warn(`No brand match found for "${title}" using "${brand}"`)
    }

    await createProductsWorkflow(container as any).run({
      input: {
        products: [
          {
            title,
            subtitle: normalizeText(row.X) || undefined,
            description: normalizeText(row.J) || undefined,
            is_giftcard: false,
            discountable: true,
            handle: makeAsciiHandle(title, baseSku),
            status: ProductStatus.PUBLISHED as ProductStatus,
            images,
            thumbnail: imageUrls[0],
            category_ids: categoryIds,
            type_id: typeId,
            options,
            variants,
            weight: normalizeWeight(row.T, row.U),
            metadata: {
              source_row_no: normalizeText(row.A),
              source_product_kind: normalizeText(row.B),
              source_regular_price: parseNumber(row.H),
              source_sale_price: parseNumber(row.N),
              source_sale_start: normalizeText(row.O) || null,
              source_sale_end: normalizeText(row.P) || null,
              source_max_quantity_per_customer: parseInteger(row.Q),
              source_hide_quantity_selector: parseBoolean(row.R),
              source_add_image_on_order: parseBoolean(row.S),
              source_product_status: normalizeText(row.V),
              source_brand: brand || null,
              brand_handle: brandRecord?.handle || null,
              brand_name_ar: brandRecord?.nameAr || brand || null,
              brand_name_en: brandRecord?.nameEn || brand || null,
              source_taxable: parseBoolean(row.AD),
              source_tax_reason: normalizeText(row.AE) || null,
              mpn: normalizeText(row.AB) || null,
              gtin: normalizeText(row.AC) || null,
              meta_title: metaTitle,
              page_title: metaTitle,
              meta_description: metaDescription,
              page_description: metaDescription,
            },
            sales_channels: [{ id: defaultSalesChannelId }],
            shipping_profile_id: shippingProfile.id,
          },
        ],
      },
    })

    await inventoryModuleService.createInventoryLevels(inventoryLevels)

    createdProductsCount += 1
    createdVariantsCount += variants.length
  }

  const summary = {
    deletedProducts,
    createdProducts: createdProductsCount,
    createdVariants: createdVariantsCount,
    skippedProducts: skippedProductsCount,
    skippedSkus,
  }

  logger.info(
    `Product import complete. Deleted: ${summary.deletedProducts}. Created products: ${summary.createdProducts}. Created variants: ${summary.createdVariants}. Skipped products: ${summary.skippedProducts}.`
  )

  return summary
}
