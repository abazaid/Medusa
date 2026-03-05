import { HttpTypes } from "@medusajs/types"
import { Heading } from "@medusajs/ui"
import { getBrandByHandle, resolveBrand } from "@lib/data/brands"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const sanitizeDescription = (value?: string | null) =>
  (value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/ on\w+="[^"]*"/gi, "")
    .replace(/ on\w+='[^']*'/gi, "")

const ProductInfo = ({ product }: ProductInfoProps) => {
  const descriptionHtml = sanitizeDescription(product.description)
  const metadata = (product.metadata as Record<string, unknown> | null) || {}
  const productBrand =
    (typeof metadata.brand_handle === "string" &&
      getBrandByHandle(metadata.brand_handle)) ||
    (typeof metadata.brand_name_ar === "string" && resolveBrand(metadata.brand_name_ar)) ||
    (typeof metadata.brand_name_en === "string" && resolveBrand(metadata.brand_name_en)) ||
    (typeof metadata.source_brand === "string" && resolveBrand(metadata.source_brand))

  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-4 lg:max-w-[500px] mx-auto">
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-medium text-ui-fg-muted hover:text-ui-fg-subtle"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}
        <Heading
          level="h2"
          className="text-3xl leading-10 text-ui-fg-base"
          data-testid="product-title"
        >
          {product.title}
        </Heading>

        {productBrand && (
          <div>
            <LocalizedClientLink
              href={`/brands/${productBrand.handle}`}
              className="inline-flex rounded-full border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-800 transition-colors hover:border-primary-300 hover:bg-primary-100"
            >
              {productBrand.nameAr}
            </LocalizedClientLink>
          </div>
        )}

        {descriptionHtml ? (
          <div
            className="text-medium text-ui-fg-subtle leading-8 break-words [&_a]:text-primary-700 [&_a]:underline [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-bold [&_iframe]:w-full [&_iframe]:min-h-[220px] [&_iframe]:rounded-2xl [&_li]:mb-2 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pr-6 [&_p]:mb-4 [&_strong]:font-bold [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pr-6"
            data-testid="product-description"
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />
        ) : null}
      </div>
    </div>
  )
}

export default ProductInfo
