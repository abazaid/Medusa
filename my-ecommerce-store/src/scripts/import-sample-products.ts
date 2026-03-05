import { ExecArgs } from "@medusajs/framework/types"
import { importProductsFromWorkbook } from "../modules/product-import/engine"

const DEFAULT_IMPORT_FILE =
  process.env.PRODUCT_IMPORT_XLSX_PATH ||
  "C:\\Users\\tareq\\Downloads\\testsamplepor.xlsx"

export default async function importSampleProducts({ container }: ExecArgs) {
  await importProductsFromWorkbook({
    container,
    filePath: DEFAULT_IMPORT_FILE,
    replaceAll: true,
    skipExistingSkus: false,
  })
}
