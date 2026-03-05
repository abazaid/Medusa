import { buildLocaleSitemapXml } from "@lib/util/sitemap"

export async function GET() {
  const xml = await buildLocaleSitemapXml("en")

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
