import { ExecArgs } from "@medusajs/framework/types"
import { importProductsFromWorkbook } from "../modules/product-import/engine"
import fs from "node:fs"
import path from "node:path"

const PROJECT_IMPORT_FILE = path.resolve(process.cwd(), "static", "products.xlsx")
const LEGACY_WINDOWS_IMPORT_FILE = "C:\\Users\\tareq\\Downloads\\testsamplepor.xlsx"

const DEFAULT_IMPORT_FILE =
  process.env.PRODUCT_IMPORT_XLSX_PATH ||
  (fs.existsSync(PROJECT_IMPORT_FILE)
    ? PROJECT_IMPORT_FILE
    : LEGACY_WINDOWS_IMPORT_FILE)

export default async function importSampleProducts({ container }: ExecArgs) {
  await importProductsFromWorkbook({
    container,
    filePath: DEFAULT_IMPORT_FILE,
    replaceAll: true,
    skipExistingSkus: false,
  })
}
