import { getLocale } from "@lib/data/locale-actions"
import { getBaseURL } from "@lib/util/env"
import { Metadata, Viewport } from "next"
import Script from "next/script"
import "styles/globals.css"

const googleSiteVerification = process.env.NEXT_PUBLIC_GSC_VERIFICATION
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "Vape Hub KSA | Best Vape Shop in Saudi Arabia - Free Delivery",
    template: "%s | Vape Hub KSA",
  },
  description:
    "Vape Hub KSA is your one-stop shop for premium vape devices, e-liquids, and accessories in Saudi Arabia. Free same-day delivery in Riyadh, Jeddah & Dammam. Shop now!",
  verification: googleSiteVerification
    ? {
        google: googleSiteVerification,
      }
    : undefined,
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
  await getLocale()

  return (
    <html lang="ar" data-mode="light" dir="rtl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className="antialiased">
        <main className="min-h-screen">{props.children}</main>
        {gaMeasurementId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaMeasurementId}');`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  )
}
