import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import { buildProductImageAlt } from "@lib/util/image-alt"
import Image from "next/image"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  productTitle?: string
  locale?: string
}

const ImageGallery = ({ images, productTitle = "", locale = "ar" }: ImageGalleryProps) => {
  return (
    <div className="flex items-start relative">
      <div className="flex flex-col flex-1 small:mx-16 gap-y-4">
        {images.map((image, index) => {
          return (
            <Container
              key={image.id}
              className="relative aspect-[29/34] w-full overflow-hidden bg-ui-bg-subtle"
              id={image.id}
            >
              {!!image.url && (
                <Image
                  src={image.url}
                  priority={index <= 2 ? true : false}
                  className="absolute inset-0 rounded-rounded"
                  alt={buildProductImageAlt({
                    productTitle,
                    context:
                      locale.toLowerCase() === "ar"
                        ? `صورة المنتج ${index + 1}`
                        : `product image ${index + 1}`,
                    locale,
                  })}
                  fill
                  sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
                  style={{
                    objectFit: "cover",
                  }}
                />
              )}
            </Container>
          )
        })}
      </div>
    </div>
  )
}

export default ImageGallery
