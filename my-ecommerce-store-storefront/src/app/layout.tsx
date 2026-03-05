import { getLocale } from "@lib/data/locale-actions"
import { getBaseURL } from "@lib/util/env"
import { Metadata, Viewport } from "next"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "Vape Hub KSA | Best Vape Shop in Saudi Arabia - Free Delivery",
    template: "%s | Vape Hub KSA",
  },
  description:
    "Vape Hub KSA is your one-stop shop for premium vape devices, e-liquids, and accessories in Saudi Arabia. Free same-day delivery in Riyadh, Jeddah & Dammam. Shop now!",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default async function RootLayout(props: { 
  children: React.ReactNode
  params: Promise<{ countryCode: string }>
}) {
  const locale = await getLocale()
  const isArabic = locale.toLowerCase() === "ar"

  return (
    <html lang={isArabic ? "ar" : "en"} data-mode="light" dir={isArabic ? "rtl" : "ltr"}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className="antialiased">
        <main className="min-h-screen">{props.children}</main>
      </body>
    </html>
  )
}
