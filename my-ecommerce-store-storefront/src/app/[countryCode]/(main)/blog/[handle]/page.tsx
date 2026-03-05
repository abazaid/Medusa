import { Metadata } from "next"
import { notFound } from "next/navigation"

import { retrieveBlogPost } from "@lib/data/blog"
import { getLocale } from "@lib/data/locale-actions"
import { getBaseURL } from "@lib/util/env"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type PageProps = {
  params: Promise<{ countryCode: string; handle: string }>
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params
  const locale = await getLocale()
  const post = await retrieveBlogPost({
    handle: params.handle,
    locale,
  })

  if (!post) {
    return {}
  }

  const canonical =
    post.canonical_url || `${getBaseURL()}/${params.countryCode}/blog/${post.handle}`

  const title = post.meta_title || post.title
  const description = post.meta_description || post.excerpt || post.title

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      images: post.cover_image ? [{ url: post.cover_image }] : [],
    },
  }
}

export default async function BlogPostPage(props: PageProps) {
  const params = await props.params
  const locale = await getLocale()
  const isArabic = locale.toLowerCase() === "ar"

  const post = await retrieveBlogPost({
    handle: params.handle,
    locale,
  })

  if (!post) {
    notFound()
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.meta_description || post.excerpt,
    image: post.cover_image || undefined,
    datePublished: post.published_at || post.created_at || undefined,
    dateModified: post.updated_at || undefined,
    mainEntityOfPage: `${getBaseURL()}/${params.countryCode}/blog/${post.handle}`,
  }

  return (
    <div className="bg-[#eef0f3] py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <div className="content-container">
        <article className="rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
          <LocalizedClientLink
            href="/blog"
            className="text-sm font-semibold text-primary-700 transition-colors hover:text-primary-600"
          >
            {isArabic ? "العودة للمدونة" : "Back to blog"}
          </LocalizedClientLink>

          <h1 className="mt-4 text-3xl font-bold leading-tight text-secondary-900 md:text-4xl">
            {post.title}
          </h1>

          {post.cover_image ? (
            <img
              src={post.cover_image}
              alt={post.title}
              className="mt-6 max-h-[420px] w-full rounded-xl object-cover"
            />
          ) : null}

          {post.excerpt ? (
            <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-base leading-8 text-secondary-700">
              {post.excerpt}
            </p>
          ) : null}

          <div
            className="prose prose-slate mt-8 max-w-none leading-8"
            dangerouslySetInnerHTML={{ __html: post.content || "" }}
          />
        </article>
      </div>
    </div>
  )
}
