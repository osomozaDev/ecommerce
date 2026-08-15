import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import { ProductGrid } from "@/components/storefront/product-grid";
import { getCommerce } from "@/lib/commerce/provider";

export const metadata: Metadata = {
  title: "Productos",
  description: "Todos los productos de la tienda.",
  // Canonical sin ?mostrar=: las páginas ampliadas no compiten en SEO.
  alternates: { canonical: "/productos" },
};

const PAGE_SIZE = 12;
const MAX_SIZE = 120;

interface Props {
  searchParams: Promise<{ mostrar?: string }>;
}

export default async function ProductosPage({ searchParams }: Props) {
  const { mostrar } = await searchParams;
  const requested = parseInt(mostrar ?? "", 10);
  const first = Number.isFinite(requested)
    ? Math.min(Math.max(requested, PAGE_SIZE), MAX_SIZE)
    : PAGE_SIZE;

  const { products, hasNextPage } = await getCommerce().getProducts({ first });

  return (
    <Container className="flex flex-col gap-8 py-10">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Productos</h1>
      <ProductGrid products={products} />
      {hasNextPage && (
        <div className="flex justify-center">
          <LinkButton
            href={`/productos?mostrar=${first + PAGE_SIZE}`}
            variant="secondary"
          >
            Mostrar más
          </LinkButton>
        </div>
      )}
    </Container>
  );
}
