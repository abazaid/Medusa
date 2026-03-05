"use server"

import { sdk } from "@lib/config"
import { getLocale } from "@lib/data/locale-actions"

export type BlogPost = {
  id: string
  handle: string
  status: string
  title: string
  excerpt: string
  content: string
  cover_image: string
  meta_title: string
  meta_description: string
  canonical_url: string
  published_at: string
  created_at?: string
  updated_at?: string
}

export const listBlogPosts = async ({
  locale,
  q,
  limit = 30,
}: {
  locale?: string
  q?: string
  limit?: number
} = {}): Promise<BlogPost[]> => {
  const activeLocale = locale || (await getLocale())
  return sdk.client
    .fetch<{ posts: BlogPost[] }>("/store/blog", {
      method: "GET",
      query: {
        locale: activeLocale,
        q,
        limit,
      },
      cache: "no-store",
    })
    .then((response) => response.posts || [])
}

export const retrieveBlogPost = async ({
  handle,
  locale,
}: {
  handle: string
  locale?: string
}): Promise<BlogPost | null> => {
  const activeLocale = locale || (await getLocale())
  return sdk.client
    .fetch<{ post: BlogPost }>(`/store/blog/${encodeURIComponent(handle)}`, {
      method: "GET",
      query: {
        locale: activeLocale,
      },
      cache: "no-store",
    })
    .then((response) => response.post || null)
    .catch(() => null)
}
