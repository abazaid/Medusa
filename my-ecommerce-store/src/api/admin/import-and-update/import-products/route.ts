import fs from "fs"
import os from "os"
import path from "path"

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { importProductsFromWorkbook } from "../../../../modules/product-import/engine"

type ImportBody = {
  file_name?: string
  file_base64?: string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as ImportBody
  const fileName = body.file_name || "products.xlsx"
  const fileBase64 = body.file_base64

  if (!fileBase64) {
    res.status(400).json({ message: "Excel file content is required." })
    return
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "medusa-admin-import-"))
  const filePath = path.join(tempDir, fileName.replace(/[\\/:*?"<>|]+/g, "-"))

  try {
    const fileBuffer = Buffer.from(fileBase64, "base64")
    fs.writeFileSync(filePath, fileBuffer)

    const summary = await importProductsFromWorkbook({
      container: req.scope as any,
      filePath,
      replaceAll: false,
      skipExistingSkus: true,
    })

    res.status(200).json({
      summary,
    })
  } catch (error) {
    res.status(500).json({
      message:
        error instanceof Error ? error.message : "Product import failed.",
    })
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}
