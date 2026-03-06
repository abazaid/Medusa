 "use client"

import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import { buildProductImageAlt } from "@lib/util/image-alt"
import Image from "next/image"
import { useState } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  productTitle?: string
  locale?: string
}

const ImageGallery = ({ images, productTitle = "", locale = "ar" }: ImageGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const safeImages = images?.length ? images : []
  const activeImage = safeImages[activeIndex] || safeImages[0]

  if (!activeImage) {
    return null
  }

  return (
    <div className="w-full">
      <Container className="relative aspect-[16/14] w-full overflow-hidden rounded-lg border border-slate-200 bg-white">
        {!!activeImage.url && (
          <Image
            src={activeImage.url}
            priority
            className="absolute inset-0"
            alt={buildProductImageAlt({
              productTitle,
              context:
                locale.toLowerCase() === "ar"
                  ? `صورة المنتج ${activeIndex + 1}`
                  : `product image ${activeIndex + 1}`,
              locale,
            })}
            fill
            sizes="(max-width: 768px) 100vw, 58vw"
            style={{
              objectFit: "contain",
            }}
          />
        )}
      </Container>

      {safeImages.length > 1 ? (
        <div className="mt-4 grid grid-cols-6 gap-2">
          {safeImages.slice(0, 12).map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative aspect-square overflow-hidden rounded border ${
                index === activeIndex
                  ? "border-primary-500 ring-2 ring-primary-100"
                  : "border-slate-200"
              }`}
            >
              {!!image.url && (
                <Image
                  src={image.url}
                  alt={buildProductImageAlt({
                    productTitle,
                    context:
                      locale.toLowerCase() === "ar"
                        ? `صورة مصغرة ${index + 1}`
                        : `thumbnail ${index + 1}`,
                    locale,
                  })}
                  fill
                  sizes="80px"
                  style={{ objectFit: "cover" }}
                />
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default ImageGallery
