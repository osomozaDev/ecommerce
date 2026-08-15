import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/storefront/product-detail";
import { getCommerce } from "@/lib/commerce/provider";
import { getTenant } from "@/lib/tenant/resolve";
import { JsonLd } from "@/lib/seo/json-ld";
import { breadcrumbJsonLd, productBreadcrumb, productJsonLd } from "@/lib/seo/jsonld";

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
  const product = await getCommerce().getProduct(handle);
  if (!product) notFound();
  const tenant = getTenant();
  return (
    <>
      <JsonLd data={productJsonLd(product, tenant)} />
      <JsonLd data={breadcrumbJsonLd(productBreadcrumb(product), tenant)} />
      <ProductDetail product={product} />
    </>
  );
}
