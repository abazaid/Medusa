"use client"

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Sparkles } from "@medusajs/icons"
import { useEffect, useMemo, useState } from "react"

type BlogPost = {
  id: string
  handle: string
  status: string
  title_ar: string
  title_en: string
  excerpt_ar: string
  excerpt_en: string
  content_ar: string
  content_en: string
  cover_image: string
  meta_title_ar: string
  meta_title_en: string
  meta_description_ar: string
  meta_description_en: string
  canonical_url: string
  published_at: string
  created_at?: string
  updated_at?: string
}

type BlogResponse = {
  posts: BlogPost[]
}

const emptyForm: Omit<BlogPost, "id"> = {
  handle: "",
  status: "draft",
  title_ar: "",
  title_en: "",
  excerpt_ar: "",
  excerpt_en: "",
  content_ar: "",
  content_en: "",
  cover_image: "",
  meta_title_ar: "",
  meta_title_en: "",
  meta_description_ar: "",
  meta_description_en: "",
  canonical_url: "",
  published_at: "",
}

const inputStyle = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
}

const textareaStyle = {
  ...inputStyle,
  minHeight: 110,
  resize: "vertical" as const,
  lineHeight: 1.7,
}

const buttonStyle = {
  border: "1px solid #111827",
  borderRadius: 10,
  background: "#111827",
  color: "#fff",
  padding: "8px 12px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
}

const secondaryButtonStyle = {
  border: "1px solid #d1d5db",
  borderRadius: 10,
  background: "#fff",
  color: "#111827",
  padding: "8px 12px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
}

const BlogPage = () => {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"all" | "draft" | "published">("all")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [editingId, setEditingId] = useState("")
  const [form, setForm] = useState<Omit<BlogPost, "id">>(emptyForm)

  const loadPosts = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/admin/blog", { credentials: "include" })
      if (!response.ok) {
        throw new Error("Failed to load blog posts.")
      }
      const payload = (await response.json()) as BlogResponse
      setPosts(payload.posts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load blog posts.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPosts()
  }, [])

  const visiblePosts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return posts.filter((post) => {
      if (status !== "all" && post.status !== status) return false
      if (!q) return true
      const text = [post.title_ar, post.title_en, post.handle, post.excerpt_ar, post.excerpt_en]
        .join(" ")
        .toLowerCase()
      return text.includes(q)
    })
  }, [posts, search, status])

  const resetForm = () => {
    setEditingId("")
    setForm(emptyForm)
  }

  const startEdit = (post: BlogPost) => {
    setEditingId(post.id)
    setForm({
      handle: post.handle || "",
      status: post.status || "draft",
      title_ar: post.title_ar || "",
      title_en: post.title_en || "",
      excerpt_ar: post.excerpt_ar || "",
      excerpt_en: post.excerpt_en || "",
      content_ar: post.content_ar || "",
      content_en: post.content_en || "",
      cover_image: post.cover_image || "",
      meta_title_ar: post.meta_title_ar || "",
      meta_title_en: post.meta_title_en || "",
      meta_description_ar: post.meta_description_ar || "",
      meta_description_en: post.meta_description_en || "",
      canonical_url: post.canonical_url || "",
      published_at: post.published_at || "",
    })
    setError("")
    setMessage("")
  }

  const savePost = async () => {
    setSaving(true)
    setError("")
    setMessage("")
    try {
      const endpoint = editingId ? `/admin/blog/${editingId}` : "/admin/blog"
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      })

      const payload = (await response.json()) as { message?: string }
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to save post.")
      }

      await loadPosts()
      setMessage(editingId ? "تم تحديث المقال." : "تم إنشاء المقال.")
      if (!editingId) {
        resetForm()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save post.")
    } finally {
      setSaving(false)
    }
  }

  const removePost = async (id: string) => {
    setDeletingId(id)
    setError("")
    setMessage("")
    try {
      const response = await fetch(`/admin/blog/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      const payload = (await response.json()) as { message?: string }
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to delete post.")
      }

      setPosts((prev) => prev.filter((post) => post.id !== id))
      if (editingId === id) {
        resetForm()
      }
      setMessage("تم حذف المقال.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post.")
    } finally {
      setDeletingId("")
    }
  }

  return (
    <div style={{ display: "grid", gap: 16, paddingBottom: 48 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>Blog</h1>
        <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
          إدارة المدونة مع دعم SEO (عربي/إنجليزي) عبر لوحة التحكم.
        </p>
      </div>

      {message ? (
        <div style={{ border: "1px solid #bbf7d0", background: "#f0fdf4", borderRadius: 10, padding: 10 }}>{message}</div>
      ) : null}
      {error ? (
        <div style={{ border: "1px solid #fecaca", background: "#fef2f2", borderRadius: 10, padding: 10 }}>{error}</div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(360px,420px)", gap: 16 }}>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: 14 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input style={inputStyle} placeholder="بحث..." value={search} onChange={(event) => setSearch(event.target.value)} />
            <select style={{ ...inputStyle, width: 150 }} value={status} onChange={(event) => setStatus(event.target.value as any)}>
              <option value="all">الكل</option>
              <option value="published">منشور</option>
              <option value="draft">مسودة</option>
            </select>
          </div>
          <div style={{ display: "grid", gap: 8, maxHeight: 640, overflow: "auto" }}>
            {loading ? (
              <div style={{ color: "#6b7280" }}>جاري تحميل المقالات...</div>
            ) : visiblePosts.length ? (
              visiblePosts.map((post) => (
                <div key={post.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {post.title_ar || post.title_en || post.handle}
                      </div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>/{post.handle}</div>
                    </div>
                    <span
                      style={{
                        borderRadius: 999,
                        padding: "3px 8px",
                        fontSize: 12,
                        border: "1px solid #d1d5db",
                        background: post.status === "published" ? "#ecfeff" : "#f9fafb",
                        color: post.status === "published" ? "#0369a1" : "#6b7280",
                        height: "fit-content",
                      }}
                    >
                      {post.status === "published" ? "منشور" : "مسودة"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button type="button" style={secondaryButtonStyle} onClick={() => startEdit(post)}>
                      تعديل
                    </button>
                    <button
                      type="button"
                      style={{ ...secondaryButtonStyle, borderColor: "#ef4444", color: "#b91c1c" }}
                      disabled={deletingId === post.id}
                      onClick={() => void removePost(post.id)}
                    >
                      {deletingId === post.id ? "جاري الحذف..." : "حذف"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: "#6b7280" }}>لا توجد نتائج.</div>
            )}
          </div>
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: 14, display: "grid", gap: 10 }}>
          <h3 style={{ margin: 0 }}>{editingId ? "تعديل مقال" : "مقال جديد"}</h3>
          <input style={inputStyle} placeholder="العنوان العربي" value={form.title_ar} onChange={(event) => setForm((prev) => ({ ...prev, title_ar: event.target.value }))} />
          <input style={inputStyle} placeholder="English Title" value={form.title_en} onChange={(event) => setForm((prev) => ({ ...prev, title_en: event.target.value }))} />
          <input style={inputStyle} placeholder="Handle (slug)" value={form.handle} onChange={(event) => setForm((prev) => ({ ...prev, handle: event.target.value }))} />
          <select style={inputStyle} value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}>
            <option value="draft">مسودة</option>
            <option value="published">منشور</option>
          </select>
          <input style={inputStyle} placeholder="Cover image URL" value={form.cover_image} onChange={(event) => setForm((prev) => ({ ...prev, cover_image: event.target.value }))} />
          <input style={inputStyle} placeholder="Canonical URL" value={form.canonical_url} onChange={(event) => setForm((prev) => ({ ...prev, canonical_url: event.target.value }))} />
          <textarea style={textareaStyle} placeholder="ملخص عربي" value={form.excerpt_ar} onChange={(event) => setForm((prev) => ({ ...prev, excerpt_ar: event.target.value }))} />
          <textarea style={textareaStyle} placeholder="English excerpt" value={form.excerpt_en} onChange={(event) => setForm((prev) => ({ ...prev, excerpt_en: event.target.value }))} />
          <textarea style={textareaStyle} placeholder="محتوى عربي (HTML أو نص)" value={form.content_ar} onChange={(event) => setForm((prev) => ({ ...prev, content_ar: event.target.value }))} />
          <textarea style={textareaStyle} placeholder="English content (HTML or text)" value={form.content_en} onChange={(event) => setForm((prev) => ({ ...prev, content_en: event.target.value }))} />
          <input style={inputStyle} placeholder="Meta Title (AR)" value={form.meta_title_ar} onChange={(event) => setForm((prev) => ({ ...prev, meta_title_ar: event.target.value }))} />
          <input style={inputStyle} placeholder="Meta Title (EN)" value={form.meta_title_en} onChange={(event) => setForm((prev) => ({ ...prev, meta_title_en: event.target.value }))} />
          <textarea style={textareaStyle} placeholder="Meta Description (AR)" value={form.meta_description_ar} onChange={(event) => setForm((prev) => ({ ...prev, meta_description_ar: event.target.value }))} />
          <textarea style={textareaStyle} placeholder="Meta Description (EN)" value={form.meta_description_en} onChange={(event) => setForm((prev) => ({ ...prev, meta_description_en: event.target.value }))} />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" style={buttonStyle} disabled={saving} onClick={() => void savePost()}>
              {saving ? "جاري الحفظ..." : editingId ? "حفظ التعديل" : "إنشاء المقال"}
            </button>
            <button type="button" style={secondaryButtonStyle} onClick={resetForm}>
              تفريغ
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Blog",
  icon: Sparkles,
})

export default BlogPage
