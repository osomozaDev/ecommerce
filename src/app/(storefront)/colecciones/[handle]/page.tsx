import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/storefront/product-grid";
import { getCommerce } from "@/lib/commerce/provider";
import { getTenant } from "@/lib/tenant/resolve";
import { JsonLd } from "@/lib/seo/json-ld";
import { breadcrumbJsonLd, collectionBreadcrumb } from "@/lib/seo/jsonld";

interface Props {
  params: Promise<{ handle: string }>;
}

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

export default async function ColeccionPage({ params }: Props) {
  const { handle } = await params;
  const result = await getCommerce().getCollection(handle, { first: 24 });
  if (!result) notFound();
  const { collection, products } = result;

  return (
    <Container className="flex flex-col gap-8 py-10">
      <JsonLd data={breadcrumbJsonLd(collectionBreadcrumb(collection), getTenant())} />
      <div className="flex max-w-2xl flex-col gap-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {collection.title}
        </h1>
        {collection.description && (
          <p className="text-muted">{collection.description}</p>
        )}
      </div>
      <ProductGrid products={products} />
    </Container>
  );
}
