import fs from "fs"
import os from "os"
import path from "path"

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { importQtyWorkbook } from "../../../../modules/qty-import/engine"

type UploadBody = {
  file_name?: string
  file_base64?: string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as UploadBody
  const fileName = body.file_name || "qty-import.xlsx"
  const fileBase64 = body.file_base64

  if (!fileBase64) {
    res.status(400).json({ message: "Excel file content is required." })
    return
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "medusa-admin-qty-import-"))
  const filePath = path.join(tempDir, fileName.replace(/[\\/:*?"<>|]+/g, "-"))

  try {
    fs.writeFileSync(filePath, Buffer.from(fileBase64, "base64"))

    const summary = await importQtyWorkbook({
      container: req.scope as any,
      filePath,
    })

    res.status(200).json({ summary })
  } catch (error) {
    res.status(500).json({
      message:
        error instanceof Error ? error.message : "Quantity import failed.",
    })
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}
