import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/storefront/product-grid";
import { getCommerce } from "@/lib/commerce/provider";

export const metadata: Metadata = {
  title: "Buscar",
  // Las páginas de resultados no compiten en SEO.
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function BuscarPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const { products } = query
    ? await getCommerce().getProducts({ first: 24, query })
    : { products: [] };

  return (
    <Container className="flex flex-col gap-8 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {query ? `Resultados para “${query}”` : "Buscar"}
        </h1>
        {query && (
          <p className="text-sm text-muted">
            {products.length === 0
              ? "No hay productos que coincidan."
              : `${products.length} ${products.length === 1 ? "producto" : "productos"}`}
          </p>
        )}
      </div>
      {products.length > 0 && <ProductGrid products={products} />}
    </Container>
  );
}
