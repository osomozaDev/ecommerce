import { variantOf } from "@/theme";
import { productGridVariants } from "./variants";
import type { ProductGridProps } from "./types";

export function ProductGrid({
  variant,
  ...props
}: ProductGridProps & { variant?: string }) {
  const Variant =
    productGridVariants[variant ?? variantOf("productGrid")] ??
    productGridVariants.default;
  return <Variant {...props} />;
}
