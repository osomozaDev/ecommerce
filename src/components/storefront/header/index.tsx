import { variantOf } from "@/theme";
import { headerVariants } from "./variants";
import type { HeaderProps } from "./types";

/**
 * Dispatcher: renderiza la variante indicada por props o, en su defecto,
 * la configurada en el theme del tenant. Mismo patrón en todos los
 * componentes del design system.
 */
export async function Header({ variant, ...props }: HeaderProps & { variant?: string }) {
  const Variant = headerVariants[variant ?? (await variantOf("header"))] ?? headerVariants.default;
  return <Variant {...props} />;
}
