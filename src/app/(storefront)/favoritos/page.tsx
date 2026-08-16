import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/storefront/product-grid";
import { getCommerce } from "@/lib/commerce/provider";
import { readWishlist } from "@/lib/wishlist/read";

export const metadata: Metadata = {
  title: "Favoritos",
  robots: { index: false, follow: false },
};

/** Favoritos del visitante: los handles de la cookie, resueltos a productos. */
export default async function FavoritosPage() {
  const handles = await readWishlist();
  const products = (
    await Promise.all(handles.map((handle) => getCommerce().getProduct(handle)))
  ).filter((p) => p !== null);

  return (
    <Container className="py-10">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Favoritos</h1>
      {products.length === 0 ? (
        <p className="mt-6 text-muted">
          Aún no has guardado nada. Toca el corazón de un producto y te esperará aquí.{" "}
          <Link href="/productos" className="underline hover:text-ink">
            Ver productos
          </Link>
        </p>
      ) : (
        <div className="mt-8">
          <ProductGrid products={products} />
        </div>
      )}
    </Container>
  );
}
