import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import { ProductGrid } from "@/components/storefront/product-grid";
import { getCommerce, type GetProductsOptions } from "@/lib/commerce/provider";

export const metadata: Metadata = {
  title: "Productos",
  description: "Todos los productos de la tienda.",
  // Canonical sin parámetros: las variantes ordenadas/ampliadas no compiten en SEO.
  alternates: { canonical: "/productos" },
};

const PAGE_SIZE = 12;
const MAX_SIZE = 120;

const SORT_OPTIONS: { key: string; label: string; sort?: GetProductsOptions["sort"] }[] = [
  { key: "", label: "Relevancia" },
  { key: "novedades", label: "Novedades", sort: "latest" },
  { key: "precio-asc", label: "Precio ↑", sort: "price-asc" },
  { key: "precio-desc", label: "Precio ↓", sort: "price-desc" },
];

interface Props {
  searchParams: Promise<{ mostrar?: string; orden?: string }>;
}

export default async function ProductosPage({ searchParams }: Props) {
  const { mostrar, orden } = await searchParams;
  const requested = parseInt(mostrar ?? "", 10);
  const first = Number.isFinite(requested)
    ? Math.min(Math.max(requested, PAGE_SIZE), MAX_SIZE)
    : PAGE_SIZE;
  const active = SORT_OPTIONS.find((o) => o.key === (orden ?? "")) ?? SORT_OPTIONS[0];

  const { products, hasNextPage } = await getCommerce().getProducts({
    first,
    sort: active.sort,
  });

  const withParams = (opts: { orden?: string; mostrar?: number }) => {
    const params = new URLSearchParams();
    if (opts.orden) params.set("orden", opts.orden);
    if (opts.mostrar) params.set("mostrar", String(opts.mostrar));
    const qs = params.toString();
    return qs ? `/productos?${qs}` : "/productos";
  };

  return (
    <Container className="flex flex-col gap-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Productos</h1>
        <nav aria-label="Ordenar" className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map((option) => (
            <Link
              key={option.key}
              href={withParams({ orden: option.key || undefined })}
              className={`rounded-button border px-3 py-1.5 text-sm transition-colors ${
                option.key === active.key
                  ? "border-ink bg-ink text-bg"
                  : "border-line text-muted hover:border-ink hover:text-ink"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </nav>
      </div>
      <ProductGrid products={products} />
      {hasNextPage && (
        <div className="flex justify-center">
          <LinkButton
            href={withParams({ orden: active.key || undefined, mostrar: first + PAGE_SIZE })}
            variant="secondary"
          >
            Mostrar más
          </LinkButton>
        </div>
      )}
    </Container>
  );
}
