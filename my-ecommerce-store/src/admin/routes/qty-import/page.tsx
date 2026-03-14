"use client"

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ArrowUpTray } from "@medusajs/icons"
import { useState } from "react"

type QtyImportRowResult = {
  sku: string
  quantity: number
  status: "updated" | "created" | "missing_sku" | "duplicate_file" | "not_found" | "ambiguous"
  note: string
}

type QtyImportSummary = {
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

const badgeStyle = (status: QtyImportRowResult["status"]) => {
  if (status === "updated") {
    return { background: "#dcfce7", color: "#166534" }
  }

  if (status === "created") {
    return { background: "#dbeafe", color: "#1d4ed8" }
  }

  return { background: "#fee2e2", color: "#991b1b" }
}

const fileToBase64 = async (file: File) => {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ""

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index])
  }

  return btoa(binary)
}

const QtyImportPage = () => {
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [summary, setSummary] = useState<QtyImportSummary | null>(null)

  const uploadFile = async () => {
    if (!file) {
      setError("اختر ملف Excel أولًا.")
      return
    }

    setSubmitting(true)
    setMessage("")
    setError("")
    setSummary(null)

    try {
      const response = await fetch("/admin/qty-import/upload", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file_name: file.name,
          file_base64: await fileToBase64(file),
        }),
      })

      const payload = (await response.json()) as {
        message?: string
        summary?: QtyImportSummary
      }

      if (!response.ok || !payload.summary) {
        throw new Error(payload.message || "فشل تحديث الكميات.")
      }

      setSummary(payload.summary)
      setFile(null)
      setMessage("تمت معالجة ملف الكميات بنجاح.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تحديث الكميات.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ padding: 24, background: "#f9fafb", minHeight: "100%" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>QTY import</h1>
        <p style={{ margin: "8px 0 0", color: "#4b5563", fontSize: 14 }}>
          ارفع ملف Excel يحتوي على عمود SKU وعمود الكمية ليتم تحديث مخزون المنتجات بالمطابقة على SKU.
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
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>رفع ملف الكميات</h2>
        <p style={{ margin: "8px 0 12px", color: "#4b5563", fontSize: 14, lineHeight: 1.7 }}>
          الأعمدة المطلوبة:
          <br />
          `sku` أو `رمز المنتج`
          <br />
          `الكمية` أو `qty`
        </p>

        <div
          style={{
            border: "1px dashed #cbd5e1",
            borderRadius: 12,
            padding: 16,
            background: "#f8fafc",
            marginBottom: 16,
            fontSize: 13,
            lineHeight: 1.8,
          }}
        >
          مثال:
          <br />
          `sku = VAPE00008455`
          <br />
          `الكمية = 1`
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="file"
            accept=".xlsx"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            style={{ ...fieldStyle, maxWidth: 380 }}
          />
          <button
            type="button"
            style={buttonStyle}
            onClick={() => void uploadFile()}
            disabled={!file || submitting}
          >
            {submitting ? "جارٍ تحديث الكميات..." : "رفع وتحديث"}
          </button>
        </div>

        {file ? (
          <div style={{ marginTop: 12, fontSize: 13, color: "#374151" }}>
            الملف المحدد: {file.name}
          </div>
        ) : null}
      </section>

      {summary ? (
        <>
          <section style={{ ...boxStyle, padding: 20, marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>نتيجة الاستيراد</h2>
            <div style={{ marginTop: 12, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              <div>الموقع المستهدف: {summary.locationName}</div>
              <div>إجمالي الصفوف: {summary.totalRows}</div>
              <div>تم تحديثها: {summary.updatedRows}</div>
              <div>تم إنشاء level جديد: {summary.createdLevels}</div>
              <div>صفوف ناقصة: {summary.missingSkuRows}</div>
              <div>SKU مكرر بالملف: {summary.duplicateFileRows}</div>
              <div>غير موجود بالمتجر: {summary.notFoundRows}</div>
              <div>مطابقة ملتبسة: {summary.ambiguousRows}</div>
            </div>
          </section>

          <section style={{ ...boxStyle, padding: 20 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>تفاصيل أول 50 صف</h2>
            <div style={{ overflowX: "auto", marginTop: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ textAlign: "right", borderBottom: "1px solid #e5e7eb" }}>
                    <th style={{ padding: "10px 8px" }}>SKU</th>
                    <th style={{ padding: "10px 8px" }}>الكمية</th>
                    <th style={{ padding: "10px 8px" }}>الحالة</th>
                    <th style={{ padding: "10px 8px" }}>ملاحظة</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.results.map((row, index) => (
                    <tr key={`${row.sku}-${index}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>{row.sku}</td>
                      <td style={{ padding: "10px 8px" }}>{row.quantity}</td>
                      <td style={{ padding: "10px 8px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            padding: "4px 8px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                            ...badgeStyle(row.status),
                          }}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 8px" }}>{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "QTY import",
  icon: ArrowUpTray,
})

export default QtyImportPage
