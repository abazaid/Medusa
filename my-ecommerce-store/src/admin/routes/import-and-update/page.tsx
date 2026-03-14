"use client"

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Sparkles } from "@medusajs/icons"
import { useState } from "react"

type ImportSummary = {
  deletedProducts: number
  createdProducts: number
  createdVariants: number
  skippedProducts: number
  skippedSkus: string[]
}

const boxStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  background: "#fff",
}

const fieldStyle = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  padding: "10px 12px",
  fontSize: "14px",
  lineHeight: 1.5,
}

const buttonStyle = {
  border: "1px solid #111827",
  borderRadius: "10px",
  background: "#111827",
  color: "#fff",
  padding: "8px 12px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
}

const truncate = (value: string, limit: number) => {
  const normalized = value.replace(/\s+/g, " ").trim()

  if (normalized.length <= limit) {
    return normalized
  }

  return `${normalized.slice(0, Math.max(0, limit - 3)).trim()}...`
}

const fileToBase64 = async (file: File) => {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ""

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index])
  }

  return btoa(binary)
}

const ImportAndUpdatePage = () => {
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)

  const uploadProductsFile = async () => {
    if (!importFile) {
      setError("اختر ملف Excel أولاً.")
      return
    }

    setImporting(true)
    setMessage("")
    setError("")
    setImportSummary(null)

    try {
      const response = await fetch("/admin/import-and-update/import-products", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file_name: importFile.name,
          file_base64: await fileToBase64(importFile),
        }),
      })

      const payload = (await response.json()) as {
        message?: string
        summary?: ImportSummary
      }

      if (!response.ok || !payload.summary) {
        throw new Error(payload.message || "فشل استيراد المنتجات.")
      }

      setImportSummary(payload.summary)
      setImportFile(null)
      setMessage("تم استيراد الملف بنجاح مع تخطي المنتجات المكررة حسب SKU.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل استيراد المنتجات.")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div style={{ padding: 24, background: "#f9fafb", minHeight: "100%" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>Import and Update</h1>
        <p style={{ margin: "8px 0 0", color: "#4b5563", fontSize: 14 }}>
          صفحة مستقلة لرفع ملفات Excel واستيراد المنتجات بدون خلطها مع أدوات SEO.
        </p>
      </div>

      {message ? (
        <div
          style={{
            ...boxStyle,
            borderColor: "#bbf7d0",
            background: "#f0fdf4",
            color: "#166534",
            padding: 12,
            marginBottom: 16,
          }}
        >
          {message}
        </div>
      ) : null}

      {error ? (
        <div
          style={{
            ...boxStyle,
            borderColor: "#fecaca",
            background: "#fef2f2",
            color: "#991b1b",
            padding: 12,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      ) : null}

      <section style={{ ...boxStyle, padding: 20, marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>رفع منتجات من Excel</h2>
        <p style={{ margin: "8px 0 16px", color: "#4b5563", fontSize: 14 }}>
          ارفع ملف Excel بنفس الصيغة المعتمدة. سيتم تجاوز المنتجات المكررة حسب SKU تلقائيًا.
        </p>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <input
            type="file"
            accept=".xlsx"
            onChange={(event) => setImportFile(event.target.files?.[0] || null)}
            style={{ ...fieldStyle, maxWidth: 380 }}
          />
          <button
            type="button"
            style={buttonStyle}
            onClick={() => void uploadProductsFile()}
            disabled={!importFile || importing}
          >
            {importing ? "جارٍ الاستيراد..." : "رفع واستيراد"}
          </button>
        </div>

        {importFile ? (
          <div style={{ marginTop: 12, fontSize: 13, color: "#374151" }}>
            الملف المحدد: {importFile.name}
          </div>
        ) : null}

        {importSummary ? (
          <div
            style={{
              marginTop: 16,
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 12,
              background: "#f9fafb",
              fontSize: 14,
              lineHeight: 1.8,
            }}
          >
            <div>تم إنشاء منتجات: {importSummary.createdProducts}</div>
            <div>تم إنشاء Variants: {importSummary.createdVariants}</div>
            <div>تم تخطي منتجات مكررة: {importSummary.skippedProducts}</div>
            {!!importSummary.skippedSkus.length && (
              <div>
                أمثلة SKU متخطاة: {truncate(importSummary.skippedSkus.join(", "), 180)}
              </div>
            )}
          </div>
        ) : null}
      </section>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Import and Update",
  icon: Sparkles,
})

export default ImportAndUpdatePage
