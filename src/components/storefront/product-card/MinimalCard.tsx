import Image from "next/image";
import Link from "next/link";
import { Price } from "@/components/ui/Price";
import { WishlistButton } from "@/components/storefront/wishlist/WishlistButton";
import type { ProductCardProps } from "./types";

/** Variante minimal: sin badge ni hover-zoom, título en mayúsculas pequeñas. */
export function MinimalCard({ product }: ProductCardProps) {
  const image = product.images[0];
  return (
    <Link href={product.href} className="group flex flex-col gap-2">
      <div className="relative aspect-4/5 overflow-hidden rounded-base bg-surface">
        {image && (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover opacity-95 transition-opacity group-hover:opacity-100"
          />
        )}
        <WishlistButton product={product} className="absolute top-3 right-3" />
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-xs font-medium tracking-widest uppercase">
          {product.title}
        </h3>
        <Price price={product.price} className="text-xs text-muted" />
      </div>
      {!product.available && <p className="text-xs text-muted">Agotado</p>}
    </Link>
  );
}
