import { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"

import { retrieveBlogPost } from "@lib/data/blog"
import { getLocale } from "@lib/data/locale-actions"
import { getBaseURL } from "@lib/util/env"
import { generateBreadcrumbJsonLd } from "@lib/util/structured-data"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Breadcrumbs from "@modules/common/components/breadcrumbs"

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

  const canonical = `${getBaseURL()}/${params.countryCode}/blog/${post.handle}`

  const title = post.meta_title || post.title
  const description = post.meta_description || post.excerpt || post.title

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ar: `${getBaseURL()}/ar/blog/${post.handle}`,
        en: `${getBaseURL()}/en/blog/${post.handle}`,
        "x-default": `${getBaseURL()}/ar/blog/${post.handle}`,
      },
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
  const breadcrumbSchema = generateBreadcrumbJsonLd([
    { name: isArabic ? "الرئيسية" : "Home", url: `${getBaseURL()}/${params.countryCode}` },
    { name: isArabic ? "المدونة" : "Blog", url: `${getBaseURL()}/${params.countryCode}/blog` },
    {
      name: post.title,
      url: `${getBaseURL()}/${params.countryCode}/blog/${post.handle}`,
    },
  ])

  return (
    <div className="bg-[#eef0f3] py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="content-container">
        <article className="rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
          <Breadcrumbs
            items={[
              { label: isArabic ? "الرئيسية" : "Home", href: "/" },
              { label: isArabic ? "المدونة" : "Blog", href: "/blog" },
              { label: post.title },
            ]}
          />
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
            <Image
              src={post.cover_image}
              alt={post.title}
              width={1400}
              height={700}
              sizes="100vw"
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

          <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-bold text-secondary-900">
              {isArabic ? "روابط داخلية مفيدة" : "Helpful internal links"}
            </h2>
            <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold">
              <LocalizedClientLink href="/store" className="text-primary-700 hover:text-primary-600">
                {isArabic ? "تصفح المنتجات" : "Browse products"}
              </LocalizedClientLink>
              <LocalizedClientLink href="/brands" className="text-primary-700 hover:text-primary-600">
                {isArabic ? "أرشيف الماركات" : "Brands archive"}
              </LocalizedClientLink>
              <LocalizedClientLink href="/blog" className="text-primary-700 hover:text-primary-600">
                {isArabic ? "كل المقالات" : "All blog posts"}
              </LocalizedClientLink>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
