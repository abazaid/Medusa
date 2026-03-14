import { ExecArgs } from "@medusajs/framework/types"
import { importQtyWorkbook } from "../modules/qty-import/engine"

export default async function importQtyFile({ container, args }: ExecArgs) {
  const filePath = String(args?.[0] || "").trim()

  if (!filePath) {
    throw new Error("Usage: medusa exec ./src/scripts/import-qty-file.ts <xlsx-file-path>")
  }

  const summary = await importQtyWorkbook({
    container: container as any,
    filePath,
  })

  console.log(JSON.stringify(summary, null, 2))
}
