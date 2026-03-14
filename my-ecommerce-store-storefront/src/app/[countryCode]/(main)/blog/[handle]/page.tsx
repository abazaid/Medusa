import { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"

import { retrieveBlogPost } from "@lib/data/blog"
import { getLocale } from "@lib/data/locale-actions"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { getBaseURL } from "@lib/util/env"
import { generateBreadcrumbJsonLd } from "@lib/util/structured-data"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Breadcrumbs from "@modules/common/components/breadcrumbs"
import ProductPreview from "@modules/products/components/product-preview"

type PageProps = {
  params: Promise<{ countryCode: string; handle: string }>
}

const extractProductHandles = (html: string) => {
  const handles: string[] = []
  const seen = new Set<string>()
  const pattern =
    /href=["'](?:https?:\/\/[^"']+)?\/(?:[a-z]{2}\/)?products\/([^"'/?#]+)["']/gi

  let match = pattern.exec(html)
  while (match) {
    const rawHandle = match[1]
    const decodedHandle = (() => {
      try {
        return decodeURIComponent(rawHandle)
      } catch {
        return rawHandle
      }
    })()
      .trim()
      .toLowerCase()

    if (decodedHandle && !seen.has(decodedHandle)) {
      seen.add(decodedHandle)
      handles.push(decodedHandle)
    }

    match = pattern.exec(html)
  }

  return handles.slice(0, 8)
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

  const region = await getRegion(params.countryCode)
  const mentionedHandles = extractProductHandles(post.content || "")
  const mentionedProducts =
    region && mentionedHandles.length
      ? (
          await Promise.all(
            mentionedHandles.map(async (handle) => {
              const { response } = await listProducts({
                countryCode: params.countryCode,
                queryParams: {
                  limit: 1,
                  handle,
                } as any,
                disableCache: true,
              })

              return response.products?.[0] || null
            })
          )
        ).filter(Boolean)
      : []

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
            className="mt-8 max-w-none text-base leading-8 text-secondary-800 [&_a]:font-semibold [&_a]:text-primary-700 [&_a]:underline [&_blockquote]:my-6 [&_blockquote]:rounded-lg [&_blockquote]:border-r-4 [&_blockquote]:border-emerald-500 [&_blockquote]:bg-emerald-50 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:text-emerald-900 [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-secondary-900 [&_h3]:mt-7 [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-secondary-900 [&_li]:mb-2 [&_p]:mb-4 [&_ul]:mb-5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pr-6"
            dangerouslySetInnerHTML={{ __html: post.content || "" }}
          />

          {mentionedProducts.length ? (
            <section className="mt-10 rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-xl font-bold text-secondary-900">
                {isArabic ? "منتجات مذكورة في المقال" : "Products Mentioned In This Article"}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {isArabic
                  ? "اختيارات مرتبطة مباشرة بمحتوى المقال لسرعة الشراء والمقارنة."
                  : "Direct picks related to this guide for faster comparison and checkout."}
              </p>
              <ul className="mt-5 grid grid-cols-2 gap-4 small:grid-cols-3 medium:grid-cols-4">
                {mentionedProducts.map((product) => (
                  <li key={product.id}>
                    <ProductPreview
                      product={product}
                      region={region}
                      cardVariant="category"
                      showQuickAdd
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

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
