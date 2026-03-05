import { HttpTypes } from "@medusajs/types"
import { getBaseURL } from "./env"
import { getBrandByHandle, resolveBrand } from "@lib/data/brands"

const getProductBrandName = (product: HttpTypes.StoreProduct) => {
  const metadata = (product.metadata as Record<string, unknown> | null) || {}
  const brand =
    (typeof metadata.brand_handle === "string" &&
      getBrandByHandle(metadata.brand_handle)) ||
    (typeof metadata.brand_name_ar === "string" && resolveBrand(metadata.brand_name_ar)) ||
    (typeof metadata.brand_name_en === "string" && resolveBrand(metadata.brand_name_en)) ||
    (typeof metadata.source_brand === "string" && resolveBrand(metadata.source_brand))

  return brand?.nameEn || "Vape Hub KSA"
}

export function generateProductJsonLd(
  product: HttpTypes.StoreProduct,
  region: HttpTypes.StoreRegion,
  countryCode: string
) {
  const defaultVariant = product.variants?.[0]
  const price = defaultVariant?.calculated_price
  const baseUrl = getBaseURL()
  const productUrl = `${baseUrl}/${countryCode}/products/${product.handle}`
  const brandName = getProductBrandName(product)

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || "",
    image: product.thumbnail ? [product.thumbnail] : [],
    sku: defaultVariant?.sku,
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: price?.currency_code || region.currency_code,
      price:
        typeof price?.calculated_amount === "number"
          ? price.calculated_amount.toFixed(2)
          : "0.00",
      availability: defaultVariant?.inventory_quantity && defaultVariant.inventory_quantity > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  }
}

export function generateBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function generateOrganizationJsonLd() {
  const baseUrl = getBaseURL()

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}#organization`,
    name: "Vape Hub KSA",
    alternateName: "مركز الفيب السعودي",
    url: baseUrl,
    slogan: "Your Vaping Hub in Saudi Arabia",
    logo: `${baseUrl}/icon.png`,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        areaServed: "SA",
        availableLanguage: ["ar", "en"],
      },
    ],
  }
}
