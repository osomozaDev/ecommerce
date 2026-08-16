import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { WishlistButton } from "@/components/storefront/wishlist/WishlistButton";
import type { ProductCardProps } from "./types";

export function DefaultCard({ product }: ProductCardProps) {
  const image = product.images[0];
  return (
    <Link href={product.href} className="group flex flex-col gap-3">
      <div className="relative aspect-4/5 overflow-hidden rounded-base bg-surface">
        {image && (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        {product.badge && (
          <div className="absolute top-3 left-3">
            <Badge>{product.badge}</Badge>
          </div>
        )}
        <WishlistButton product={product} className="absolute top-3 right-3" />
        {!product.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg/60 text-sm font-medium">
            Agotado
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium">{product.title}</h3>
        <Price
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          className="text-sm text-muted"
        />
      </div>
    </Link>
  );
}
