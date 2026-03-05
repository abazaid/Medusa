import { NextRequest, NextResponse } from "next/server"

const DEFAULT_LOCALE_SEGMENT = "ar"
const SUPPORTED_LOCALE_SEGMENTS = new Set(["ar", "en"])

const isStaticAsset = (pathname: string) =>
  pathname.includes(".") ||
  pathname.startsWith("/api") ||
  pathname.startsWith("/_next") ||
  pathname.startsWith("/images") ||
  pathname.startsWith("/assets")

const normalizePathname = (pathname: string) => {
  let normalized = pathname.replace(/\/{2,}/g, "/")

  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1)
  }

  normalized = normalized.replace(/[A-Z]/g, (char) => char.toLowerCase())

  return normalized
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (isStaticAsset(pathname)) {
    return NextResponse.next()
  }

  const normalizedPathname = normalizePathname(pathname)
  if (normalizedPathname !== pathname) {
    return NextResponse.redirect(
      `${request.nextUrl.origin}${normalizedPathname}${search || ""}`,
      308
    )
  }

  const segments = normalizedPathname.split("/").filter(Boolean)
  const first = (segments[0] || "").toLowerCase()

  // Backward compatibility: /sa/* -> /ar/*
  if (first === "sa") {
    const restPath = `/${segments.slice(1).join("/")}`
    const destination = `${request.nextUrl.origin}/ar${restPath === "/" ? "" : restPath}${search || ""}`
    const response = NextResponse.redirect(destination, 307)
    response.cookies.set("_medusa_locale", "ar", {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    })
    return response
  }

  // Force locale prefix in URL: /ar/* or /en/*
  if (!SUPPORTED_LOCALE_SEGMENTS.has(first)) {
    const destination = `${request.nextUrl.origin}/${DEFAULT_LOCALE_SEGMENT}${normalizedPathname}${search || ""}`
    const response = NextResponse.redirect(destination, 307)
    response.cookies.set("_medusa_locale", DEFAULT_LOCALE_SEGMENT, {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    })
    return response
  }

  const response = NextResponse.next()
  response.cookies.set("_medusa_locale", first, {
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })

  if (!request.cookies.get("_medusa_cache_id")?.value) {
    response.cookies.set("_medusa_cache_id", crypto.randomUUID(), {
      maxAge: 60 * 60 * 24,
    })
  }

  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
