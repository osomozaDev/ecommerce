import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { ProductDetail } from "@/components/storefront/product-detail";
import { ProductGrid } from "@/components/storefront/product-grid";
import { Reviews } from "@/components/storefront/reviews";
import { getCommerce } from "@/lib/commerce/provider";
import { getTenant } from "@/lib/tenant/resolve";
import { JsonLd } from "@/lib/seo/json-ld";
import { breadcrumbJsonLd, productBreadcrumb, productJsonLd } from "@/lib/seo/jsonld";
import { TrackViewItem } from "@/lib/analytics/TrackViewItem";

interface Props {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const product = await getCommerce().getProduct(handle);
  if (!product) return {};
  return {
    title: product.seo.title,
    description: product.seo.description,
    alternates: { canonical: product.href },
    openGraph: {
      title: product.seo.title,
      description: product.seo.description,
      images: product.images[0] ? [{ url: product.images[0].src }] : undefined,
    },
  };
}

export default async function ProductoPage({ params }: Props) {
  const { handle } = await params;
  const [product, reviews] = await Promise.all([
    getCommerce().getProduct(handle),
    getCommerce().getProductReviews(handle),
  ]);
  if (!product) notFound();
  const [tenant, related] = await Promise.all([
    getTenant(),
    getCommerce().getRelatedProducts(product.id),
  ]);
  return (
    <>
      <JsonLd data={productJsonLd(product, tenant, reviews)} />
      <JsonLd data={breadcrumbJsonLd(productBreadcrumb(product), tenant)} />
      <TrackViewItem product={product} />
      <ProductDetail product={product} />
      <Reviews reviews={reviews} />
      {related.length > 0 && (
        <section aria-label="Productos relacionados">
          <Container className="border-t border-line py-10">
            <h2 className="mb-8 font-heading text-2xl font-semibold tracking-tight">
              También te puede gustar
            </h2>
            <ProductGrid products={related} />
          </Container>
        </section>
      )}
    </>
  );
}
