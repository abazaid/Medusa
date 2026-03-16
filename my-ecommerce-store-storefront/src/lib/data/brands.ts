import { listProducts } from "@lib/data/products"
import { isProductInStock, sortByAvailability } from "@lib/util/product-availability"
import type { HttpTypes } from "@medusajs/types"

export type Brand = {
  handle: string
  nameAr: string
  nameEn: string
  logo: string
}

export const brands: Brand[] = [
  { handle: "vgod", nameAr: "فيقود - VGOD", nameEn: "VGOD", logo: "https://cdn.salla.sa/zvExb/9JbJ30m1BOEoqhHB1zw4ivHCifIiCCVvZ8mYjZXv.jpg" },
  { handle: "nasty-juice", nameAr: "ناستي Nasty Juice", nameEn: "Nasty Juice", logo: "https://cdn.salla.sa/zvExb/bTC4UEu735rRj6YZ87CNXx31mFtUst8IIrWyPaJy.png" },
  { handle: "uwell", nameAr: "يو ويل Uwell", nameEn: "Uwell", logo: "https://cdn.salla.sa/zvExb/fPxMwLljpqQ2fjDAQ4AH359Sg6xQ8SxWmaAKLgqo.png" },
  { handle: "gummy", nameAr: "قمي - GUMMY", nameEn: "GUMMY", logo: "https://cdn.salla.sa/zvExb/dY9qBGx2N0q8nafRkN3ZWufRsvxjV7rLDGWUodc4.png" },
  { handle: "vaporesso", nameAr: "فابريسو Vaporesso", nameEn: "Vaporesso", logo: "https://cdn.salla.sa/zvExb/LBDVnd7rrKDHut3VkP6PlTqP5EJR4Kbln2USJIPL.png" },
  { handle: "geekvape", nameAr: "جيك فيب Geekvape", nameEn: "Geekvape", logo: "https://cdn.salla.sa/zvExb/Muo5AoWeNTZBSfE3hOd6zW1pOh8CM163P1PdztAa.jpg" },
  { handle: "samsvape", nameAr: "سامز فيب SamsVape", nameEn: "SamsVape", logo: "https://cdn.salla.sa/zvExb/XpemQCYQvkLfbhnTuXEgTeucfby5UUxkl7LJSA3D.png" },
  { handle: "dr-vape", nameAr: "دكتور فيب Dr Vape", nameEn: "Dr Vape", logo: "https://cdn.salla.sa/zvExb/y5t26yvixIDAwVpVMt3TjIYwqdhahkLFeVOykttq.png" },
  { handle: "mazaj", nameAr: "مزاج - Mazaj", nameEn: "Mazaj", logo: "https://cdn.salla.sa/zvExb/h5dIA9Ekdv7l6w6PYZTadSSfjx66rEhx56Clsu5Z.jpg" },
  { handle: "smok", nameAr: "سموك SMOK", nameEn: "SMOK", logo: "https://cdn.salla.sa/zvExb/oUauFEiAkwhFrg9f6EcEIQogLZAYTp0b3XCKvinr.jpg" },
  { handle: "voopoo", nameAr: "فوبو VooPoo", nameEn: "VooPoo", logo: "https://cdn.salla.sa/zvExb/Z4fShTRU619Sho0veBWlA0mk01YwCBjhH6JACW7j.jpg" },
  { handle: "professor-vape", nameAr: "البروفيسور فيب", nameEn: "Professor Vape", logo: "https://cdn.salla.sa/zvExb/Wtev8FDuNDXnTgGiaQBHmAmuU4KyhAuECU5rOQkp.jpg" },
  { handle: "myle", nameAr: "مايلي Myle", nameEn: "Myle", logo: "https://cdn.salla.sa/zvExb/2KnfITvAvaSdMWTfFIlosgIwf6susllDNlanM1B0.png" },
  { handle: "loko-lab", nameAr: "لوكو لاب Loko Lab", nameEn: "Loko Lab", logo: "https://cdn.salla.sa/zvExb/A3AsdoqBj8TSwXeuI5P3gzZo8kCM5irEW2Varxm4.png" },
  { handle: "joosy-world", nameAr: "جوسي ورلد JOOSY WORLD", nameEn: "JOOSY WORLD", logo: "https://cdn.salla.sa/zvExb/kihzbWUXTuvGBlq7qx9EeXKtOtACZknJwTYb4PRM.png" },
  { handle: "rincoe", nameAr: "رينكو Rincoe", nameEn: "Rincoe", logo: "https://cdn.salla.sa/zvExb/0SlhryaZvqfunndaZWvwgaA6OlNg031b3Xi2DHEI.png" },
  { handle: "mega-vape", nameAr: "ميجا فيب - Mega Vape", nameEn: "Mega Vape", logo: "https://cdn.salla.sa/zvExb/dqoLYhvaygDguteeTgbCZ4vbY4lxOlXMfGWDuBB1.jpg" },
  { handle: "cv", nameAr: "نكهات CV", nameEn: "CV", logo: "https://cdn.salla.sa/zvExb/mlDUX8hNiltO077dUw5GaKRbfx5JTIsKqWf3rT67.png" },
  { handle: "ghost-vapes", nameAr: "قوست فيب GHOST VAPES", nameEn: "GHOST VAPES", logo: "https://cdn.salla.sa/zvExb/E40sVONPay2zBDxlwkOgY8a6QaiVjjU1nmT94ahY.png" },
  { handle: "diapple", nameAr: "ديابل Diapple", nameEn: "Diapple", logo: "https://cdn.salla.sa/zvExb/x14fo4gcc8VAEKMWMkvdqTt512kXfyWJBtrdlrgL.png" },
  { handle: "ripe-vapes", nameAr: "ريب فيب RIPE VAPES", nameEn: "RIPE VAPES", logo: "https://cdn.salla.sa/zvExb/atDGtp3WXKRVuSQyTSfK1yX5MkDKw1CqHEUfkMMN.png" },
  { handle: "roll-upz", nameAr: "رول ابز Roll Upz", nameEn: "Roll Upz", logo: "https://cdn.salla.sa/zvExb/nldTYPiwCoZk5jgnNYhqNTys1ua40I2oPdTo9f60.png" },
  { handle: "ecigara", nameAr: "نكهات اي سيجاره eCigara", nameEn: "eCigara", logo: "https://cdn.salla.sa/zvExb/73XPdB85anNvJhsDqnkfoKGrF0DY4jHWPpzaf0Qc.png" },
  { handle: "cloud-breakers", nameAr: "كلاود بريكرز Cloud Breakers", nameEn: "Cloud Breakers", logo: "https://cdn.salla.sa/zvExb/3Q583BZmFxmZ8k5GuJLCYKbck6CUQ4bdsXZz2Utz.png" },
  { handle: "bazooka", nameAr: "بازوكا BAZOOKA", nameEn: "BAZOOKA", logo: "https://cdn.salla.sa/zvExb/yHu0r6Ixt9Tr2RLGXoCMDs0q6w7WBCYafyo53keH.png" },
  { handle: "i-love-salt", nameAr: "اي لوف سولت I Love Salt", nameEn: "I Love Salt", logo: "https://cdn.salla.sa/zvExb/hvuCAQrKJcewD1IICm1zC8pTWaUwhtWyosdCIMct.png" },
  { handle: "naked-100", nameAr: "نيكيد Naked 100", nameEn: "Naked 100", logo: "https://cdn.salla.sa/zvExb/p1ONh3OEkJPaeSHVlRW6esFHuTSk1G75D2sHeyjT.png" },
  { handle: "al-fakher", nameAr: "الفاخر Al Fakher", nameEn: "Al Fakher", logo: "https://cdn.salla.sa/zvExb/I95KZWThbTkwlfA3cyUtfcxj2kTz0mxNasEOOmNz.png" },
  { handle: "bomb", nameAr: "بومب BOMB", nameEn: "BOMB", logo: "https://cdn.salla.sa/zvExb/ykg5kKBoLqixnITWrqw1mqCtCezAhWj4QzQqJFI0.png" },
  { handle: "elf-bar", nameAr: "الف بار Elf Bar", nameEn: "Elf Bar", logo: "https://cdn.salla.sa/zvExb/3m5MlUla9KA7xUimrSZUXRcbMl2OtwQidxR7c4rs.png" },
  { handle: "air-bar", nameAr: "اير بار AIR BAR", nameEn: "AIR BAR", logo: "https://cdn.salla.sa/zvExb/uN2gBmGQPCAMjq37Qmy4zOCdufaxEFxVbcX0JLbu.png" },
  { handle: "raw", nameAr: "راو - RAW", nameEn: "RAW", logo: "https://cdn.salla.sa/zvExb/mNvh3uEtag8Wqpy3GYCBolKR0q59V2tCYXdGTzf6.png" },
  { handle: "ubbs", nameAr: "اوبس - Ubbs", nameEn: "Ubbs", logo: "https://cdn.salla.sa/zvExb/sbvHEjrgBiHa1fOLEsZ74VODapbDODYbjzULQxwh.png" },
  { handle: "velo", nameAr: "فيلو - VELO", nameEn: "VELO", logo: "https://cdn.salla.sa/zvExb/VmbxR0sw8i99fwCNMh28RnyfgSXEoPwBsYuKmALr.png" },
  { handle: "my-shisha", nameAr: "ماي شيشة - My Shisha", nameEn: "My Shisha", logo: "https://cdn.salla.sa/zvExb/yTU66ZCY1qGi9bJzd61rDNGB69bmI4kns2Kl2WJZ.png" },
  { handle: "ruthless", nameAr: "روثلس - Ruthless", nameEn: "Ruthless", logo: "https://cdn.salla.sa/zvExb/KzkRN14p0ZWxbYRgf8m10dhj5UdcfqzyjmpYofxJ.png" },
  { handle: "loaded", nameAr: "لوديد - Loaded", nameEn: "Loaded", logo: "https://cdn.salla.sa/zvExb/ALhBUaZEjHVOc784oGzcuY48KjwjaL9CwgVQOjgu.png" },
  { handle: "white-fox", nameAr: "وايت فوكس - White Fox", nameEn: "White Fox", logo: "https://cdn.salla.sa/zvExb/HvPZY6ocViY0mh48i1im6c0NOUhcmOVZx9GI6P5F.png" },
  { handle: "oxva", nameAr: "اوكسفا - OXVA", nameEn: "OXVA", logo: "https://cdn.salla.sa/zvExb/nfpVWkv9vqQm989X6gd8DD5hx0bUoDC5LIGeLjJL.png" },
  { handle: "ocean-vape", nameAr: "اوشن فيب - Ocean Vape", nameEn: "Ocean Vape", logo: "https://cdn.salla.sa/zvExb/hYpZJyQVX1gtMqLQDOQEibCbjligKnTSJy5GAkyX.png" },
  { handle: "efest", nameAr: "ايفست - Efest", nameEn: "Efest", logo: "https://cdn.salla.sa/zvExb/28BUvdRfKLENVuYTxvWhdp3KmWlnfLWSREERXLXh.png" },
  { handle: "juul", nameAr: "جول - JUUL", nameEn: "JUUL", logo: "https://cdn.salla.sa/zvExb/UzkqTmEt5MNhgifn5XK1bYK8AN3WtEVRFGVPFFSU.png" },
  { handle: "juicy", nameAr: "جوسي - Juicy", nameEn: "Juicy", logo: "https://cdn.salla.sa/zvExb/27CKQ2C3AfJ9k57BrmQWjaDyB3gngVugrwUeKcDt.jpg" },
  { handle: "voug", nameAr: "فوج - VOUG", nameEn: "VOUG", logo: "https://cdn.salla.sa/zvExb/cLSuad9raYaDPLpsA0jcQ6ORmDUpNrtr7iZHxMOm.png" },
  { handle: "phix", nameAr: "فيكس - PHIX", nameEn: "PHIX", logo: "https://cdn.salla.sa/zvExb/hYQONnLmXAFr0oTcaQMcyN1ePI2K6C71an5zzC7s.jpg" },
  { handle: "romana", nameAr: "رمانه - ROMANA", nameEn: "ROMANA", logo: "https://cdn.salla.sa/zvExb/c7ACPKiFeVnqTNImfvjv0WIhRfrYhJQ5OxqP1iOq.png" },
  { handle: "kiwi", nameAr: "كيوي – KIWI", nameEn: "KIWI", logo: "https://cdn.salla.sa/zvExb/gbw35xrYGOKQ7S3uzVOWw626uWC2VfSL67oA4AFV.jpg" },
]

export const getBrandByHandle = (handle: string) =>
  brands.find((brand) => brand.handle === handle)

const normalizeBrandValue = (value?: string | null) =>
  (value || "")
    .trim()
    .normalize("NFKD")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9]+/g, "")
    .toLowerCase()

export const resolveBrand = (value?: string | null) => {
  const normalized = normalizeBrandValue(value)

  if (!normalized) {
    return undefined
  }

  const exactMatch = brands.find((brand) =>
    [brand.handle, brand.nameAr, brand.nameEn]
      .map((candidate) => normalizeBrandValue(candidate))
      .includes(normalized)
  )

  if (exactMatch) {
    return exactMatch
  }

  return brands.find((brand) =>
    [brand.handle, brand.nameAr, brand.nameEn]
      .map((candidate) => normalizeBrandValue(candidate))
      .some(
        (candidate) =>
          candidate &&
          (normalized.includes(candidate) || candidate.includes(normalized))
      )
  )
}

export const getProductBrand = (
  product: Pick<HttpTypes.StoreProduct, "metadata">
) => {
  const metadata = (product.metadata as Record<string, unknown> | null) || {}

  if (typeof metadata.brand_handle === "string") {
    const brand =
      getBrandByHandle(metadata.brand_handle) || resolveBrand(metadata.brand_handle)

    if (brand) {
      return brand
    }
  }

  if (typeof metadata.brand_name_ar === "string") {
    const brand = resolveBrand(metadata.brand_name_ar)

    if (brand) {
      return brand
    }
  }

  if (typeof metadata.brand_name_en === "string") {
    const brand = resolveBrand(metadata.brand_name_en)

    if (brand) {
      return brand
    }
  }

  if (typeof metadata.source_brand === "string") {
    const brand = resolveBrand(metadata.source_brand)

    if (brand) {
      return brand
    }
  }

  return undefined
}

const PRODUCT_BRAND_FIELDS =
  "id,title,handle,created_at,+metadata,*variants.id,*variants.title,*variants.options,*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder"

export const listBrandProductPage = async ({
  countryCode,
  handle,
  limit,
  offset,
}: {
  countryCode: string
  handle: string
  limit: number
  offset: number
}) => {
  const normalizedHandle = handle.trim().toLowerCase()
  const matches: HttpTypes.StoreProduct[] = []
  let pageParam = 1

  while (true) {
    let response: { products: HttpTypes.StoreProduct[]; count: number }
    let nextPage: number | null

    try {
      const result = await listProducts({
        pageParam,
        countryCode,
        queryParams: {
          limit: 100,
          fields: PRODUCT_BRAND_FIELDS,
        },
      })

      response = result.response
      nextPage = result.nextPage
    } catch {
      break
    }

    const pageMatches = (response.products || []).filter(
      (product) => getProductBrand(product)?.handle === normalizedHandle
    )

    matches.push(...pageMatches)

    if (!nextPage) {
      break
    }

    pageParam = nextPage

    if (pageParam > 250) {
      break
    }
  }

  const sortedMatches = sortByAvailability(matches).sort((a, b) => {
    const availabilityDiff =
      Number(isProductInStock(b)) - Number(isProductInStock(a))

    if (availabilityDiff !== 0) {
      return availabilityDiff
    }

    return (
      new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime()
    )
  })

  return {
    brand_handle: normalizedHandle,
    count: sortedMatches.length,
    limit,
    offset,
    product_ids: sortedMatches
      .slice(offset, offset + limit)
      .map((product) => product.id)
      .filter(Boolean),
  }
}
