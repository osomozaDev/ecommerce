import { variantOf } from "@/theme";
import { cartVariants } from "./variants";

/** El estado del carrito llega por useCart() dentro de la variante, no por props. */
export async function CartView({ variant }: { variant?: string }) {
  const Variant = cartVariants[variant ?? (await variantOf("cart"))] ?? cartVariants.default;
  return <Variant />;
}
