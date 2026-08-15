import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import { ProductGrid } from "@/components/storefront/product-grid";
import { FilterBar } from "@/components/storefront/filter-bar";
import {
  filterHref,
  toCatalogOptions,
} from "@/components/storefront/filter-bar/params";
import { getCommerce } from "@/lib/commerce/provider";

export const metadata: Metadata = {
  title: "Productos",
  description: "Todos los productos de la tienda.",
  // Canonical sin parámetros: las variantes filtradas/ampliadas no compiten en SEO.
  alternates: { canonical: "/productos" },
};

const PAGE_SIZE = 12;
const MAX_SIZE = 120;

interface Props {
  searchParams: Promise<{
    mostrar?: string;
    orden?: string;
    stock?: string;
    precio?: string;
  }>;
}

export default async function ProductosPage({ searchParams }: Props) {
  const { mostrar, ...filterParams } = await searchParams;
  const requested = parseInt(mostrar ?? "", 10);
  const first = Number.isFinite(requested)
    ? Math.min(Math.max(requested, PAGE_SIZE), MAX_SIZE)
    : PAGE_SIZE;

  const { products, hasNextPage } = await getCommerce().getProducts({
    first,
    ...toCatalogOptions(filterParams),
  });

  return (
    <Container className="flex flex-col gap-8 py-10">
      <div className="flex flex-col gap-6">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Productos</h1>
        <FilterBar basePath="/productos" params={filterParams} />
      </div>
      <ProductGrid products={products} />
      {hasNextPage && (
        <div className="flex justify-center">
          <LinkButton
            href={filterHref("/productos", filterParams, {}, {
              mostrar: String(first + PAGE_SIZE),
            })}
            variant="secondary"
          >
            Mostrar más
          </LinkButton>
        </div>
      )}
    </Container>
  );
}
