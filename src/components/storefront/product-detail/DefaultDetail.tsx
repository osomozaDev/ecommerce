import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { WishlistButton } from "@/components/storefront/wishlist/WishlistButton";
import { ProductPurchase } from "./ProductPurchase";
import type { ProductDetailProps } from "./types";

/** Galería a la izquierda, información y compra a la derecha. */
export function DefaultDetail({ product }: ProductDetailProps) {
  return (
    <Container className="grid gap-10 py-10 lg:grid-cols-2 lg:gap-16">
      <div className="flex flex-col gap-4">
        {product.images.length > 0 ? (
          product.images.map((image) => (
            <div
              key={image.src}
              className="relative aspect-4/5 overflow-hidden rounded-base bg-surface"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          ))
        ) : (
          <div className="aspect-4/5 rounded-base bg-surface" />
        )}
      </div>

      <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
        <div className="flex flex-col gap-3">
          {product.badge && (
            <div>
              <Badge>{product.badge}</Badge>
            </div>
          )}
          <div className="flex items-start justify-between gap-4">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance">
              {product.title}
            </h1>
            <WishlistButton product={product} className="shrink-0" />
          </div>
        </div>
        <ProductPurchase product={product} />
        <p className="leading-relaxed text-muted">{product.description}</p>
      </div>
    </Container>
  );
}
