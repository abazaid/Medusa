import { NextRequest, NextResponse } from "next/server"

const DEFAULT_ALLOWED_HOSTS = [
  "cdn.salla.sa",
  "medusa-public-images.s3.eu-west-1.amazonaws.com",
  "img.youtube.com",
]

const parseAllowedHosts = () => {
  const raw =
    process.env.IMAGE_PROXY_ALLOWED_HOSTS ||
    process.env.NEXT_PUBLIC_IMAGE_PROXY_ALLOWED_HOSTS ||
    ""

  const list = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

  return list.length ? list : DEFAULT_ALLOWED_HOSTS
}

const isAllowedHost = (host: string, allowedHosts: string[]) => {
  const normalized = host.toLowerCase()
  return allowedHosts.some((allowed) => normalized === allowed || normalized.endsWith(`.${allowed}`))
}

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("url")
  if (!target) {
    return new NextResponse("Missing url parameter", { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(target)
  } catch {
    return new NextResponse("Invalid url parameter", { status: 400 })
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return new NextResponse("Unsupported protocol", { status: 400 })
  }

  const allowedHosts = parseAllowedHosts()
  if (!isAllowedHost(parsed.hostname, allowedHosts)) {
    return new NextResponse("Host not allowed", { status: 403 })
  }

  const upstream = await fetch(parsed.toString(), {
    headers: {
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    },
    next: { revalidate: 60 * 60 * 24 * 7 },
  })

  if (!upstream.ok || !upstream.body) {
    return new NextResponse("Unable to fetch image", { status: 502 })
  }

  const contentType =
    upstream.headers.get("content-type") || "image/jpeg"

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control":
        "public, max-age=31536000, s-maxage=31536000, immutable, stale-while-revalidate=86400",
      Vary: "Accept",
    },
  })
}

