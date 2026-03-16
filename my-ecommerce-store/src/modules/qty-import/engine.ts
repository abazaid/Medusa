import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  updateInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows"
import { readWorkbookRows, type SheetRow } from "../../lib/xlsx/reader"

type ContainerLike = {
  resolve: (key: string) => any
}

type QtyImportOptions = {
  container: ContainerLike
  filePath: string
}

type QtyImportRowResult = {
  sku: string
  quantity: number
  status: "updated" | "created" | "missing_sku" | "duplicate_file" | "not_found" | "ambiguous"
  note: string
}

export type QtyImportSummary = {
  totalRows: number
  updatedRows: number
  createdLevels: number
  missingSkuRows: number
  duplicateFileRows: number
  notFoundRows: number
  ambiguousRows: number
  locationName: string
  results: QtyImportRowResult[]
}

const QUERY_BATCH_SIZE = 500
const WORKFLOW_BATCH_SIZE = 250

const normalizeText = (value?: string | null) =>
  (value || "").replace(/\s+/g, " ").trim()

const normalizeKey = (value?: string | null) =>
  normalizeText(value).toLowerCase()

const chunkArray = <T>(items: T[], size: number) => {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

const parseInteger = (value?: string | null) => {
  const normalized = normalizeText(value)
  if (!normalized) return null
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) {
    return null
  }
  return Math.max(0, Math.trunc(parsed))
}

const resolveColumnLetter = (headerRow: SheetRow, candidates: string[]) => {
  const entries = Object.entries(headerRow)

  for (const [column, value] of entries) {
    const normalizedHeader = normalizeKey(value)
    if (!normalizedHeader) {
      continue
    }

    if (candidates.some((candidate) => normalizedHeader.includes(normalizeKey(candidate)))) {
      return column
    }
  }

  return undefined
}

const looksLikeSku = (value?: string | null) => {
  const normalized = normalizeText(value)
  if (!normalized) {
    return false
  }

  return /[a-z]/i.test(normalized) && /^[a-z0-9._-]+$/i.test(normalized)
}

const buildQtyRows = (rows: SheetRow[]) => {
  const headerRow = rows[0] || {}
  let skuColumn = resolveColumnLetter(headerRow, [
    "sku",
    "رمز المنتج",
    "رمز المنتج sku",
    "product sku",
  ])
  let quantityColumn = resolveColumnLetter(headerRow, [
    "الكمية",
    "quantity",
    "qty",
  ])

  if (!skuColumn || !quantityColumn) {
    const sampleRows = rows.slice(1, 6)
    const allColumns = Array.from(
      new Set(sampleRows.flatMap((row) => Object.keys(row)))
    )

    if (!skuColumn) {
      skuColumn = allColumns.find((column) =>
        sampleRows.some((row) => looksLikeSku(row[column]))
      )
    }

    if (!quantityColumn) {
      quantityColumn = allColumns.find((column) =>
        sampleRows.some((row) => parseInteger(row[column]) !== null)
      )
    }
  }

  if (!skuColumn || !quantityColumn) {
    throw new Error("The Excel file must contain SKU and quantity columns.")
  }

  return rows.slice(1).map((row) => ({
    sku: normalizeText(row[skuColumn]),
    quantity: parseInteger(row[quantityColumn]),
  }))
}

export const importQtyWorkbook = async ({
  container,
  filePath,
}: QtyImportOptions): Promise<QtyImportSummary> => {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const inventoryModuleService = container.resolve(Modules.INVENTORY)
  const stockLocationModuleService = container.resolve(Modules.STOCK_LOCATION)

  logger.info(`Reading quantity import file: ${filePath}`)

  const workbookRows = await readWorkbookRows(filePath)
  const qtyRows = buildQtyRows(workbookRows).filter(
    (row) => row.sku || row.quantity !== null
  )

  if (!qtyRows.length) {
    throw new Error("No quantity rows were found in the workbook.")
  }

  const activeLocations = (await stockLocationModuleService.listStockLocations(
    {},
    { take: 100 } as any
  )) as Array<{ id: string; name?: string; metadata?: Record<string, unknown> | null }>

  const defaultLocation =
    activeLocations.find((location) => location.metadata?.is_default === true) ||
    activeLocations.find((location) => normalizeKey(location.name) === "saudi warehouse") ||
    activeLocations[0]

  if (!defaultLocation?.id) {
    throw new Error("No active stock location is available for quantity import.")
  }

  const requestedSkus = Array.from(new Set(qtyRows.map((row) => row.sku).filter(Boolean)))
  const inventoryItems: Array<{ id: string; sku?: string | null; deleted_at?: string | null }> = []

  for (const skuBatch of chunkArray(requestedSkus, QUERY_BATCH_SIZE)) {
    const batchItems = (await inventoryModuleService.listInventoryItems(
      { sku: skuBatch },
      { take: Math.max(QUERY_BATCH_SIZE, skuBatch.length) } as any
    )) as Array<{ id: string; sku?: string | null; deleted_at?: string | null }>

    inventoryItems.push(...batchItems)
  }

  const activeItems = inventoryItems.filter((item) => !item.deleted_at)
  const itemsBySku = new Map<string, Array<{ id: string; sku: string }>>()

  for (const item of activeItems) {
    const sku = normalizeText(item.sku)
    if (!sku) {
      continue
    }

    const current = itemsBySku.get(sku) || []
    current.push({ id: item.id, sku })
    itemsBySku.set(sku, current)
  }

  const inventoryItemIds = activeItems.map((item) => item.id)
  const currentLevels: Array<{
    id: string
    inventory_item_id: string
    location_id: string
    stocked_quantity: number
  }> = []

  for (const idBatch of chunkArray(inventoryItemIds, QUERY_BATCH_SIZE)) {
    const batchLevels = (await inventoryModuleService.listInventoryLevels(
      {
        inventory_item_id: idBatch,
        location_id: defaultLocation.id,
      },
      { take: Math.max(QUERY_BATCH_SIZE, idBatch.length) } as any
    )) as Array<{
      id: string
      inventory_item_id: string
      location_id: string
      stocked_quantity: number
    }>

    currentLevels.push(...batchLevels)
  }

  const levelsByInventoryItemId = new Map(
    currentLevels.map((level) => [level.inventory_item_id, level])
  )

  const seenSkus = new Set<string>()
  const updates: Array<{
    id: string
    inventory_item_id: string
    location_id: string
    stocked_quantity: number
  }> = []
  const creates: Array<{
    inventory_item_id: string
    location_id: string
    stocked_quantity: number
  }> = []
  const results: QtyImportRowResult[] = []

  for (const row of qtyRows) {
    const sku = row.sku
    const quantity = row.quantity

    if (!sku || quantity === null) {
      results.push({
        sku: sku || "-",
        quantity: quantity || 0,
        status: "missing_sku",
        note: "SKU or quantity is missing.",
      })
      continue
    }

    if (seenSkus.has(sku)) {
      results.push({
        sku,
        quantity,
        status: "duplicate_file",
        note: "This SKU is repeated in the uploaded file.",
      })
      continue
    }

    seenSkus.add(sku)

    const matches = itemsBySku.get(sku) || []

    if (!matches.length) {
      results.push({
        sku,
        quantity,
        status: "not_found",
        note: "No active inventory item matches this SKU.",
      })
      continue
    }

    if (matches.length > 1) {
      results.push({
        sku,
        quantity,
        status: "ambiguous",
        note: "More than one active inventory item matches this SKU.",
      })
      continue
    }

    const inventoryItem = matches[0]
    const level = levelsByInventoryItemId.get(inventoryItem.id)

    if (level?.id) {
      updates.push({
        id: level.id,
        inventory_item_id: inventoryItem.id,
        location_id: defaultLocation.id,
        stocked_quantity: quantity,
      })
      results.push({
        sku,
        quantity,
        status: "updated",
        note: "Existing stock level updated.",
      })
      continue
    }

    creates.push({
      inventory_item_id: inventoryItem.id,
      location_id: defaultLocation.id,
      stocked_quantity: quantity,
    })
    results.push({
      sku,
      quantity,
      status: "created",
      note: "A new stock level was created for this SKU.",
    })
  }

  if (updates.length) {
    for (const batch of chunkArray(updates, WORKFLOW_BATCH_SIZE)) {
      await updateInventoryLevelsWorkflow(container as any).run({
        input: {
          updates: batch,
        },
      })
    }
  }

  if (creates.length) {
    for (const batch of chunkArray(creates, WORKFLOW_BATCH_SIZE)) {
      await createInventoryLevelsWorkflow(container as any).run({
        input: {
          inventory_levels: batch,
        },
      })
    }
  }

  return {
    totalRows: qtyRows.length,
    updatedRows: results.filter((row) => row.status === "updated").length,
    createdLevels: results.filter((row) => row.status === "created").length,
    missingSkuRows: results.filter((row) => row.status === "missing_sku").length,
    duplicateFileRows: results.filter((row) => row.status === "duplicate_file").length,
    notFoundRows: results.filter((row) => row.status === "not_found").length,
    ambiguousRows: results.filter((row) => row.status === "ambiguous").length,
    locationName: defaultLocation.name || defaultLocation.id,
    results: results.slice(0, 50),
  }
}
