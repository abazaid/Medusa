import fs from "fs"
import JSZip from "jszip"

export type SheetRow = Record<string, string>

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

export const readWorkbookRows = async (filePath: string, sheetName = "sheet1.xml") => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Import file not found: ${filePath}`)
  }

  const fileBuffer = fs.readFileSync(filePath)
  const zip = await JSZip.loadAsync(fileBuffer)
  const sheetEntry = zip.file(`xl/worksheets/${sheetName}`)

  if (!sheetEntry) {
    throw new Error(`Worksheet xl/worksheets/${sheetName} was not found in the workbook.`)
  }

  const sharedStringsEntry = zip.file("xl/sharedStrings.xml")
  const sharedStringsXml = sharedStringsEntry
    ? await sharedStringsEntry.async("string")
    : ""
  const sheetXml = await sheetEntry.async("string")
  const sharedStrings = sharedStringsXml ? extractSharedStrings(sharedStringsXml) : []

  return extractRows(sheetXml, sharedStrings)
}
