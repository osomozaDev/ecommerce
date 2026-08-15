import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import { ProductGrid } from "@/components/storefront/product-grid";
import { FilterBar } from "@/components/storefront/filter-bar";
import {
  filterHref,
  toCatalogOptions,
} from "@/components/storefront/filter-bar/params";
import { getCommerce } from "@/lib/commerce/provider";
import { getTenant } from "@/lib/tenant/resolve";
import { JsonLd } from "@/lib/seo/json-ld";
import { breadcrumbJsonLd, collectionBreadcrumb } from "@/lib/seo/jsonld";

interface Props {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{
    mostrar?: string;
    orden?: string;
    stock?: string;
    precio?: string;
  }>;
}

const PAGE_SIZE = 12;
const MAX_SIZE = 120;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const result = await getCommerce().getCollection(handle);
  if (!result) return {};
  const { collection } = result;
  return {
    title: collection.seo.title,
    description: collection.seo.description,
    alternates: { canonical: collection.href },
    openGraph: {
      title: collection.seo.title,
      description: collection.seo.description,
      images: collection.image ? [{ url: collection.image.src }] : undefined,
    },
  };
}

export default async function ColeccionPage({ params, searchParams }: Props) {
  const [{ handle }, { mostrar, ...filterParams }] = await Promise.all([
    params,
    searchParams,
  ]);
  const requested = parseInt(mostrar ?? "", 10);
  const first = Number.isFinite(requested)
    ? Math.min(Math.max(requested, PAGE_SIZE), MAX_SIZE)
    : PAGE_SIZE;

  const result = await getCommerce().getCollection(handle, {
    first,
    ...toCatalogOptions(filterParams),
  });
  if (!result) notFound();
  const { collection, products, hasNextPage } = result;

  return (
    <Container className="flex flex-col gap-8 py-10">
      <JsonLd data={breadcrumbJsonLd(collectionBreadcrumb(collection), await getTenant())} />
      <div className="flex flex-col gap-6">
        <div className="flex max-w-2xl flex-col gap-3">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {collection.title}
          </h1>
          {collection.description && (
            <p className="text-muted">{collection.description}</p>
          )}
        </div>
        <FilterBar basePath={collection.href} params={filterParams} />
      </div>
      <ProductGrid products={products} />
      {hasNextPage && (
        <div className="flex justify-center">
          <LinkButton
            href={filterHref(collection.href, filterParams, {}, {
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
