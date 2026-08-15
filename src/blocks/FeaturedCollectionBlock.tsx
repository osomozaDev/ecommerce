import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/storefront/product-grid";
import { getCommerce } from "@/lib/commerce/provider";
import type { Block } from "./types";

/**
 * Bloque con datos: carga la colección server-side vía el provider y entrega
 * ViewModels al grid. El componente visual no sabe de dónde salen.
 */
export async function FeaturedCollectionBlock({
  block,
}: {
  block: Extract<Block, { type: "featuredCollection" }>;
}) {
  const result = await getCommerce().getCollection(block.collection, {
    first: block.first ?? 4,
  });
  if (!result || result.products.length === 0) return null;

  return (
    <section>
      <Container className="flex flex-col gap-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            {block.title ?? result.collection.title}
          </h2>
          <Link
            href={result.collection.href}
            className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Ver todo
          </Link>
        </div>
        <ProductGrid products={result.products} />
      </Container>
    </section>
  );
}
