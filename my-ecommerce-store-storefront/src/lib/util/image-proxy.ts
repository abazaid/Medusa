const DEFAULT_ALLOWED_HOSTS = [
  "cdn.salla.sa",
  "medusa-public-images.s3.eu-west-1.amazonaws.com",
  "img.youtube.com",
]

const IMAGE_PROXY_ENABLED =
  (process.env.NEXT_PUBLIC_IMAGE_PROXY_ENABLED || "true").toLowerCase() !== "false"

const parseAllowedHosts = () => {
  const raw = process.env.NEXT_PUBLIC_IMAGE_PROXY_ALLOWED_HOSTS || ""
  const list = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

  return list.length ? list : DEFAULT_ALLOWED_HOSTS
}

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")

const getExtensionFromUrl = (url: URL) => {
  const match = url.pathname.match(/\.([a-zA-Z0-9]{2,5})$/)
  const ext = (match?.[1] || "jpg").toLowerCase()
  if (["jpg", "jpeg", "png", "webp", "avif", "gif"].includes(ext)) {
    return ext
  }
  return "jpg"
}

const isAllowedHost = (host: string, allowedHosts: string[]) => {
  const normalized = host.toLowerCase()
  return allowedHosts.some((allowed) => normalized === allowed || normalized.endsWith(`.${allowed}`))
}

export const toProxyImageUrl = ({
  url,
  title,
}: {
  url?: string | null
  title?: string
}) => {
  if (!IMAGE_PROXY_ENABLED || !url) {
    return url || ""
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return url
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return url
  }

  const allowedHosts = parseAllowedHosts()
  if (!isAllowedHost(parsed.hostname, allowedHosts)) {
    return url
  }

  const baseName = toSlug(title || parsed.pathname.split("/").pop() || "product-image") || "product-image"
  const ext = getExtensionFromUrl(parsed)
  const slug = `${baseName}.${ext}`

  return `/api/image-proxy/${encodeURIComponent(slug)}?url=${encodeURIComponent(url)}`
}

