import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/storefront/product-grid";
import { getCommerce } from "@/lib/commerce/provider";

export const metadata: Metadata = {
  title: "Productos",
  description: "Todos los productos de la tienda.",
  alternates: { canonical: "/productos" },
};

export default async function ProductosPage() {
  const products = await getCommerce().getProducts({ first: 24 });
  return (
    <Container className="flex flex-col gap-8 py-10">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Productos</h1>
      <ProductGrid products={products} />
    </Container>
  );
}
