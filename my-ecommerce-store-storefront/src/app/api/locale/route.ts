import { sdk } from "@lib/config"
import {
  getAuthHeaders,
  getCacheTag,
  getCartId,
} from "@lib/data/cookies"
import { revalidateTag } from "next/cache"
import { cookies as nextCookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

const LOCALE_COOKIE_NAME = "_medusa_locale"
const DEFAULT_LOCALE = "ar"

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { locale?: string }
    const nextLocale = body.locale?.toLowerCase() === "en" ? "en" : DEFAULT_LOCALE

    const cookies = await nextCookies()
    cookies.set(LOCALE_COOKIE_NAME, nextLocale, {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    })

    const cartId = await getCartId()

    if (cartId) {
      const headers = {
        ...(await getAuthHeaders()),
      }

      await sdk.store.cart.update(cartId, { locale: nextLocale }, {}, headers)
    }

    for (const tag of ["carts", "products", "categories", "collections"]) {
      const cacheTag = await getCacheTag(tag)
      if (cacheTag) {
        revalidateTag(cacheTag)
      }
    }

    return NextResponse.json({ locale: nextLocale })
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to update locale.",
      },
      { status: 500 }
    )
  }
}
