import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { CartView } from "@/components/storefront/cart";

export const metadata: Metadata = {
  title: "Carrito",
  robots: { index: false, follow: false },
};

export default function CarritoPage() {
  return (
    <Container className="flex flex-col gap-8 py-10">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Carrito</h1>
      <CartView />
    </Container>
  );
}
