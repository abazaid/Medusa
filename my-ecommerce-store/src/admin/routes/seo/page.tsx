"use client"

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Sparkles } from "@medusajs/icons"
import { useEffect, useMemo, useState } from "react"

type SeoSettings = {
  global_instructions: string
  meta_title_instructions: string
  meta_description_instructions: string
  product_description_instructions: string
}

type AiProvider = "openai" | "deepseek" | "claude"

type SeoAiSettings = {
  provider: AiProvider
  model: string
  openai_api_key: string
  deepseek_api_key: string
  claude_api_key: string
}

type SeoProduct = {
  id: string
  title: string
  handle: string
  description: string
  meta_title: string
  meta_description: string
  seo_last_optimized_at: string
  seo_source?: string
  is_optimized: boolean
  in_stock: boolean
}

type GenerateTarget = "meta_title" | "meta_description" | "description" | "all"

type SeoResponse = {
  products: SeoProduct[]
  settings: SeoSettings
  ai_settings: SeoAiSettings
  ai_provider_models: Record<AiProvider, string[]>
}

type GenerateResponse = {
  message?: string
  product?: Partial<SeoProduct>
}

type PreviewState = {
  productId: string
  productTitle: string
  target: GenerateTarget
  before: {
    meta_title: string
    meta_description: string
    description: string
  }
  after: {
    meta_title: string
    meta_description: string
    description: string
  }
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

const secondaryButtonStyle = {
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  background: "#fff",
  color: "#111827",
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

const stripHtml = (value: string) =>
  value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()

const SeoPage = () => {
  const [products, setProducts] = useState<SeoProduct[]>([])
  const [settings, setSettings] = useState<SeoSettings | null>(null)
  const [aiSettings, setAiSettings] = useState<SeoAiSettings | null>(null)
  const [aiProviderModels, setAiProviderModels] = useState<
    Record<AiProvider, string[]>
  >({
    openai: [],
    deepseek: [],
    claude: [],
  })
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [actionKey, setActionKey] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<
    | "all"
    | "missing_meta"
    | "stale"
    | "optimized"
    | "not_optimized"
    | "in_stock"
    | "out_of_stock"
  >("all")
  const [preview, setPreview] = useState<PreviewState | null>(null)

  const getResponseMessage = async (response: Response) => {
    try {
      const payload = (await response.json()) as { message?: string }
      return payload.message || ""
    } catch {
      try {
        return (await response.text()).trim()
      } catch {
        return ""
      }
    }
  }

  const loadData = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/admin/seo", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to load SEO data.")
      }

      const payload = (await response.json()) as SeoResponse
      setProducts(payload.products)
      setSettings(payload.settings)
      setAiSettings(payload.ai_settings)
      setAiProviderModels(payload.ai_provider_models)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load SEO data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const staleThreshold = new Date()
    staleThreshold.setDate(staleThreshold.getDate() - 30)

    return products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        product.title.toLowerCase().includes(normalizedSearch) ||
        product.handle.toLowerCase().includes(normalizedSearch)

      if (!matchesSearch) {
        return false
      }

      if (filter === "missing_meta") {
        return !product.meta_title || !product.meta_description
      }

      if (filter === "stale") {
        if (!product.seo_last_optimized_at) {
          return true
        }

        const lastUpdated = new Date(product.seo_last_optimized_at)
        return Number.isNaN(lastUpdated.getTime()) || lastUpdated < staleThreshold
      }

      if (filter === "optimized") {
        return product.is_optimized
      }

      if (filter === "not_optimized") {
        return !product.is_optimized
      }

      if (filter === "in_stock") {
        return product.in_stock
      }

      if (filter === "out_of_stock") {
        return !product.in_stock
      }

      return true
    })
  }, [products, search, filter])

  const getFirstModelForProvider = (provider: AiProvider) => {
    const list = aiProviderModels[provider] || []
    return list[0] || ""
  }

  const saveSettings = async () => {
    if (!settings || !aiSettings) {
      return
    }

    setSavingSettings(true)
    setMessage("")
    setError("")

    try {
      const response = await fetch("/admin/seo", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...settings,
          ai_provider: aiSettings.provider,
          ai_model: aiSettings.model,
          openai_api_key: aiSettings.openai_api_key,
          deepseek_api_key: aiSettings.deepseek_api_key,
          claude_api_key: aiSettings.claude_api_key,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save SEO instructions.")
      }

      const payload = (await response.json()) as {
        settings: SeoSettings
        ai_settings: SeoAiSettings
        ai_provider_models: Record<AiProvider, string[]>
      }
      setSettings(payload.settings)
      setMessage("تم حفظ تعليمات ChatGPT بنجاح.")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save SEO instructions."
      )
    } finally {
      setSavingSettings(false)
    }
  }

  const generateAndSave = async (productId: string, target: GenerateTarget) => {
    const product = products.find((item) => item.id === productId)
    setActionKey(`${productId}:${target}:generate`)
    setMessage(
      product && !product.in_stock
        ? target === "all"
          ? "المنتج غير متوفر بالمخزون، ومع ذلك جارٍ توليد كل الحقول يدويًا..."
          : "المنتج غير متوفر بالمخزون، ومع ذلك جارٍ التوليد يدويًا..."
        : target === "all"
        ? "جارٍ توليد كل الحقول لهذا المنتج..."
        : "جارٍ توليد الحقل المطلوب..."
    )
    setError("")

    try {
      const response = await fetch(`/admin/seo/${productId}/generate`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target,
          preview: false,
        }),
      })

      if (!response.ok) {
        const errorMessage = await getResponseMessage(response)
        throw new Error(
          errorMessage ||
            (target === "all"
              ? "Failed to generate all SEO fields."
              : "Failed to generate SEO content.")
        )
      }

      const payload = (await response.json()) as GenerateResponse
      if (!payload.product) {
        throw new Error("The server response did not include updated product data.")
      }

      setProducts((current) =>
        current.map((product) =>
          product.id === productId
            ? {
                ...product,
                meta_title: payload.product?.meta_title ?? product.meta_title,
                meta_description:
                  payload.product?.meta_description ?? product.meta_description,
                description: payload.product?.description ?? product.description,
                seo_last_optimized_at:
                  payload.product?.seo_last_optimized_at ??
                  product.seo_last_optimized_at,
                is_optimized:
                  payload.product?.seo_last_optimized_at ??
                  product.seo_last_optimized_at
                    ? true
                    : product.is_optimized,
              }
            : product
        )
      )

      setMessage(
        target === "all"
          ? "تم توليد وحفظ كل الحقول لهذا المنتج."
          : "تم توليد وحفظ الحقل بنجاح."
      )
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate SEO content."
      )
    } finally {
      setActionKey("")
    }
  }

  const requestPreview = async (productId: string, target: GenerateTarget) => {
    const product = products.find((item) => item.id === productId)

    if (!product) {
      return
    }

    setActionKey(`${productId}:${target}:preview`)
    setMessage("")
    setError("")

    try {
      const response = await fetch(`/admin/seo/${productId}/generate`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ target, preview: true }),
      })

      const payload = (await response.json()) as {
        message?: string
        before: PreviewState["before"]
        after: PreviewState["after"]
      }

      if (!response.ok) {
        throw new Error(payload.message || "Failed to generate SEO preview.")
      }

      setPreview({
        productId,
        productTitle: product.title,
        target,
        before: payload.before,
        after: payload.after,
      })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate SEO preview."
      )
    } finally {
      setActionKey("")
    }
  }

  const applyPreview = async () => {
    if (!preview) {
      return
    }

    setActionKey(`${preview.productId}:${preview.target}:apply`)
    setMessage("")
    setError("")

    try {
      const response = await fetch(`/admin/seo/${preview.productId}/generate`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target: preview.target,
          preview: false,
          ...(preview.target === "all"
            ? { fields: preview.after }
            : {
                content:
                  preview.target === "meta_title"
                    ? preview.after.meta_title
                    : preview.target === "meta_description"
                    ? preview.after.meta_description
                    : preview.after.description,
              }),
        }),
      })

      const payload = (await response.json()) as {
        message?: string
        product?: Partial<SeoProduct>
      }

      if (!response.ok) {
        throw new Error(payload.message || "Failed to save SEO content.")
      }

      setProducts((current) =>
        current.map((product) =>
          product.id === preview.productId
            ? {
                ...product,
                meta_title: payload.product?.meta_title ?? product.meta_title,
                meta_description:
                  payload.product?.meta_description ?? product.meta_description,
                description: payload.product?.description ?? product.description,
                seo_last_optimized_at:
                  payload.product?.seo_last_optimized_at ??
                  product.seo_last_optimized_at,
              }
            : product
        )
      )

      setPreview(null)
      setMessage("تم حفظ التعديلات داخل المتجر بنجاح.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save SEO content.")
    } finally {
      setActionKey("")
    }
  }

  const generateVisibleAll = async () => {
    setMessage("")
    setError("")
    let hasFailure = false

    for (const product of visibleProducts) {
      setActionKey(`bulk:${product.id}`)

      try {
        const response = await fetch(`/admin/seo/${product.id}/generate`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            target: "all",
            preview: false,
          }),
        })

        const payload = (await response.json()) as {
          message?: string
          product?: Partial<SeoProduct>
        }

        if (!response.ok) {
          throw new Error(payload.message || "Failed to generate all SEO fields.")
        }

        setProducts((current) =>
          current.map((item) =>
            item.id === product.id
              ? {
                  ...item,
                  meta_title: payload.product?.meta_title ?? item.meta_title,
                  meta_description:
                    payload.product?.meta_description ?? item.meta_description,
                  description: payload.product?.description ?? item.description,
                  seo_last_optimized_at:
                    payload.product?.seo_last_optimized_at ??
                    item.seo_last_optimized_at,
                }
              : item
          )
        )
      } catch (err) {
        hasFailure = true
        setError(
          err instanceof Error
            ? `فشل أثناء توليد بعض العناصر: ${err.message}`
            : "Failed to generate all SEO fields."
        )
        break
      }
    }

    setActionKey("")

    if (!hasFailure) {
      setMessage("تم توليد كل الحقول للنتائج الظاهرة.")
    }
  }

  return (
    <div style={{ padding: 24, background: "#f9fafb", minHeight: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>SEO</h1>
          <p style={{ margin: "8px 0 0", color: "#4b5563", fontSize: 14 }}>
            إدارة SEO للمنتجات: توليد المحتوى، الإعدادات، ومتابعة التحسين.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            style={secondaryButtonStyle}
            onClick={() => void loadData()}
            disabled={loading}
          >
            تحديث البيانات
          </button>
          <button
            type="button"
            style={buttonStyle}
            onClick={() => void generateVisibleAll()}
            disabled={!visibleProducts.length || !!actionKey}
          >
            توليد الكل للنتائج الظاهرة
          </button>
        </div>
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

      {actionKey ? (
        <div
          style={{
            ...boxStyle,
            borderColor: "#fde68a",
            background: "#fffbeb",
            color: "#92400e",
            padding: 12,
            marginBottom: 16,
            fontWeight: 600,
          }}
        >
          جاري تنفيذ العملية... لا تغلق الصفحة حتى يكتمل التوليد.
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
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
          إعدادات ChatGPT
        </h2>
        <p style={{ margin: "8px 0 16px", color: "#4b5563", fontSize: 14 }}>
          تعليمات ثابتة يأخذها التوليد بعين الاعتبار عند كتابة الميتا ووصف المنتج.
        </p>

        {settings && aiSettings ? (
          <div style={{ display: "grid", gap: 16 }}>
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                background: "#f9fafb",
                padding: 12,
                display: "grid",
                gap: 12,
              }}
            >
              <strong style={{ fontSize: 14 }}>AI Provider Settings</strong>

              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
                <label style={{ display: "grid", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Provider</span>
                  <select
                    style={fieldStyle}
                    value={aiSettings.provider}
                    onChange={(event) => {
                      const provider = event.target.value as AiProvider
                      const firstModel = getFirstModelForProvider(provider)
                      setAiSettings((current) =>
                        current
                          ? {
                              ...current,
                              provider,
                              model:
                                aiProviderModels[provider]?.includes(current.model)
                                  ? current.model
                                  : firstModel,
                            }
                          : current
                      )
                    }}
                  >
                    <option value="openai">OpenAI</option>
                    <option value="deepseek">DeepSeek</option>
                    <option value="claude">Claude</option>
                  </select>
                </label>

                <label style={{ display: "grid", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Model</span>
                  <div style={{ display: "grid", gap: 8 }}>
                    <select
                      style={fieldStyle}
                      value={aiSettings.model}
                      onChange={(event) =>
                        setAiSettings((current) =>
                          current ? { ...current, model: event.target.value } : current
                        )
                      }
                    >
                      {(aiProviderModels[aiSettings.provider] || []).map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      style={fieldStyle}
                      value={aiSettings.model}
                      placeholder="Or type custom model"
                      onChange={(event) =>
                        setAiSettings((current) =>
                          current ? { ...current, model: event.target.value } : current
                        )
                      }
                    />
                  </div>
                </label>
              </div>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>OpenAI API Key</span>
                <input
                  type="password"
                  style={fieldStyle}
                  value={aiSettings.openai_api_key}
                  onChange={(event) =>
                    setAiSettings((current) =>
                      current
                        ? { ...current, openai_api_key: event.target.value }
                        : current
                    )
                  }
                />
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>DeepSeek API Key</span>
                <input
                  type="password"
                  style={fieldStyle}
                  value={aiSettings.deepseek_api_key}
                  onChange={(event) =>
                    setAiSettings((current) =>
                      current
                        ? { ...current, deepseek_api_key: event.target.value }
                        : current
                    )
                  }
                />
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Claude API Key</span>
                <input
                  type="password"
                  style={fieldStyle}
                  value={aiSettings.claude_api_key}
                  onChange={(event) =>
                    setAiSettings((current) =>
                      current
                        ? { ...current, claude_api_key: event.target.value }
                        : current
                    )
                  }
                />
              </label>
            </div>

            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>تعليمات عامة</span>
              <textarea
                rows={4}
                style={fieldStyle}
                value={settings.global_instructions}
                onChange={(event) =>
                  setSettings((current) =>
                    current
                      ? { ...current, global_instructions: event.target.value }
                      : current
                  )
                }
              />
            </label>

            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                تعليمات Meta Title
              </span>
              <textarea
                rows={3}
                style={fieldStyle}
                value={settings.meta_title_instructions}
                onChange={(event) =>
                  setSettings((current) =>
                    current
                      ? {
                          ...current,
                          meta_title_instructions: event.target.value,
                        }
                      : current
                  )
                }
              />
            </label>

            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                تعليمات Meta Description
              </span>
              <textarea
                rows={3}
                style={fieldStyle}
                value={settings.meta_description_instructions}
                onChange={(event) =>
                  setSettings((current) =>
                    current
                      ? {
                          ...current,
                          meta_description_instructions: event.target.value,
                        }
                      : current
                  )
                }
              />
            </label>

            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                تعليمات وصف المنتج
              </span>
              <textarea
                rows={4}
                style={fieldStyle}
                value={settings.product_description_instructions}
                onChange={(event) =>
                  setSettings((current) =>
                    current
                      ? {
                          ...current,
                          product_description_instructions: event.target.value,
                        }
                      : current
                  )
                }
              />
            </label>

            <div>
              <button
                type="button"
                style={buttonStyle}
                onClick={() => void saveSettings()}
                disabled={savingSettings}
              >
                {savingSettings ? "جارٍ الحفظ..." : "حفظ التعليمات"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ color: "#6b7280" }}>جارٍ تحميل الإعدادات...</div>
        )}
      </section>

      

      <section style={{ ...boxStyle, padding: 20 }}>
        <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
              المنتجات
            </h2>
            <span style={{ color: "#4b5563", fontSize: 13 }}>
              {visibleProducts.length} من {products.length}
            </span>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="ابحث باسم المنتج أو الـ handle"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={{ ...fieldStyle, maxWidth: 340 }}
            />
            <select
              value={filter}
              onChange={(event) =>
                setFilter(
                  event.target.value as
                    | "all"
                    | "missing_meta"
                    | "stale"
                    | "optimized"
                    | "not_optimized"
                    | "in_stock"
                    | "out_of_stock"
                )
              }
              style={{ ...fieldStyle, maxWidth: 220 }}
            >
              <option value="all">كل المنتجات</option>
              <option value="missing_meta">الناقص منها ميتا</option>
              <option value="stale">التي لم تُحدّث منذ 30 يومًا</option>
              <option value="optimized">تم تحسينها</option>
              <option value="not_optimized">غير محسّنة</option>
              <option value="in_stock">متوفر بالمخزون</option>
              <option value="out_of_stock">غير متوفر بالمخزون</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ color: "#6b7280" }}>جارٍ تحميل المنتجات...</div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {visibleProducts.map((product) => (
              <article
                key={product.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 16,
                  background: "#ffffff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "start",
                    justifyContent: "space-between",
                    gap: 12,
                    marginBottom: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 16,
                        fontWeight: 700,
                        lineHeight: 1.5,
                      }}
                    >
                      {product.title}
                    </h3>
                    <div
                      style={{
                        marginTop: 4,
                        color: "#6b7280",
                        fontSize: 12,
                        wordBreak: "break-all",
                      }}
                    >
                      {product.handle}
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "4px 8px",
                          borderRadius: 999,
                          background: product.is_optimized ? "#dcfce7" : "#fee2e2",
                          color: product.is_optimized ? "#166534" : "#991b1b",
                        }}
                      >
                        {product.is_optimized ? "تم تحسينه" : "غير محسّن"}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "4px 8px",
                          borderRadius: 999,
                          background: product.in_stock ? "#dbeafe" : "#e5e7eb",
                          color: product.in_stock ? "#1d4ed8" : "#374151",
                        }}
                      >
                        {product.in_stock ? "متوفر بالمخزون" : "غير متوفر بالمخزون"}
                      </span>
                      {actionKey.startsWith(`${product.id}:`) ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "4px 8px",
                            borderRadius: 999,
                            background: "#fef3c7",
                            color: "#92400e",
                          }}
                        >
                          جاري التوليد...
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      style={{
                        ...secondaryButtonStyle,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                      disabled={!!actionKey}
                      onClick={() => void generateAndSave(product.id, "all")}
                      title="توليد كل الحقول لهذا المنتج"
                    >
                      <Sparkles />
                      {actionKey === `${product.id}:all:generate`
                        ? "جارٍ توليد الكل..."
                        : "توليد الكل"}
                    </button>
                    <div style={{ color: "#6b7280", fontSize: 12, paddingTop: 10 }}>
                      {product.seo_last_optimized_at
                        ? `آخر تحديث: ${new Date(
                            product.seo_last_optimized_at
                          ).toLocaleString()}`
                        : "لم يتم التحسين بعد"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  {[
                    {
                      key: "meta_title" as const,
                      label: "Meta Title",
                      value: product.meta_title,
                    },
                    {
                      key: "meta_description" as const,
                      label: "Meta Description",
                      value: product.meta_description,
                    },
                    {
                      key: "description" as const,
                      label: "وصف المنتج",
                      value: stripHtml(product.description),
                    },
                  ].map((field) => (
                    <div
                      key={field.key}
                      style={{
                        border: "1px solid #f3f4f6",
                        borderRadius: 10,
                        padding: 12,
                        background: "#f9fafb",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          marginBottom: 8,
                        }}
                      >
                        <strong style={{ fontSize: 13 }}>{field.label}</strong>
                        <button
                          type="button"
                          style={buttonStyle}
                          disabled={!!actionKey}
                          onClick={() => void generateAndSave(product.id, field.key)}
                          title="توليد وحفظ"
                        >
                          {actionKey === `${product.id}:${field.key}:generate`
                            ? "جارٍ التوليد..."
                            : "توليد"}
                        </button>
                      </div>
                      <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                        {truncate(
                          field.value || "لا يوجد",
                          field.key === "description" ? 320 : 220
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {preview ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(17,24,39,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              ...boxStyle,
              width: "min(1100px, 100%)",
              maxHeight: "90vh",
              overflow: "auto",
              padding: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
                  معاينة قبل / بعد
                </h2>
                <p style={{ margin: "6px 0 0", color: "#4b5563", fontSize: 14 }}>
                  {preview.productTitle}
                </p>
              </div>
              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={() => setPreview(null)}
              >
                إغلاق
              </button>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              {[
                { key: "meta_title" as const, label: "Meta Title" },
                { key: "meta_description" as const, label: "Meta Description" },
                { key: "description" as const, label: "وصف المنتج" },
              ]
                .filter((field) => preview.target === "all" || preview.target === field.key)
                .map((field) => (
                  <div
                    key={field.key}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        padding: 12,
                        background: "#f9fafb",
                      }}
                    >
                      <strong style={{ display: "block", marginBottom: 8 }}>
                        قبل: {field.label}
                      </strong>
                      <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                        {field.key === "description"
                          ? stripHtml(preview.before[field.key]) || "لا يوجد"
                          : preview.before[field.key] || "لا يوجد"}
                      </div>
                    </div>
                    <div
                      style={{
                        border: "1px solid #bbf7d0",
                        borderRadius: 12,
                        padding: 12,
                        background: "#f0fdf4",
                      }}
                    >
                      <strong style={{ display: "block", marginBottom: 8 }}>
                        بعد: {field.label}
                      </strong>
                      <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                        {field.key === "description"
                          ? stripHtml(preview.after[field.key]) || "لا يوجد"
                          : preview.after[field.key] || "لا يوجد"}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 20,
              }}
            >
              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={() => setPreview(null)}
              >
                إلغاء
              </button>
              <button
                type="button"
                style={buttonStyle}
                disabled={!!actionKey}
                onClick={() => void applyPreview()}
              >
                {actionKey === `${preview.productId}:${preview.target}:apply`
                  ? "جارٍ الحفظ..."
                  : "اعتماد وحفظ"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "SEO",
  icon: Sparkles,
})

export default SeoPage


