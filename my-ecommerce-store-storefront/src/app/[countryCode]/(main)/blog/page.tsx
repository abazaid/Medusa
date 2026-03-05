import { Metadata } from "next"
import Image from "next/image"

import { listBlogPosts } from "@lib/data/blog"
import { getLocale } from "@lib/data/locale-actions"
import { getBaseURL } from "@lib/util/env"
import { generateBreadcrumbJsonLd } from "@lib/util/structured-data"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Breadcrumbs from "@modules/common/components/breadcrumbs"

type PageProps = {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params
  const isArabic = params.countryCode.toLowerCase() === "ar"
  const title = isArabic ? "المدونة | مقالات ونصائح الفيب" : "Blog | Vape Guides & Tips"
  const description = isArabic
    ? "تصفح مقالات المدونة: أدلة، نصائح شراء، ومقارنات تساعدك تختار المنتج المناسب."
    : "Browse blog posts with guides, buying tips, and comparisons to choose the right products."
  const canonical = `${getBaseURL()}/${params.countryCode}/blog`

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ar: `${getBaseURL()}/ar/blog`,
        en: `${getBaseURL()}/en/blog`,
        "x-default": `${getBaseURL()}/ar/blog`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
  }
}

export default async function BlogPage(props: PageProps) {
  const params = await props.params
  const locale = await getLocale()
  const isArabic = locale.toLowerCase() === "ar"
  const posts = await listBlogPosts({ locale, limit: 60 })

  const pageTitle = isArabic ? "مدونة المتجر" : "Store Blog"
  const pageDescription = isArabic
    ? "محتوى معرفي وتجاري يدعم قرارات الشراء ويغطي أحدث اتجاهات سوق الفيب."
    : "Educational and commercial content that supports purchase decisions and covers vape trends."
  const pageUrl = `${getBaseURL()}/${params.countryCode}/blog`

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: posts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${pageUrl}/${post.handle}`,
      name: post.title,
    })),
  }
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: isArabic ? "الرئيسية" : "Home", url: `${getBaseURL()}/${params.countryCode}` },
    { name: pageTitle, url: pageUrl },
  ])

  return (
    <div className="bg-[#eef0f3] py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="content-container">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
          <Breadcrumbs
            items={[
              { label: isArabic ? "الرئيسية" : "Home", href: "/" },
              { label: pageTitle },
            ]}
          />
          <h1 className="text-3xl font-bold text-secondary-900 md:text-4xl">{pageTitle}</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-secondary-700">{pageDescription}</p>

          {posts.length ? (
            <ul className="mt-10 grid gap-6 md:grid-cols-2">
              {posts.map((post) => (
                <li key={post.id} className="rounded-xl border border-slate-200 bg-white p-5">
                  {post.cover_image ? (
                    <Image
                      src={post.cover_image}
                      alt={post.title}
                      width={1200}
                      height={630}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="h-44 w-full rounded-lg object-cover"
                    />
                  ) : null}
                  <h2 className="mt-4 text-xl font-bold text-secondary-900">{post.title}</h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-7 text-secondary-700">
                    {post.excerpt || post.meta_description}
                  </p>
                  <LocalizedClientLink
                    href={`/blog/${post.handle}`}
                    className="mt-4 inline-flex text-sm font-semibold text-primary-700 hover:text-primary-600"
                  >
                    {isArabic ? "قراءة المقال" : "Read post"}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-sm text-slate-600">
              {isArabic
                ? "لا توجد مقالات منشورة بعد."
                : "No published blog posts yet."}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
