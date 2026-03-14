import fs from "fs"
import os from "os"
import path from "path"
import { spawnSync } from "child_process"

import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  updateInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows"

type ContainerLike = {
  resolve: (key: string) => any
}

type SheetRow = Record<string, string>

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

const escapePowerShellString = (value: string) => value.replace(/'/g, "''")

const extractWorkbookArchive = (filePath: string, extractDir: string) => {
  const pythonScript = [
    "import sys, zipfile",
    "zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])",
  ].join("; ")

  for (const command of ["python3", "python"]) {
    const result = spawnSync(command, ["-c", pythonScript, filePath, extractDir], {
      stdio: "pipe",
      encoding: "utf8",
    })

    if (result.status === 0) {
      return
    }

    if (result.error && (result.error as NodeJS.ErrnoException).code === "ENOENT") {
      continue
    }
  }

  const powerShellResult = spawnSync(
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
    {
      stdio: "pipe",
      encoding: "utf8",
    }
  )

  if (powerShellResult.status === 0) {
    return
  }

  const stderr =
    powerShellResult.stderr?.trim() ||
    powerShellResult.error?.message ||
    "No supported archive extractor was found. Install python3/python or PowerShell."

  throw new Error(stderr)
}

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

const parseInteger = (value?: string | null) => {
  const normalized = normalizeText(value)
  if (!normalized) return null
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) {
    return null
  }
  return Math.max(0, Math.trunc(parsed))
}

const extractSharedStrings = (xml: string) =>
  [...xml.matchAll(/<si[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>[\s\S]*?<\/si>/g)].map(
    (match) => decodeXmlEntities(stripXmlTags(match[1] || ""))
  )

const extractRows = (xml: string, sharedStrings: string[]) => {
  const rows: SheetRow[] = []
  const rowMatches = xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)

  for (const rowMatch of rowMatches) {
    const cellsXml = rowMatch[1] || ""
    const row: SheetRow = {}
    const cellMatches = cellsXml.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)

    for (const cellMatch of cellMatches) {
      const attrs = cellMatch[1] || ""
      const body = cellMatch[2] || ""
      const refMatch = attrs.match(/\br="([A-Z]+\d+)"/)
      const typeMatch = attrs.match(/\bt="([^"]+)"/)
      const ref = refMatch?.[1]

      if (!ref) {
        continue
      }

      const reference = ref.replace(/\d+/g, "")
      const rawValue =
        body.match(/<v>([\s\S]*?)<\/v>/)?.[1] ||
        body.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] ||
        ""

      let value = decodeXmlEntities(stripXmlTags(rawValue))

      if (typeMatch?.[1] === "s") {
        const index = Number(rawValue)
        value = Number.isFinite(index) ? sharedStrings[index] || "" : ""
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

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "medusa-qty-import-"))
  const extractDir = path.join(tempDir, "xlsx")

  try {
    extractWorkbookArchive(filePath, extractDir)

    const sharedStringsPath = path.join(extractDir, "xl", "sharedStrings.xml")
    const sheetPath = path.join(extractDir, "xl", "worksheets", "sheet1.xml")

    const sharedStrings = fs.existsSync(sharedStringsPath)
      ? extractSharedStrings(fs.readFileSync(sharedStringsPath, "utf8"))
      : []

    return extractRows(fs.readFileSync(sheetPath, "utf8"), sharedStrings)
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
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

  const workbookRows = readWorkbookRows(filePath)
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
  const inventoryItems = requestedSkus.length
    ? ((await inventoryModuleService.listInventoryItems(
        { sku: requestedSkus },
        { take: Math.max(1000, requestedSkus.length) } as any
      )) as Array<{ id: string; sku?: string | null; deleted_at?: string | null }>)
    : []

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
  const currentLevels = inventoryItemIds.length
    ? ((await inventoryModuleService.listInventoryLevels(
        {
          inventory_item_id: inventoryItemIds,
          location_id: defaultLocation.id,
        },
        { take: Math.max(1000, inventoryItemIds.length) } as any
      )) as Array<{
        id: string
        inventory_item_id: string
        location_id: string
        stocked_quantity: number
      }>)
    : []

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
    await updateInventoryLevelsWorkflow(container as any).run({
      input: {
        updates,
      },
    })
  }

  if (creates.length) {
    await createInventoryLevelsWorkflow(container as any).run({
      input: {
        inventory_levels: creates,
      },
    })
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
