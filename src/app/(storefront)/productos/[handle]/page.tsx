import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/storefront/product-detail";
import { getCommerce } from "@/lib/commerce/provider";

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
  return <ProductDetail product={product} />;
}
