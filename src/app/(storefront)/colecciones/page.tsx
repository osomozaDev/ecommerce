import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { CollectionCard } from "@/components/storefront/collection-card";
import { getCommerce } from "@/lib/commerce/provider";

export const metadata: Metadata = {
  title: "Colecciones",
  description: "Todas las colecciones de la tienda.",
  alternates: { canonical: "/colecciones" },
};

export default async function ColeccionesPage() {
  const collections = await getCommerce().getCollections();

  return (
    <Container className="flex flex-col gap-8 py-10">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Colecciones
      </h1>
      {collections.length === 0 ? (
        <p className="py-12 text-center text-muted">
          No hay colecciones disponibles.
        </p>
      ) : (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}
    </Container>
  );
}
