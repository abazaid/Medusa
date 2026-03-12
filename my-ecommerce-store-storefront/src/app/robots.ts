import { MetadataRoute } from "next"

import { getBaseURL } from "@lib/util/env"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseURL()

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/api/",
          "/ar/cart",
          "/ar/checkout",
          "/ar/account",
          "/ar/order",
          "/*?*q=*",
          "/*?*page=*",
          "/*?*sortBy=*",
          "/*?*filter=*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
