import { ProductCard } from "@/components/storefront/product-card";
import type { ProductGridProps } from "./types";

export function DefaultGrid({ products, cardVariant }: ProductGridProps) {
  if (products.length === 0) {
    return <p className="py-12 text-center text-muted">No hay productos disponibles.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} variant={cardVariant} />
      ))}
    </div>
  );
}
